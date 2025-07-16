import sys
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import microgrid
from controller import (
    set_current_controller,
    setup as controller_setup,
    reset as controller_reset,
)
from api.endpoints import run_model
from api.schemas import ActionRequest
import numpy as np


def test_manual_controller_step():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {
                    "max_import": 10,
                    "max_export": 10,
                    "time_series": [[0, 0, 0, True]],
                },
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
    set_current_controller("manual")
    controller_setup()

    payload = ActionRequest(
        actions={"grid": [np.array([0.0])], "battery": [np.array([0.0])]}
    )

    async def run():
        return await run_model(payload)

    result = asyncio.run(run())
    assert "observation" in result

    controller_reset()
    microgrid.reset()
