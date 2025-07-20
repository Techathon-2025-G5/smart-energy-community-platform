import sys
from pathlib import Path
import numpy as np
from pymgrid.modules import GridModule, BatteryModule, LoadModule, RenewableModule

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.envs.continuous.continuous import ContinuousMicrogridEnv


def test_env_step_runs():
    modules = [
        GridModule(max_import=10, max_export=5, time_series=np.zeros((2, 4))),
        BatteryModule(min_capacity=0, max_capacity=10, max_charge=2, max_discharge=2, efficiency=1.0, init_soc=0.5),
        LoadModule(time_series=np.array([1, 1])),
        RenewableModule(time_series=np.array([0, 0])),
    ]
    env = ContinuousMicrogridEnv(modules)
    # disable logging to avoid issues with logger signature differences
    env._microgrid_logger.log = lambda *a, **k: None
    env.reset()
    action = env.action_space.sample()
    obs, reward, done, info = env.step(action)
    assert obs is not None
    assert isinstance(reward, float)
