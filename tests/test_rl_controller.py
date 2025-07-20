import sys
from pathlib import Path
import numpy as np
import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

pytest.importorskip("stable_baselines3")

from model.rec_model import microgrid
from controller import (
    set_current_controller,
    setup as controller_setup,
    step as controller_step,
    reset as controller_reset,
)


def test_rl_controller_single_step():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {"max_import": 10, "max_export": 10, "time_series": [[0, 0, 0, True]]},
            },
            {"type": "LoadModule", "params": {"time_series": [1, 1]}},
            {"type": "RenewableModule", "params": {"time_series": [1, 1]}},
            {
                "type": "BatteryModule",
                "params": {
                    "min_capacity": 0,
                    "max_capacity": 10,
                    "max_charge": 2,
                    "max_discharge": 2,
                    "efficiency": 0.9,
                    "init_soc": 0.5,
                },
            },
        ],
    }

    microgrid.setup(config)
    set_current_controller("rl")
    controller_setup(train=False, algorithm="ppo")

    result = controller_step()
    assert result["observation"] is not None

    controller_reset()
    microgrid.reset()
