import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ConsolePanel from './ConsolePanel';
import MicrogridStatus from './MicrogridStatus';
import MicrogridConfig from './MicrogridConfig';
import './FooterTabs.css';

export default function FooterTabs({ config, onConfigChange, isSetup, step }) {
  const [active, setActive] = useState('Status');

  useEffect(() => {
    if (isSetup) {
      setActive('Status');
    } else {
      setActive('Configuration');
    }
  }, [isSetup]);

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
          className={active === 'Configuration' ? 'active' : ''}
          onClick={() => setActive('Configuration')}
        >
          Configuration
        </button>
        <button
            className={active === 'Status' ? 'active' : ''}
            onClick={() => setActive('Status')}
            disabled={!isSetup}
        >
          Status
        </button>
      </div>
      <div className="tab-content">
        {active === 'Console' && <ConsolePanel />}
        {active === 'Status' && <MicrogridStatus step={step} />}
        {active === 'Configuration' && (
          <MicrogridConfig
            config={config}
            onChange={onConfigChange}
            isSetup={isSetup}
          />
        )}
      </div>
    </div>
  );
}

FooterTabs.propTypes = {
  config: PropTypes.shape({
    loss_load_cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    overgeneration_cost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lon: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  onConfigChange: PropTypes.func.isRequired,
  isSetup: PropTypes.bool,
  step: PropTypes.number,
};

FooterTabs.defaultProps = {
  isSetup: false,
  step: 0,
};
