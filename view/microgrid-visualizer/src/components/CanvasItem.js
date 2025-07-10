import React from 'react';
import { useDrag } from 'react-dnd';
import PropTypes from 'prop-types';
import { useAppState } from '../context/AppState';
import './CanvasItem.css';

function CanvasItem({ id, type, left, top, icon, onSelect, isSelected }) {
  const { deleteModule } = useAppState();
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      className={`canvas-item${isSelected ? ' selected' : ''}`}
      style={{
        left,
        top,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {icon}
      {isSelected && (
        <div
          className="delete-circle"
          onClick={(e) => {
            e.stopPropagation();
            deleteModule(id);
          }}
        >
          ×
        </div>
      )}
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
