import sys
from pathlib import Path
import numpy as np

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import microgrid


def test_battery_cycle_cost():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {
                    "max_import": 10,
                    "max_export": 10,
                    "time_series": [[0, 0, 0, 1]],
                },
            },
            {"type": "BatteryModule", "params": {
                "min_capacity": 0,
                "max_capacity": 10,
                "max_charge": 5,
                "max_discharge": 5,
                "efficiency": 1.0,
                "init_soc": 0.5,
                "battery_cost_cycle": 2,
            }},
        ],
    }
    microgrid.setup(config)
    # Charge battery with 3 units from grid
    microgrid.run({"grid": [np.array([3.0])], "battery": [np.array([-3.0])]} )
    df = microgrid.get_log()
    cycle_cost = df[("battery", 0, "cycle_cost")].iloc[-1]
    assert cycle_cost == 6.0
    microgrid.reset()
