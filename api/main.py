"""
pip install fastapi uvicorn
uvicorn api.main:app --reload
"""

from fastapi import FastAPI
from api.endpoints import router

app = FastAPI(
    title="Simulador de Comunidad Energética",
    version="0.1.0"
)

app.include_router(router)
