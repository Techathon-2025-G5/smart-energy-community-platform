import { useState, useEffect } from 'react';
import ConsolePanel from './ConsolePanel';
import EnergyBalance from './EnergyBalance';
import GlobalConfig from './GlobalConfig';
import './FooterTabs.css';

export default function FooterTabs({
  isSetup = false,
  lossLoadCost,
  overgenerationCost,
  onLossLoadCostChange,
  onOvergenerationCostChange,
}) {
  const [active, setActive] = useState('Status');

  useEffect(() => {
    if (!isSetup) {
      setActive('Configuration');
    }
  }, [isSetup]);

  let content;
  if (active === 'Console') {
    content = <ConsolePanel />;
  } else if (active === 'Status') {
    content = <EnergyBalance />;
  } else {
    content = (
      <GlobalConfig
        lossLoadCost={lossLoadCost}
        overgenerationCost={overgenerationCost}
        onLossLoadCostChange={onLossLoadCostChange}
        onOvergenerationCostChange={onOvergenerationCostChange}
        isSetup={isSetup}
      />
    );
  }

  return (
    <div className="footer-tabs">
      <div className="tab-headers">
        <button
          className={active === 'Console' ? 'active' : ''}
          onClick={() => setActive('Console')}
        >
          Console
        </button>
        <button
          className={active === 'Status' ? 'active' : ''}
          onClick={() => setActive('Status')}
        >
          Status
        </button>
        <button
          className={active === 'Configuration' ? 'active' : ''}
          onClick={() => setActive('Configuration')}
        >
          Configuration
        </button>
      </div>
      <div className="tab-content">{content}</div>
    </div>
  );
}
