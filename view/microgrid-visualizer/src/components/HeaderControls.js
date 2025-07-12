import React from 'react';
import {
  FaStepForward,
  FaPlay,
  FaPause,
  FaStop,
  FaFolderOpen,
  FaRedo,
} from 'react-icons/fa';
import ConnectionIndicator from './ConnectionIndicator';
import './HeaderControls.css';

function HeaderControls({
  onSetup,
  onRunStep,
  onPlay,
  onPause,
  onStop,
  onReset,
  stepDisabled,
  playDisabled,
  pauseDisabled,
  stopDisabled,
  resetDisabled,
  step = 0,
}) {
  const day = Math.floor(step / 24) + 1;
  const hour = step % 24;
  return (
    <div className="header-controls">
      <ConnectionIndicator />
      <button onClick={onSetup} title="Setup">
        <FaFolderOpen />
      </button>
      <button onClick={onReset} title="Reset" disabled={resetDisabled}>
        <FaRedo />
      </button>
      <button onClick={onStop} title="Stop" disabled={stopDisabled}>
        <FaStop />
      </button>
      <button onClick={onRunStep} title="Step" disabled={stepDisabled}>
        <FaStepForward />
      </button>
      <button onClick={onPlay} title="Play" disabled={playDisabled}>
        <FaPlay />
      </button>
      <button onClick={onPause} title="Pause" disabled={pauseDisabled}>
        <FaPause />
      </button>
      <span className="sim-time">Día {day} - {hour}h</span>
    </div>
  );
}

export default HeaderControls;
