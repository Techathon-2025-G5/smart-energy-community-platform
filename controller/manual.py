from typing import Any
from model.rec_model import microgrid

class ManualController:
    """Controller that executes user-provided actions."""

    def setup(self) -> None:
        """Validate that the microgrid has been initialised."""
        if microgrid.microgrid is None:
            raise RuntimeError("Microgrid is not initialized")

    def get_config(self) -> list:
        """Return an empty configuration list."""
        return []

    def step(self, actions: dict[str, Any]) -> dict[str, Any]:
        """Run one simulation step using *actions*."""
        if microgrid.microgrid is None:
            raise RuntimeError("Microgrid is not initialized")
        obs, reward, done, info = microgrid.microgrid.run(actions, normalized=False)
        result = {
            "action": actions,
            "observation": obs,
            "reward": reward,
            "done": done,
            "info": info,
        }
        return result

    def reset(self) -> None:
        if microgrid.microgrid:
            microgrid.microgrid.reset()
