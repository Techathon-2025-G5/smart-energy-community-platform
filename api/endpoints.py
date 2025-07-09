from fastapi import APIRouter, Query
from fastapi.concurrency import run_in_threadpool
from typing import Optional, Dict
from pathlib import Path
import yaml

from model.rec_model import microgrid
from controller import rule_controller
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
    config = payload.dict(exclude_none=True)
    await run_in_threadpool(microgrid.setup, config)
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
    return await run_in_threadpool(microgrid.get_status)


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
    return log

@router.post("/run")
async def run_model(payload: ActionRequest):
    raw = await run_in_threadpool(microgrid.run, payload.actions)
    return microgrid._to_serializable(raw)  # type: ignore[attr-defined]

@router.post("/reset")
async def reset_model():
    await run_in_threadpool(microgrid.reset)
    return {"message": "Microgrid has been reset."}


@router.post("/controller/setup")
async def setup_controller():
    """Initialize rule based controller."""
    await run_in_threadpool(rule_controller.setup)
    return {"message": "Controller initialized."}


@router.get("/controller/priority-list")
async def get_priority_list():
    return await run_in_threadpool(rule_controller.get_priority_list)


@router.post("/controller/run")
async def run_controller():
    raw = await run_in_threadpool(rule_controller.step)
    return microgrid._to_serializable(raw)


@router.post("/controller/reset")
async def reset_controller():
    await run_in_threadpool(rule_controller.reset)
    return {"message": "Controller reset."}
