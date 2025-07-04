from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ComponentConfig(BaseModel):
    id: str
    type: str
    params: Dict[str, Any]

class SetupRequest(BaseModel):
    components: List[ComponentConfig]
    horizon: int
    timestep: int

class ActionRequest(BaseModel):
    actions: Dict[str, Any]
