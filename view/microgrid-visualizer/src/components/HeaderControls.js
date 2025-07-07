import React from 'react';
import { FaStepForward, FaPlay, FaPause, FaFolderOpen, FaSave } from 'react-icons/fa';
import './HeaderControls.css';

function HeaderControls({
  onSetup,
  onRunStep,
  onStatus,
  onGetComponents,
  onReset,
}) {
  return (
    <div className="header-controls">
      <button onClick={onSetup} title="Load">
        <FaFolderOpen />
      </button>
      <button onClick={onRunStep} title="Step">
        <FaStepForward />
      </button>
      <button onClick={onStatus} title="Play">
        <FaPlay />
      </button>
      <button onClick={onReset} title="Pause">
        <FaPause />
      </button>
      <button onClick={onGetComponents} title="Save">
        <FaSave />
      </button>
    </div>
  );
}

export default HeaderControls;
