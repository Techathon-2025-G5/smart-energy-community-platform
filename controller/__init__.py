"""Controllers for microgrid operation."""

from __future__ import annotations

from pathlib import Path
import importlib
import yaml

from .rule_based import RuleBasedController

# Backwards compatible singleton for the basic rule based controller
rule_controller = RuleBasedController()

# ---------------------------------------------------------------------------
# Generic controller registry utilities
# ---------------------------------------------------------------------------

# Path to the YAML file that enumerates available controllers
CONTROLLERS_FILE = Path(__file__).resolve().parent / "controllers.yaml"

# Currently loaded controller instance
_current_controller: RuleBasedController | None = None


def load_options() -> dict:
    """Return the dictionary of available controllers from ``controllers.yaml``."""
    if not CONTROLLERS_FILE.exists():
        return {}
    with open(CONTROLLERS_FILE, "r") as f:
        return yaml.safe_load(f) or {}


def create_controller(name: str):
    """Instantiate a controller class given its registry name."""
    options = load_options()
    if name not in options:
        raise ValueError(f"Unknown controller: {name}")
    info = options[name]
    module = importlib.import_module(info["module"])
    cls = getattr(module, info["class"])
    return cls()


def set_current_controller(name: str):
    """Create and store the controller specified by *name*."""
    global _current_controller
    _current_controller = create_controller(name)
    return _current_controller


def get_current_controller() -> RuleBasedController:
    """Return the active controller instance."""
    if _current_controller is None:
        raise RuntimeError("Controller not initialized")
    return _current_controller


def setup(*args, **kwargs):
    return get_current_controller().setup(*args, **kwargs)


def get_config():
    return get_current_controller().get_config()


def step():
    return get_current_controller().step()


def reset():
    return get_current_controller().reset()

