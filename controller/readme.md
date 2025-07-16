# Controladores

Este directorio alberga las clases encargadas de decidir las acciones que se ejecutan sobre la microgrid.

## RuleBasedControl

El controlador básico es `RuleBasedControl` de la librería `pymgrid`. Se basa en desplegar los módulos controlables siguiendo una lista de prioridades.

### Uso

```python
import requests

# Ejemplo de payload abreviado
payload = {
    "horizon": 24,
    "timestep": 1,
    "components": [
        {"id": "grid1", "type": "GridModule", "params": {"max_import": 100}},
        {"id": "ctrl", "type": "Controller", "params": {"name": "rule_based"}},
    ],
    "controller_config": {
        "priority_list": [["battery", 0], ["grid", 0]]
    }
}

res = requests.post("http://localhost:8000/setup", json=payload)
print(res.json())  # -> {"message": "Microgrid setup completed."}
```

Tambien es posible especificar la lista de prioridades como objetos con las claves
`module` e `index`:

```python
payload["controller_config"] = {
    "priority_list": [
        {"module": "battery", "index": 0},
        {"module": "grid", "index": 0},
    ]
}
```

El método `get_priority_list()` permite consultar el orden de despliegue calculado.

### Endpoints de la API

La API expone las siguientes rutas relacionadas con los controladores:

- `GET  /controller/get_options`: devuelve los controladores disponibles.
- `GET  /controller/config`: obtiene la configuración del controlador activo.

La selección y configuración del controlador se realiza a través del endpoint `/setup` al definir los componentes de la microgrid, como se muestra en el ejemplo anterior.
