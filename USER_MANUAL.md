# Smart Energy Community Platform User Manual

This document explains how to start the backend and frontend applications and provides a quick overview of the interface.

## Starting the Backend

1. Install the Python dependencies once:
   ```bash
   pip install -r requirements.txt
   ```
2. Launch the FastAPI server with `uvicorn` from the repository root:
   ```bash
   uvicorn api.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

## Starting the Frontend

1. From the `view/microgrid-visualizer` folder install dependencies:
   ```bash
   cd view/microgrid-visualizer
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
   The UI opens at `http://localhost:3000` and connects to the API above.

## Interface Layout

The web interface consists of the following areas:

- **Header controls** – access to global actions such as loading a scenario, saving and the help icon.
- **Module palette** – list of available modules (loads, solar panels, batteries, etc.) that can be dragged to the canvas.
- **Canvas** – central workspace where modules are placed and connected.
- **Detail panel** – shows parameters of the selected module allowing you to configure values.
- **Footer** – play/stop controls and summary metrics.

## Basic Usage

1. **Add modules** by dragging them from the module palette onto the canvas.
2. **Configure parameters** in the detail panel when a module is selected.
3. Use **Step**, **Play**, **Pause** and **Reset** in the footer to run the simulation one step at a time or continuously.
4. The **help icon** in the header opens this manual.

Enjoy exploring different energy setups!
