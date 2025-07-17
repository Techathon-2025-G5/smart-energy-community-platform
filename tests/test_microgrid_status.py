import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import microgrid


def test_microgrid_status_totals():
    config = {
        "components": [
            {"type": "LoadModule", "params": {"time_series": [1]}},
            {"type": "RenewableModule", "params": {"time_series": [2]}},
        ]
    }
    microgrid.setup(config)
    status = microgrid.get_status()

    load_sum = sum(
        item.get("load_current")
        for item in status.get("load", [])
        if item is not None and item.get("load_current") is not None
    )
    ren_sum = sum(
        item.get("renewable_current")
        for item in status.get("renewable", [])
        if item is not None and item.get("renewable_current") is not None
    )

    assert "total" in status
    total = status["total"][0]
    assert total["loads"] == load_sum
    assert total["renewables"] == ren_sum

    microgrid.reset()
