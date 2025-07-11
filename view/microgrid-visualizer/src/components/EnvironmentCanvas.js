import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { GRID_ROWS, GRID_COLS } from '../utils/constants';
import streetImg from '../assets/street.png';
import treeImg from '../assets/tree.png';

const DAY_START = 6;
const NIGHT_START = 18;

const skyDay = [135, 206, 235];
const skyNight = [10, 10, 70];
const groundDay = [144, 238, 144];
const groundNight = [0, 100, 0];
const sunDay = [255, 255, 0];
const sunNight = [255, 165, 0];


function lerp(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bC = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bC})`;
}

function toCanvasCoords(row, col, size, h) {
  const x = (col - 1) * size;
  const y = h - row * size;
  return [x, y];
}

export default function EnvironmentCanvas({ cellSize, step, stepEnabled }) {
  const canvasRef = useRef(null);
  const stepRef = useRef(step);

  // keep latest step value for animation loop
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  const width = GRID_COLS * cellSize;
  const height = GRID_ROWS * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const street = new Image();
    street.src = streetImg;
    const tree = new Image();
    tree.src = treeImg;

    // animated progress for day/night cycle
    let progressAnim = 0;

    const draw = () => {
      const hour = stepEnabled
        ? (stepRef.current + DAY_START) % 24
        : DAY_START;

      let target;
      if (hour >= DAY_START && hour < DAY_START + 1) {
        target = hour - DAY_START;
      } else if (hour >= NIGHT_START && hour < NIGHT_START + 1) {
        target = 1 - (hour - NIGHT_START);
      } else if (hour >= DAY_START + 1 && hour < NIGHT_START) {
        target = 1;
      } else {
        target = 0;
      }
      // smooth transition
      progressAnim += (target - progressAnim) * 0.1;
      const progress = progressAnim;

      ctx.clearRect(0, 0, width, height);

      const skyColor = lerp(skyNight, skyDay, progress);
      const groundColor = lerp(groundNight, groundDay, progress);

      // sky
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, width, cellSize * 2);

      const sunRow = 6 + 2 * progress;
      const moonRow = 8 - 2 * progress;
      const [sunX, sunY] = toCanvasCoords(sunRow, 2, cellSize, height);
      const [moonX, moonY] = toCanvasCoords(moonRow, 2, cellSize, height);

      // sun
      ctx.beginPath();
      ctx.fillStyle = lerp(sunNight, sunDay, progress);
      ctx.arc(sunX + cellSize / 2, sunY + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // moon
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(moonX + cellSize / 2, moonY + cellSize / 2, cellSize / 2 - 4, 0, Math.PI * 2);
      ctx.fill();


      // ground drawn after celestial bodies so they hide behind terrain
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, height - cellSize * 6, width, cellSize * 6);

      // street row 2
      if (street.complete) {
        for (let c = 1; c <= GRID_COLS; c += 1) {
          const [x, y] = toCanvasCoords(2, c, cellSize, height);
          ctx.drawImage(street, x, y, cellSize, cellSize);
        }
      } else {
        street.onload = () => draw();
      }

      // trees row 1 col 3..6
      if (tree.complete) {
        for (let c = 3; c <= 6; c += 1) {
          const [x, y] = toCanvasCoords(1, c, cellSize, height);
          ctx.drawImage(tree, x, y, cellSize, cellSize);
        }
      } else {
        tree.onload = () => draw();
      }
    };

    let raf;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [cellSize]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
    />
  );
}

EnvironmentCanvas.propTypes = {
  cellSize: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  stepEnabled: PropTypes.bool.isRequired,
};
