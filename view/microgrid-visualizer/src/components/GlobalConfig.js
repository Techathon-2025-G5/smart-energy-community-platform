import React from 'react';
import './GlobalConfig.css';

export default function GlobalConfig({
  lossLoadCost,
  overgenerationCost,
  onLossLoadCostChange,
  onOvergenerationCostChange,
  isSetup,
}) {
  return (
    <form className="global-config-form">
      <label>
        Loss load cost:
        <input
          type="number"
          value={lossLoadCost}
          onChange={(e) => onLossLoadCostChange(e.target.value)}
          disabled={isSetup}
        />
      </label>
      <label>
        Overgeneration cost:
        <input
          type="number"
          value={overgenerationCost}
          onChange={(e) => onOvergenerationCostChange(e.target.value)}
          disabled={isSetup}
        />
      </label>
    </form>
  );
}
