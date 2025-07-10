from typing import Any, List, Tuple
from pymgrid.algos import RuleBasedControl
from model.rec_model import microgrid

class RuleBasedController:
    """Wrapper around :class:`pymgrid.algos.RuleBasedControl`."""

    def __init__(self) -> None:
        self.rbc: RuleBasedControl | None = None

    def setup(self, priority_list: List[Tuple[str, int]] | None = None) -> None:
        """Initialise the rule based controller for the current microgrid."""
        if microgrid.microgrid is None:
            raise RuntimeError("Microgrid is not initialized")
        self.rbc = RuleBasedControl(microgrid.microgrid, priority_list=priority_list)
        # Ensure the controller operates on the shared microgrid instance
        self.rbc._microgrid = microgrid.microgrid

    def get_config(self) -> list:
        if not self.rbc:
            return []
        # Convert PriorityListElement objects to a simple representation
        result = []
        for element in self.rbc.priority_list:
            module_name, module_number = element.module
            result.append({
                "module": module_name,
                "index": module_number,
                "action": element.action,
            })
        return result

    def step(self) -> dict[str, Any]:
        """Run a single rule based control step."""
        if not self.rbc:
            raise RuntimeError("Controller not initialized")
        action = self.rbc._get_action()  # type: ignore[attr-defined]
        obs, reward, done, info = microgrid.microgrid.run(action, normalized=False)
        result = {
            "action": action,
            "observation": obs,
            "reward": reward,
            "done": done,
            "info": info,
        }
        return result

    def reset(self) -> None:
        if self.rbc:
            self.rbc.reset()
