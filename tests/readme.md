# Tests de la API mediante Postman

Este directorio contiene una coleccion de Postman para validar la API del simulador de microgrid.

## Ejecutar

1. Inicia el servidor FastAPI:
   ```bash
   pip install fastapi uvicorn
   uvicorn api.main:app --reload
   ```
   Por defecto estara disponible en `http://localhost:8000`.

2. Importa `microgrid_postman_collection.json` en Postman.
3. Define una variable de entorno llamada `base_url` con la URL del servidor (`http://localhost:8000`).
4. Ejecuta las peticiones de la coleccion en orden:
   - **Setup**: carga la configuracion de ejemplo.
   - **GET components**
   - **GET actions**
   - **GET status**
   - **Run Step** (envia acciones simples de ejemplo)
   - **Reset**

Un ejemplo de cuerpo para **Run Step** es:

```json
{
  "actions": {
    "genset": [[0, 0]],
    "grid": [0],
    "battery": [0]
  }
}
```

Cada peticion incluye un pequeño test que comprueba que el codigo de respuesta sea `200`.
