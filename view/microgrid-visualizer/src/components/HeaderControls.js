import React from 'react';
import {
  FaStepForward,
  FaPlay,
  FaPause,
  FaFolderOpen,
  FaRedo,
} from 'react-icons/fa';
import './HeaderControls.css';

function HeaderControls({
  onSetup,
  onRunStep,
  onStatus,
  onPause,
  onReset,
  stepDisabled,
  playDisabled,
  pauseDisabled,
  resetDisabled,
}) {
  return (
    <div className="header-controls">
      <button onClick={onSetup} title="Setup">
        <FaFolderOpen />
      </button>
      <button onClick={onReset} title="Reset" disabled={resetDisabled}>
        <FaRedo />
      </button>
      <button onClick={onRunStep} title="Step" disabled={stepDisabled}>
        <FaStepForward />
      </button>
      <button onClick={onStatus} title="Play" disabled={playDisabled}>
        <FaPlay />
      </button>
      <button onClick={onPause} title="Pause" disabled={pauseDisabled}>
        <FaPause />
      </button>
    </div>
  );
}

export default HeaderControls;
