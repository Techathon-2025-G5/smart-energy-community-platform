from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ComponentParams(BaseModel):
    time_series: Optional[List[Any]] = None
    time_series_profile: Optional[str] = None

    class Config:
        extra = "allow"

class ComponentConfig(BaseModel):
    id: str
    type: str
    params: ComponentParams

class SetupRequest(BaseModel):
    """Payload for configuring the microgrid simulation."""

    components: List[ComponentConfig]
    horizon: int
    timestep: int
    add_unbalanced_module: Optional[bool] = False
    loss_load_cost: Optional[float] = None
    overgeneration_cost: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    # Additional controller parameters (e.g. priority list for rule-based control)
    controller_config: Optional[Dict[str, Any]] = None

class ActionRequest(BaseModel):
    actions: Dict[str, Any]
