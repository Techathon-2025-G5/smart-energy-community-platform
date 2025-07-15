import os
import sys
from pathlib import Path
from unittest.mock import patch, Mock

import numpy as np

# Set backend before importing modules that may use matplotlib
os.environ.setdefault('MPLBACKEND', 'Agg')

# Ensure project root is on sys.path
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from model.rec_model import MicrogridModel


# Fake PVGIS hourly dataset with three hours
fake_hourly = [{"P": 1.0}, {"P": 2.0}, {"P": 3.0}]


def fake_requests_get(url, params=None):
    response = Mock()
    response.status_code = 200
    response.json.return_value = {"outputs": {"hourly": fake_hourly}}
    return response


def test_pvgis_profile_setup():
    config = {
        "components": [
            {
                "type": "RenewableModule",
                "params": {
                    "time_series_profile": "PVGIS",
                    "lat": 1,
                    "lon": 2,
                    "peakpower": 3,
                    "loss": 0,
                    "angle": 0,
                    "aspect": 0,
                },
            }
        ]
    }
    with patch("data.data_generator.requests.get", fake_requests_get):
        model = MicrogridModel()
        model.setup(config)

    modules = model.microgrid.modules
    assert "renewable" in modules.to_dict()
    renewable_module = modules["renewable"][0]
    assert isinstance(renewable_module.time_series, np.ndarray)
    assert len(renewable_module.time_series) == len(fake_hourly)
