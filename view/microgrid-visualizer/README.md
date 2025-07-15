# Microgrid Visualizer

Aplicación React que sirve como interfaz para el simulador de microgrid basado en FastAPI. Permite cargar un escenario, ejecutar pasos del modelo y visualizar el estado de la red en tiempo real.

## Puesta en marcha rápida

1. Inicia la API del modelo en la raíz del repositorio:
   ```bash
   pip install fastapi uvicorn
   uvicorn api.main:app --reload
   ```
2. Desde este directorio instala dependencias y arranca el servidor de desarrollo de React:
   ```bash
   npm install
   npm start
   ```
   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).
   Por defecto usará la API local en `http://localhost:8000`. Si quieres apuntar
   a otro servidor (por ejemplo el despliegue en Railway) define la variable de
   entorno `REACT_APP_API_URL` antes de arrancar:
   ```bash
   REACT_APP_API_URL=https://smart-energy-api-production.up.railway.app npm start
   ```

---

## Componentes principales

- **App**: contenedor principal que gestiona la lógica de negocio y orquesta el resto de la interfaz.
- **HeaderControls**: barra superior con botones que disparan las llamadas a la API.
- **ModulePalette**: paleta de módulos (casa, edificio, solar, batería, red) que se pueden arrastrar al lienzo.
- **SimulationCanvas** y **CanvasItem**: área de dibujo donde se colocan los módulos y se pueden mover con `drag & drop`.
- **ComponentDetails**: panel lateral para editar los parámetros de cada módulo y consultar su estado. Los campos de eficiencia e *initial SoC* de la batería se ajustan mediante una barra deslizante entre 0 y 1.
- **EnergyBalance**: gráfico que muestra la generación y el consumo obtenidos periódicamente desde el modelo.
- **Contexto AppState**: almacena el estado global de módulos y selección para todos los componentes.

## Conexión con la API del modelo

El archivo [`src/api/client.js`](src/api/client.js) centraliza las llamadas al backend FastAPI. Los principales endpoints son:

- `POST /setup` – configura la microgrid con un payload similar al de [`sampleSetup.js`](src/api/sampleSetup.js).
- `GET /components` – recupera la lista de componentes existentes.
- `GET /actions` – devuelve las acciones disponibles para cada módulo.
- `GET /status` – obtiene el estado actual del modelo (niveles de batería, consumo, etc.).
- `GET /log` – recupera el histórico de controles y respuestas del microgrid.
- `POST /run` – ejecuta un paso de simulación enviando las acciones deseadas.
- `POST /reset` – reinicia la simulación.

`App.js` utiliza estas funciones para enviar las acciones desde la interfaz y actualizar el resultado mostrado al usuario. El componente `EnergyBalance` consulta de forma periódica el endpoint `/status` para actualizar el gráfico con la generación y el consumo.
### Perfil PVGIS
Para un componente solar puede elegirse el perfil especial `PVGIS`.
La interfaz debe enviar en `params` los campos `lat`, `lon`, `peakpower`, `loss`,
`angle` y `aspect` (más `mountingplace` y `pvtechchoice` opcionales).
Con ellos el backend descargará la serie horaria desde la API PVGIS.


---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
