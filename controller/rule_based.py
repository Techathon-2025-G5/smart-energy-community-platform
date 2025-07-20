from typing import Any, List, Tuple
from pymgrid.algos import RuleBasedControl
from pymgrid.algos.priority_list import PriorityListElement
from model.rec_model import microgrid

class RuleBasedController:
    """Wrapper around :class:`pymgrid.algos.RuleBasedControl`."""

    def __init__(self) -> None:
        self.rbc: RuleBasedControl | None = None

    def setup(self, priority_list: List[Tuple[str, int]] | None = None) -> None:
        """Initialise the rule based controller for the current microgrid.

        ``priority_list`` can be a list of ``(module, index)`` tuples or a list
        of dictionaries with ``{"module": name, "index": idx}``.
        """
        if microgrid.microgrid is None:
            raise RuntimeError("Microgrid is not initialized")

        prio = None
        if priority_list is not None:
            if len(priority_list) == 0:
                prio = None
            else:
                prio = []
                for item in priority_list:
                    if isinstance(item, dict):
                        module_name = item.get("module")
                        idx = item.get("index")
                        if module_name is None or idx is None:
                            raise ValueError(
                                "Priority list items must include 'module' and 'index'"
                            )
                    else:
                        module_name, idx = item

                    module = microgrid.microgrid.modules[module_name][idx]
                    actions = module.action_space.shape[0]
                    for act in range(actions):
                        prio.append(
                            PriorityListElement(
                                module.name,
                                actions,
                                act,
                                module.marginal_cost,
                            )
                        )
                prio = tuple(prio)
        self.rbc = RuleBasedControl(microgrid.microgrid, priority_list=prio)
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
        action = self.rbc.get_action()  # type: ignore[attr-defined]
        obs, reward, done, info = microgrid.microgrid.step(action, normalized=False)
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
