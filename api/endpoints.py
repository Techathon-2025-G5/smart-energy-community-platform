from fastapi import APIRouter, Query
from typing import Optional

from model.rec_model import microgrid
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
    result = microgrid.run(payload.actions)
    return result

@router.post("/reset")
def reset_model():
    microgrid.reset()
    return {"message": "Microgrid has been reset."}
