import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';

function SimulationCanvas({ onDrop, children }) {
  const ref = useRef(null);

  const [, drop] = useDrop(() => ({
    accept: ['module', 'canvas-module'],
    drop: (item, monitor) => {
      if (!ref.current) return;
      const offset = monitor.getClientOffset();
      const rect = ref.current.getBoundingClientRect();
      const left = offset.x - rect.left;
      const top = offset.y - rect.top;
      onDrop(item, left, top);
    },
  }), [onDrop]);

  drop(ref);

  return (
    <div ref={ref} className="drawing-area" style={{ position: 'relative' }}>
      {children}
    </div>
  );
}

SimulationCanvas.propTypes = {
  onDrop: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default SimulationCanvas;
