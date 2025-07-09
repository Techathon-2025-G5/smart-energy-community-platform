import yaml
from pathlib import Path
import pandas as pd
import json
from pymgrid import Microgrid
from pymgrid import modules as mod

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
            raise FileNotFoundError(
                f"Profile {profile} not defined in {profiles_file}"
            )

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
                if '\n' not in config and not config.strip().startswith('{'):
                    with open(config, 'r') as f:
                        config = yaml.safe_load(f)
                else:
                    config = yaml.safe_load(config)
            except FileNotFoundError:
                config = yaml.safe_load(config)
        self.config = config
        modules = []
        for comp in config.get('components', []):
            comp_type = comp.get('type')
            params = comp.get('params', {})
            cls = getattr(mod, comp_type, None)
            if cls is None:
                raise ValueError(f"Unknown component type: {comp_type}")
            ts_key = 'time_series'
            profile_key = 'time_series_profile'
            if profile_key in params:
                params[ts_key] = self._load_profile(params.pop(profile_key))
            if ts_key in params:
                import numpy as np
                params[ts_key] = np.array(params[ts_key])
            # UnbalancedEnergyModule is now configured outside of components
            if cls is mod.UnbalancedEnergyModule:
                # support legacy configs but skip adding as regular module
                if 'raise_errors' not in params:
                    params['raise_errors'] = False
                # store parameters to use when creating the microgrid
                config.setdefault('add_unbalanced_module', True)
                config.setdefault('loss_load_cost', params.get('loss_load_cost', 10.0))
                config.setdefault('overgeneration_cost', params.get('overgeneration_cost', 2.0))
                continue
            modules.append(cls(**params))

        add_unbalanced = config.get('add_unbalanced_module', False)
        loss_cost = config.get('loss_load_cost', 10.0)
        over_cost = config.get('overgeneration_cost', 2.0)
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
            comps.append({'id': comp_id, 'type': module.__class__.__name__})
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
        return self.microgrid.get_log(
            as_frame=as_frame, drop_singleton_key=drop_singleton_key
        )
    
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
            'observation': obs,
            'reward': reward,
            'done': done,
            'info': info,
        }
        return result

    def reset(self):
        if self.microgrid:
            self.microgrid.reset()

            
# Singleton instance used by API
microgrid = MicrogridModel()

