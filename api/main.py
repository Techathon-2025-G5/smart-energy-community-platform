"""
pip install fastapi uvicorn
uvicorn api.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router

app = FastAPI(
    title="Simulador de Comunidad Energética",
    version="0.1.0"
)

# Allow requests from the frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
