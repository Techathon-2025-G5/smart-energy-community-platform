### Proyecto: **Playground de Gestión Energética para Comunidades Sostenibles**

---

#### 1. Visión general

Construiremos un **simulador interactivo** que represente una comunidad energética formada por hogares y edificios que comparten — o poseen de forma privada — instalaciones solares fotovoltaicas y baterías. La comunidad también puede importar energía de la red pública o de excedentes privados de otros vecinos.
El objetivo del usuario (o del agente de IA) será **satisfacer toda la demanda al menor coste posible**, maximizando el uso de energía renovable y asegurando que **nunca se quede sin suministro**.

---

### Puesta en marcha rápida

1. Lanza la API (FastAPI) desde la raíz del repositorio:
   ```bash
   pip install -r requirements.txt
   uvicorn api.main:app --reload
   ```
   Estará disponible en `http://localhost:8000`.
2. Inicia el frontend en `view/microgrid-visualizer`:
   ```bash
   cd view/microgrid-visualizer
   npm install
   npm start
   ```
   Por defecto el frontend consulta la API local. Para usar un servidor remoto
   define la variable `REACT_APP_API_URL`, por ejemplo:
   ```bash
   REACT_APP_API_URL=https://smart-energy-api-production.up.railway.app npm start
   ```
3. Puedes abrir el manual de usuario directamente desde el visualizador haciendo clic en el icono "?" de la barra superior.

---

#### 2. Componentes principales

| Módulo                      | Función                                                                                                                         | Tecnologías clave                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Motor de simulación**     | Modela generación, almacenamiento y consumo en pasos de tiempo discretos.                                                       | [`python-microgrid`](https://python-microgrid.readthedocs.io) como núcleo; NumPy/Pandas. |
| **Motor de decisiones**     | Selecciona cuándo cargar/descargar baterías y cuándo importar/exportar energía (reglas fijas, heurísticas o RL).                | Algoritmos de reglas, *Deep Q-Learning* / *PPO* con Stable-Baselines3.                   |
| **Frontend “estilo juego”** | Visualiza en tiempo real barras de generación, consumo y estado de baterías; muestra costes acumulados y KPI de sostenibilidad. | React + D3; WebSockets/FASTAPI para streaming de datos.                         |
| **API / Backend**           | Expone endpoints REST/WS para que el frontend reciba la simulación en vivo y envíe acciones.                                    | FastAPI, Pydantic.                                                                       |
| **Gestor de escenarios**    | Permite definir tipos de viviendas, tarifas, tamaños de batería, perfiles solares y climáticos.                                 | Archivos YAML/JSON; interfaz gráfica sencilla.                                           |

### Perfiles de series temporales

Los parámetros de cada componente aceptan el nuevo campo `time_series_profile`.
Si se indica un nombre de archivo (por ejemplo `NewYork_744860TYA.csv`), se
cargará automáticamente desde las carpetas `data/load`, `data/pv` o `data/co2`
y sustituirá al listado manual de `time_series`.

Los perfiles disponibles se describen en `data/profiles.yaml`. La API expone el
endpoint `GET /profiles` (opcionalmente con el parámetro `component`) para
consultar qué perfiles existen para cada tipo de componente.
Adicionalmente, existe el perfil **PVGIS** para módulos solares.
Al seleccionarlo se deben indicar en los parámetros `lat`, `lon`, `peakpower`,
`loss`, `angle` y `aspect` (opcionalmente `mountingplace` y `pvtechchoice`).
La serie horaria se descarga automáticamente desde la API PVGIS.

Para obtener una vista previa de un paso de simulación sin modificar el estado
actual, la API dispone del endpoint `POST /preview` que acepta el mismo payload
que `/run` y devuelve el log resultante.

---

#### 3. Flujo de juego / simulación

1. **Configuración**

   * El usuario elige número y tipo de viviendas, potencia FV, capacidad de baterías y tarifas (grid vs. excedente privado).
2. **Ejecución paso a paso**

   * El simulador calcula generación/consumo horario (o cada 15 min).
   * El agente decide acciones → el motor actualiza estados.
3. **Feedback visual**

   * Barras animadas para generación, demanda y carga de baterías.
   * Minimapa de la comunidad con iconos solares/baterías que “brillan” según actividad.
4. **Resultados y métricas**

   * Coste total (€), % de renovable usada, CO₂ evitado, eventos de falta de energía (deben ser 0).
   * Históricos descargables (CSV) para análisis posterior.

---

#### 4. Enfoques de control

* **Políticas deterministas**:

  * “Carga batería cuando haya excedente solar; descarga solo si precio de red > X”.
* **IA con aprendizaje por refuerzo**:

  * Estado = \[irradiancia prevista, demanda prevista, nivel batería, precios].
  * Acción = {tasa de carga, tasa de descarga, solicitar grid}.
  * Recompensa = − coste − penalización fuerte si energía < 0.

Se pueden comparar reglas vs. RL en un “torneo” de escenarios.

---

#### 5. División de trabajo (paralelizable)

| Equipo                     | Entregable                                                               |
| -------------------------- | ------------------------------------------------------------------------ |
| **Simulación & datos**     | Adaptar `python-microgrid`; generar perfiles solares/demanda sintéticos. |
| **Agentes & optimización** | Implementar políticas fijas + entrenar RL; benchmarking.                 |
| **Frontend**               | UI React con visualizaciones; integración WebSocket.                     |
| **DevOps & pruebas**       | Dockerización, CI/CD, tests unitarios, métricas de cobertura.            |

---

#### 6. Roadmap incremental

1. **MVP (Semana 1-2)**

   * Simulación básica de un solo día, reglas simples, gráfico de barras en tiempo real.
2. **Versión 0.2**

   * Escenarios multi-día con tarifas dinámicas; selector de parámetros en UI.
3. **Versión 0.3**

   * Agente RL entrenado; ranking comparativo reglas vs. IA.
4. **Versión 1.0 (Demo Techathon)**

   * Comunidad completa, animaciones tipo *city-builder*, exporte informes PDF/CSV.

---

#### 7. Impacto y extensiones

* **Educación**: servir como laboratorio docente para cursos de renovables y smart-grids.
* **Investigación**: probar algoritmos de gestión antes de implementarlos en hardware real.
* **Escalabilidad**: añadir eólica, VE (vehículo eléctrico), precios spot, mercados P2P.

---

### Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para mas detalles.
