# Controladores

Este directorio alberga las clases encargadas de decidir las acciones que se ejecutan sobre la microgrid.

## RuleBasedControl

El controlador básico es `RuleBasedControl` de la librería `pymgrid`. Se basa en desplegar los módulos controlables siguiendo una lista de prioridades.

### Uso

```python
from model.rec_model import microgrid
from controller import rule_controller

# Configurar la microgrid previamente
microgrid.setup('config/sample_setup.yaml')

# Iniciar el controlador (se crea automáticamente la lista de prioridades)
rule_controller.setup()

# Ejecutar un paso
result = rule_controller.step()
print(result['observation'], result['reward'])
```

El método `get_priority_list()` permite consultar el orden de despliegue calculado.

### Endpoints de la API

La API expone varias rutas para gestionar los controladores:

- `POST /controller/setup`: configura la microgrid y selecciona el controlador a usar.
- `GET  /controller/get_options`: devuelve los controladores disponibles.
- `GET  /controller/config`: obtiene la configuración del controlador activo.
- `POST /controller/run`: ejecuta un paso de control sobre la microgrid.
- `POST /controller/reset`: reinicia el controlador y la microgrid.
