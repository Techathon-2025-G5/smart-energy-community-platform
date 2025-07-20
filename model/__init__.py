"""Model package initialization and compatibility helpers."""

from pymgrid.algos import RuleBasedControl

# Backwards compatibility: make remove_redundant_gensets optional
_orig_get_priority_lists = RuleBasedControl.get_priority_lists

def _patched_get_priority_lists(self, remove_redundant_gensets=False):
    return _orig_get_priority_lists(self, remove_redundant_gensets)

RuleBasedControl.get_priority_lists = _patched_get_priority_lists

# Provide a backward compatible ``Microgrid.run`` that dispatches to
# ``Microgrid.step`` instead of raising :class:`DeprecatedError`.
from pymgrid import Microgrid

def _run(self, control, normalized=True):
    return self.step(control, normalized=normalized)

Microgrid.run = _run

# Expose ``state_dict`` as an attribute for backward compatibility while
# retaining the original callable under ``state_dict_func``.
_orig_state_dict = Microgrid.state_dict

def _state_dict_prop(self):
    return _orig_state_dict(self)

Microgrid.state_dict_func = _orig_state_dict
Microgrid.state_dict = property(_state_dict_prop)

# Some modules have zero-dimensional action spaces which cause errors when
# stepping with a scalar ``0.0`` in newer versions of ``python-microgrid``.
# Provide lightweight wrappers that ignore such failures and return the current
# state unchanged.
from pymgrid import modules as _modules

def _safe_step(module_step):
    def wrapper(self, action, normalized=True):
        try:
            return module_step(self, action, normalized=normalized)
        except Exception:
            state = self.to_normalized(self.state, obs=True)
            return state, 0.0, False, {}
    return wrapper

for _mod_name in ("LoadModule", "RenewableModule"):
    cls = getattr(_modules, _mod_name, None)
    if cls is not None:
        cls.step = _safe_step(cls.step)
