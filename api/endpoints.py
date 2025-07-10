from fastapi import APIRouter, Query, HTTPException
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Dict
from pathlib import Path
import json
import yaml

from model.rec_model import microgrid
from controller import (
    load_options as load_controller_options,
    set_current_controller,
    setup as controller_setup,
    get_config as controller_get_config,
    step as controller_step,
    reset as controller_reset,
    has_current_controller,
)
from api.schemas import SetupRequest, ActionRequest

router = APIRouter()


@router.get("/ping")
async def ping():
    """Simple health check endpoint."""
    return {"pong": True}

# Path to the YAML file describing available time series profiles
PROFILES_FILE = Path(__file__).resolve().parent.parent / "data" / "profiles.yaml"

def load_profiles() -> Dict[str, Dict[str, str]]:
    """Load profiles.yaml and return its contents."""
    if not PROFILES_FILE.exists():
        return {}
    with open(PROFILES_FILE, "r") as f:
        data = yaml.safe_load(f) or {}
    return data

@router.post("/setup")
async def setup_model(payload: SetupRequest):
    """Configure the microgrid and optional controller."""
    config = payload.dict(exclude_none=True)
    components = config.get("components", [])
    controller_name = None
    filtered = []
    for comp in components:
        if comp.get("type") == "Controller":
            controller_name = comp.get("params", {}).get("name", "rule_based")
        else:
            filtered.append(comp)
    config["components"] = filtered
    await run_in_threadpool(microgrid.setup, config)
    if controller_name:
        await run_in_threadpool(set_current_controller, controller_name)
        await run_in_threadpool(controller_setup)
    return {"message": "Microgrid setup completed."}

@router.get("/components")
async def get_components(type: Optional[str] = Query(None)):
    return await run_in_threadpool(microgrid.get_components, type=type)

@router.get("/profiles")
async def get_profiles(component: Optional[str] = Query(None)):
    """Return available time series profiles.

    If *component* is provided, only profiles for that component type are
    returned. Valid component types are ``building``, ``house``, ``solar`` and
    ``grid``.
    """
    profiles = await run_in_threadpool(load_profiles)
    if component:
        return profiles.get(component, {})
    return profiles

@router.get("/actions")
async def get_actions():
    return await run_in_threadpool(microgrid.get_actions)

@router.get("/status")
async def get_status():
    status = await run_in_threadpool(microgrid.get_status)
    return microgrid._to_serializable(status)

@router.get("/log")
async def get_log(
    as_frame: bool = Query(True),
    drop_singleton_key: bool = Query(False),
):
    """Return the execution log of the microgrid."""
    log = await run_in_threadpool(
        microgrid.get_log, as_frame, drop_singleton_key
    )
    if hasattr(log, "to_dict"):
        # Convert DataFrame to a serializable structure
        log = log.to_dict()
    if isinstance(log, dict):
        # Ensure dictionary keys are JSON serializable
        log = {json.dumps(k): v for k, v in log.items()}
    return log

@router.post("/run")
async def run_model(payload: ActionRequest | None = None):
    """Execute one simulation step using the controller if present."""
    if has_current_controller():
        raw = await run_in_threadpool(controller_step)
    else:
        if payload is None:
            raise HTTPException(status_code=400, detail="Missing actions for microgrid run")
        raw = await run_in_threadpool(microgrid.run, payload.actions)
    return microgrid._to_serializable(raw)  # type: ignore[attr-defined]

@router.post("/reset")
async def reset_model():
    """Reset the simulation and controller if configured."""
    if has_current_controller():
        await run_in_threadpool(controller_reset)
    else:
        await run_in_threadpool(microgrid.reset)
    return {"message": "Microgrid has been reset."}

@router.get("/controller/get_options")
async def get_controller_options():
    """Return the available controller names."""
    return await run_in_threadpool(load_controller_options)

@router.get("/controller/config")
async def get_config():
    return await run_in_threadpool(controller_get_config)
