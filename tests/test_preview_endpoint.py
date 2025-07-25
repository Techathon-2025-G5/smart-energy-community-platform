import sys
import asyncio
from pathlib import Path
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import microgrid
from api.endpoints import preview_model
from api.schemas import ActionRequest


def test_preview_does_not_modify_state():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {"max_import": 10, "max_export": 10, "time_series": [[0, 0, 0, True]]},
            },
            {
                "type": "BatteryModule",
                "params": {
                    "min_capacity": 0,
                    "max_capacity": 10,
                    "max_charge": 2,
                    "max_discharge": 2,
                    "efficiency": 1.0,
                    "init_soc": 0.5,
                },
            },
        ],
    }
    microgrid.setup(config)
    status_before = microgrid.get_status()
    log_before = microgrid.get_log().copy()

    payload = ActionRequest(actions={"grid": [np.array([1.0])], "battery": [np.array([-1.0])]})

    async def call():
        return await preview_model(payload)

    result = asyncio.run(call())

    # Ensure state has not changed
    status_after = microgrid.get_status()
    log_after = microgrid.get_log()
    assert status_after == status_before
    assert log_after.equals(log_before)

    # Preview result should contain expected keys
    assert any("battery" in k for k in result)

    microgrid.reset()


def test_preview_returns_serialized_dict():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {"max_import": 10, "max_export": 10, "time_series": [[0, 0, 0, True]]},
            },
            {
                "type": "BatteryModule",
                "params": {
                    "min_capacity": 0,
                    "max_capacity": 10,
                    "max_charge": 2,
                    "max_discharge": 2,
                    "efficiency": 1.0,
                    "init_soc": 0.5,
                },
            },
        ],
    }
    microgrid.setup(config)

    payload = ActionRequest(actions={"grid": [np.array([0.0])], "battery": [np.array([0.0])]})

    async def call():
        return await preview_model(payload)

    result = asyncio.run(call())

    assert isinstance(result, dict)
    assert all(isinstance(k, str) for k in result.keys())

    microgrid.reset()


def test_preview_log_reflects_post_state():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {"max_import": 10, "max_export": 10, "time_series": [[0, 0, 0, True]]},
            },
            {
                "type": "BatteryModule",
                "params": {
                    "min_capacity": 0,
                    "max_capacity": 10,
                    "max_charge": 2,
                    "max_discharge": 2,
                    "efficiency": 1.0,
                    "init_soc": 0.5,
                },
            },
        ],
    }
    microgrid.setup(config)

    payload = ActionRequest(actions={"grid": [np.array([1.0])], "battery": [np.array([-1.0])]})

    import copy

    mg_copy = copy.deepcopy(microgrid.microgrid)
    mg_copy.run(payload.actions, normalized=False)
    expected = mg_copy.state_dict

    df = microgrid.preview(payload.actions)
    last = df.index.max()
    assert df.loc[last, ("battery", 0, "current_charge")] == expected["battery"][0]["current_charge"]
    assert df.loc[last, ("battery", 0, "soc")] == expected["battery"][0]["soc"]
    assert df.loc[last, ("grid", 0, "grid_status_current")] == expected["grid"][0]["grid_status_current"]

    microgrid.reset()
