import { useState } from 'react';
import ConsolePanel from './ConsolePanel';
import MicrogridStatus from './MicrogridStatus';
import './FooterTabs.css';

export default function FooterTabs() {
  const [active, setActive] = useState('Status');

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
      </div>
      <div className="tab-content">
        {active === 'Console' ? <ConsolePanel /> : <MicrogridStatus />}
      </div>
    </div>
  );
}
