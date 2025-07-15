from unittest.mock import patch

from model.rec_model import MicrogridModel


def fake_response(*args, **kwargs):
    class Response:
        status_code = 200

        def json(self):
            hourly = [{"P": i} for i in range(8760)]
            return {"outputs": {"hourly": hourly}}

    return Response()


@patch("data.data_generator.requests.get", side_effect=fake_response)
def test_pvgis_setup(mock_get):
    config = {
        "components": [
            {
                "type": "RenewableModule",
                "params": {
                    "time_series_profile": "PVGIS",
                    "lat": 40.0,
                    "lon": -3.0,
                    "peakpower": 1.0,
                    "loss": 14,
                    "angle": 35,
                    "aspect": 0,
                    "mountingplace": "free",
                    "pvtechchoice": "crystSi",
                    "year": 2023,
                },
            }
        ]
    }

    model = MicrogridModel()
    model.setup(config)

    ts = model.microgrid.modules.renewable[0].time_series
    assert len(ts) == 8760

