import React from 'react';
import { useDrag } from 'react-dnd';
import PropTypes from 'prop-types';

function CanvasItem({ id, type, left, top, icon, onSelect, isSelected }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'canvas-module',
    item: { id },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }), [id]);

  return (
    <div
      ref={drag}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}
      style={{
        position: 'absolute',
        left,
        top,
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        border: isSelected ? '2px solid blue' : 'none',
        fontSize: '2rem',
      }}
    >
      {icon}
    </div>
  );
}

CanvasItem.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  icon: PropTypes.node.isRequired,
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
};

export default CanvasItem;
