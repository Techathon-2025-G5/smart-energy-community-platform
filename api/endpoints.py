from fastapi import APIRouter, Query
from typing import Optional

from model.rec_model import microgrid
from controller import rule_controller
from api.schemas import SetupRequest, ActionRequest

router = APIRouter()

@router.post("/setup")
def setup_model(payload: SetupRequest):
    microgrid.setup(payload.dict())
    return {"message": "Microgrid setup completed."}

@router.get("/components")
def get_components(type: Optional[str] = Query(None)):
    return microgrid.get_components(type=type)

@router.get("/actions")
def get_actions():
    return microgrid.get_actions()

@router.get("/status")
def get_status():
    return microgrid.get_status()

@router.post("/run")
def run_model(payload: ActionRequest):
    return microgrid.run(payload.actions)

@router.post("/reset")
def reset_model():
    microgrid.reset()
    return {"message": "Microgrid has been reset."}


@router.post("/controller/setup")
def setup_controller():
    """Initialize rule based controller."""
    rule_controller.setup()
    return {"message": "Controller initialized."}


@router.get("/controller/priority-list")
def get_priority_list():
    return rule_controller.get_priority_list()


@router.post("/controller/run")
def run_controller():
    return rule_controller.step()


@router.post("/controller/reset")
def reset_controller():
    rule_controller.reset()
    return {"message": "Controller reset."}
