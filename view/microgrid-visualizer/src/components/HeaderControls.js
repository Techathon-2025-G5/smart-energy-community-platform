import React from 'react';
import {
  FaStepForward,
  FaPlay,
  FaPause,
  FaStop,
  FaWrench,
  FaRedo,
  FaQuestionCircle,
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
  onHelp,
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
        <FaWrench />
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
      <button onClick={onHelp} title="Help">
        <FaQuestionCircle />
      </button>
      <span className="sim-time">Day {day} - {hour}h</span>
    </div>
  );
}

export default HeaderControls;
