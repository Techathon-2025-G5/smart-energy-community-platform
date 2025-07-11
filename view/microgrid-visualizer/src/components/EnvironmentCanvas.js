import React, { useRef, useEffect } from 'react';
import { GRID_SIZE, GRID_ROWS, GRID_COLS } from '../utils/constants';
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

const width = GRID_COLS * GRID_SIZE;
const height = GRID_ROWS * GRID_SIZE;

function lerp(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bC = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bC})`;
}

function toCanvasCoords(row, col) {
  const x = (col - 1) * GRID_SIZE;
  const y = height - row * GRID_SIZE;
  return [x, y];
}

export default function EnvironmentCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const street = new Image();
    street.src = streetImg;
    const tree = new Image();
    tree.src = treeImg;

    const draw = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;

      let progress;
      if (hour >= DAY_START && hour < DAY_START + 1) {
        progress = hour - DAY_START;
      } else if (hour >= NIGHT_START && hour < NIGHT_START + 1) {
        progress = 1 - (hour - NIGHT_START);
      } else if (hour >= DAY_START + 1 && hour < NIGHT_START) {
        progress = 1;
      } else {
        progress = 0;
      }

      ctx.clearRect(0, 0, width, height);

      const skyColor = lerp(skyNight, skyDay, progress);
      const groundColor = lerp(groundNight, groundDay, progress);

      // ground
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, height - GRID_SIZE * 6, width, GRID_SIZE * 6);
      // sky
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, width, GRID_SIZE * 2);

      // street row 2
      if (street.complete) {
        for (let c = 1; c <= GRID_COLS; c += 1) {
          const [x, y] = toCanvasCoords(2, c);
          ctx.drawImage(street, x, y, GRID_SIZE, GRID_SIZE);
        }
      } else {
        street.onload = () => draw();
      }

      // trees row 1 col 3..6
      if (tree.complete) {
        for (let c = 3; c <= 6; c += 1) {
          const [x, y] = toCanvasCoords(1, c);
          ctx.drawImage(tree, x, y, GRID_SIZE, GRID_SIZE);
        }
      } else {
        tree.onload = () => draw();
      }

      const sunRow = 6 + 2 * progress;
      const moonRow = 8 - 2 * progress;
      const [sunX, sunY] = toCanvasCoords(sunRow, 2);
      const [moonX, moonY] = toCanvasCoords(moonRow, 2);

      // sun
      ctx.beginPath();
      ctx.fillStyle = lerp(sunNight, sunDay, progress);
      ctx.arc(sunX + GRID_SIZE / 2, sunY + GRID_SIZE / 2, GRID_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // moon
      ctx.beginPath();
      ctx.fillStyle = '#fff';
      ctx.arc(moonX + GRID_SIZE / 2, moonY + GRID_SIZE / 2, GRID_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
    };

    let raf;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
    />
  );
}
