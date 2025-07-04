import yaml
from pymgrid import Microgrid
from pymgrid import modules as mod

class MicrogridModel:
    """Wrapper to create and manage a pymgrid Microgrid from YAML configuration."""

    def __init__(self):
        self.microgrid = None
        self.config = None

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
            if ts_key in params:
                import numpy as np
                params[ts_key] = np.array(params[ts_key])
            if cls is mod.UnbalancedEnergyModule and 'raise_errors' not in params:
                params['raise_errors'] = False
            modules.append(cls(**params))
        self.microgrid = Microgrid(modules, add_unbalanced_module=False)

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
        """Return the keys for controllable components."""
        if not self.microgrid:
            return []
        return list(self.microgrid.get_empty_action().keys())

    def get_status(self):
        """Return current state of the microgrid as a dictionary."""
        if not self.microgrid:
            return {}
        return self.microgrid.state_dict

    def run(self, actions):
        """Run one simulation step with provided actions."""
        if not self.microgrid:
            raise RuntimeError("Microgrid is not initialized")
        # obs, reward, done, info = self.microgrid.run(actions, normalized=False)
        # return {
        #     'observation': obs,
        #     'reward': reward,
        #     'done': done,
        #     'info': info,
        # }
        return actions

    def reset(self):
        if self.microgrid:
            self.microgrid.reset()

# Singleton instance used by API
microgrid = MicrogridModel()

