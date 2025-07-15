import yaml
from pathlib import Path
import pandas as pd
import json
from pymgrid import Microgrid
from pymgrid import modules as mod
from data import data_generator


class MicrogridModel:
    """Wrapper to create and manage a pymgrid Microgrid from YAML configuration."""

    def __init__(self):
        self.microgrid = None
        self.config = None

    def _load_profile(self, profile: str):
        """Load a time series profile by name using ``profiles.yaml``."""
        data_dir = Path(__file__).resolve().parent.parent / "data"
        profiles_file = data_dir / "profiles.yaml"

        if not profiles_file.exists():
            raise FileNotFoundError(f"Profiles file not found: {profiles_file}")

        with open(profiles_file, "r") as f:
            profiles = yaml.safe_load(f) or {}

        rel_path = None
        for category in profiles.values():
            if isinstance(category, dict) and profile in category:
                rel_path = category[profile]
                break

        if rel_path is None:
            raise FileNotFoundError(f"Profile {profile} not defined in {profiles_file}")

        file_path = data_dir / rel_path
        if not file_path.exists():
            raise FileNotFoundError(f"Profile file not found: {file_path}")

        if file_path.suffix.lower() == ".csv":
            df = pd.read_csv(file_path)
            return df.values
        if file_path.suffix.lower() in {".json", ".jsn"}:
            with open(file_path, "r") as f:
                return json.load(f)

        raise ValueError(f"Unsupported profile file format: {file_path.suffix}")

    def setup(self, config):
        """Setup the microgrid from a dictionary or YAML string/path."""
        if isinstance(config, str):
            try:
                if "\n" not in config and not config.strip().startswith("{"):
                    with open(config, "r") as f:
                        config = yaml.safe_load(f)
                else:
                    config = yaml.safe_load(config)
            except FileNotFoundError:
                config = yaml.safe_load(config)
        self.config = config
        modules = []
        for comp in config.get("components", []):
            comp_type = comp.get("type")
            params = comp.get("params", {})
            cls = getattr(mod, comp_type, None)
            if cls is None:
                raise ValueError(f"Unknown component type: {comp_type}")
            ts_key = "time_series"
            profile_key = "time_series_profile"
            if profile_key in params and params[profile_key] == "PVGIS":
                pvgis_fields = [
                    "lat",
                    "lon",
                    "peakpower",
                    "loss",
                    "angle",
                    "aspect",
                    "mountingplace",
                    "pvtechchoice",
                    "year",
                ]
                pvgis_required = ["lat", "lon", "peakpower", "loss", "angle", "aspect"]
                pvgis_params = {}
                for f in pvgis_fields:
                    if f in params:
                        pvgis_params[f] = params.pop(f)
                for f in pvgis_required:
                    if f not in pvgis_params:
                        raise ValueError(f"Missing PVGIS parameter: {f}")
                params[ts_key] = data_generator.pv_data_generator(**pvgis_params)
                params.pop(profile_key, None)
            elif profile_key in params:
                params[ts_key] = self._load_profile(params.pop(profile_key))
            if ts_key in params:
                import numpy as np

                params[ts_key] = np.array(params[ts_key])
            # UnbalancedEnergyModule is now configured outside of components
            if cls is mod.UnbalancedEnergyModule:
                # support legacy configs but skip adding as regular module
                if "raise_errors" not in params:
                    params["raise_errors"] = False
                # store parameters to use when creating the microgrid
                config.setdefault("add_unbalanced_module", True)
                config.setdefault("loss_load_cost", params.get("loss_load_cost", 10.0))
                config.setdefault(
                    "overgeneration_cost", params.get("overgeneration_cost", 2.0)
                )
                continue
            modules.append(cls(**params))

        add_unbalanced = config.get("add_unbalanced_module", False)
        loss_cost = config.get("loss_load_cost", 10.0)
        over_cost = config.get("overgeneration_cost", 2.0)
        self.microgrid = Microgrid(
            modules,
            add_unbalanced_module=add_unbalanced,
            loss_load_cost=loss_cost,
            overgeneration_cost=over_cost,
        )

    def get_components(self, type=None):
        """Return basic info about components in the microgrid."""
        if not self.microgrid:
            return []
        comps = []
        for name, module in self.microgrid.modules.to_tuples():
            if type and module.__class__.__name__ != type:
                continue
            idx = module.name[1]
            comp_id = f"{name}{'' if idx is None else '_' + str(idx)}"
            comps.append({"id": comp_id, "type": module.__class__.__name__})
        return comps

    def get_actions(self):
        """Return the controllable components."""
        if not self.microgrid:
            return []
        return self.microgrid.get_empty_action()

    def get_status(self):
        """Return current state of the microgrid as a dictionary."""
        if not self.microgrid:
            return {}
        return self.microgrid.state_dict

    def get_log(self, as_frame: bool = True, drop_singleton_key: bool = False):
        """Return the history state of the microgrid.

        Parameters
        ----------
        as_frame : bool, optional
            Whether to return the log as a :class:`pandas.DataFrame`. If ``False``
            a nested dictionary is returned. Defaults to ``True``.
        drop_singleton_key : bool, optional
            Whether to drop the index level enumerating modules if each module
            name only has one instance. Defaults to ``False``.
        """
        if not self.microgrid:
            return {} if as_frame else {}

        # Always get the log as a DataFrame so we can post-process it
        df = self.microgrid.get_log(
            as_frame=True, drop_singleton_key=drop_singleton_key
        )

        if not df.empty and ("balancing", 0, "loss_load") in df.columns:
            loss = df[("balancing", 0, "loss_load")].copy()

            # Identify existing load modules ordered by descending number
            load_numbers = sorted(
                set(idx[1] for idx in df.columns if idx[0] == "load"),
                reverse=True,
            )

            deductions = {n: pd.Series(0, index=df.index) for n in load_numbers}

            # Subtract unmet demand from loads starting from highest module id
            for n in load_numbers:
                col = ("load", n, "load_met")
                if col not in df.columns:
                    continue
                deduction = pd.concat([df[col], loss], axis=1).min(axis=1)
                df[col] = df[col] - deduction
                loss = loss - deduction
                deductions[n] = deduction

            if ("balancing", 0, "reward") in df.columns and load_numbers:
                reward = df[("balancing", 0, "reward")]
                ded_df = pd.DataFrame(deductions)
                total = ded_df.sum(axis=1)
                total_nonzero = total.replace(0, 1)
                for n in load_numbers:
                    reward_share = reward * ded_df[n] / total_nonzero
                    load_reward_col = ("load", n, "reward")
                    if load_reward_col in df.columns:
                        df[load_reward_col] = df[load_reward_col] + reward_share

                df[("balancing", 0, "reward")] = 0

        # Compute earnings and spending for grid modules before totals
        if not df.empty:
            grid_numbers = sorted({idx[1] for idx in df.columns if idx[0] == "grid"})
            for n in grid_numbers:
                export_col = ("grid", n, "grid_export")
                import_col = ("grid", n, "grid_import")
                export_price_col = ("grid", n, "export_price_current")
                import_price_col = ("grid", n, "import_price_current")

                if export_col in df.columns and export_price_col in df.columns:
                    earn_col = ("grid", n, "grid_earn")
                    df[earn_col] = df[export_col] * df[export_price_col]
                else:
                    earn_col = None

                if import_col in df.columns and import_price_col in df.columns:
                    spent_col = ("grid", n, "grid_spent")
                    df[spent_col] = df[import_col] * df[import_price_col]
                else:
                    spent_col = None

                if earn_col and spent_col:
                    balance_col = ("grid", n, "grid_balance")
                    df[balance_col] = df[earn_col] - df[spent_col]

        # Compute totals across components of the same type
        if not df.empty:
            totals = (
                df.T.groupby(level=["module_name", "field"]).sum().T
            )
            totals.columns = pd.MultiIndex.from_tuples(
                [
                    ("totals", mod, field)
                    for mod, field in totals.columns.to_list()
                ],
                names=df.columns.names,
            )
            df = pd.concat([df, totals], axis=1)

        if as_frame:
            return df

        return df.to_dict()

    def get_totals(
        self,
        *,
        as_frame: bool = True,
        drop_singleton_key: bool = False,
    ):
        """Return cumulative totals of the microgrid log columns."""
        df = self.get_log(as_frame=True, drop_singleton_key=drop_singleton_key)
        if isinstance(df, pd.DataFrame) and not df.empty:
            totals = df.sum(axis=0)
            totals_df = totals.to_frame().T
            totals_df.index = ["total"]
        else:
            totals_df = pd.DataFrame()
        if as_frame:
            return totals_df
        return totals_df.to_dict()

    def _to_serializable(self, obj):
        """Recursively convert numpy types to Python built-ins."""
        import numpy as np

        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.generic):
            return obj.item()
        if isinstance(obj, dict):
            return {k: self._to_serializable(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self._to_serializable(v) for v in obj]
        return obj

    def run(self, actions):
        """Run one simulation step with provided actions."""
        if not self.microgrid:
            raise RuntimeError("Microgrid is not initialized")
        obs, reward, done, info = self.microgrid.run(actions, normalized=False)
        result = {
            "observation": obs,
            "reward": reward,
            "done": done,
            "info": info,
        }
        return result

    def reset(self):
        if self.microgrid:
            self.microgrid.reset()


# Singleton instance used by API
microgrid = MicrogridModel()
