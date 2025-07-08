from fastapi import APIRouter, Query
from fastapi.concurrency import run_in_threadpool
from typing import Optional

from model.rec_model import microgrid
from controller import rule_controller
from api.schemas import SetupRequest, ActionRequest

router = APIRouter()

@router.post("/setup")
async def setup_model(payload: SetupRequest):
    await run_in_threadpool(microgrid.setup, payload.dict())
    return {"message": "Microgrid setup completed."}

@router.get("/components")
async def get_components(type: Optional[str] = Query(None)):
    return await run_in_threadpool(microgrid.get_components, type=type)

@router.get("/actions")
async def get_actions():
    return await run_in_threadpool(microgrid.get_actions)

@router.get("/status")
async def get_status():
    return await run_in_threadpool(microgrid.get_status)

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
