import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import microgrid
from controller import (
    set_current_controller,
    setup as controller_setup,
    get_config as controller_get_config,
    reset as controller_reset,
)
from pymgrid.algos import RuleBasedControl


def test_rule_based_setup_with_dict_priority_list():
    config = {
        "horizon": 1,
        "timestep": 1,
        "components": [
            {
                "type": "GridModule",
                "params": {
                    "max_import": 10,
                    "max_export": 10,
                    "time_series": [[0.0, 0.0, 0.0, True]],
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
    rbc = RuleBasedControl(microgrid.microgrid)
    default_pl = rbc.get_priority_lists()[0]
    prio = []
    for el in default_pl:
        mod_name, idx = el.module
        prio.append({"module": mod_name, "index": idx})

    set_current_controller("rule_based")
    controller_setup(priority_list=prio)

    cfg = controller_get_config()
    assert any(item["module"] == "battery" for item in cfg)

    controller_reset()
    microgrid.reset()
