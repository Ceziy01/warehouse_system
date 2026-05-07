import React from 'react';

function ActionButton({ children, onClick, tip, type = 'default', color, disabled = false }) {
  let typeClass = '';
  switch (type) {
    case "danger":
      typeClass = "danger-btn";
      break;
    case "neutral":
      typeClass = "neutral-btn";
      break;
    case "apply":
      typeClass = "apply-btn";
      break;
    case "extra":
      typeClass = "extra-btn";
      break;
    case "excel":
      typeClass = "excel-btn";
      break;
    case "impersonate":
      typeClass = "impersonate-btn";
      break;
    default:
      typeClass = '';
  }

  const style = color ? { backgroundColor: color } : {};

  return (
    <button
      type="button"
      className={`action-btn ${typeClass}`}
      style={style}
      onClick={onClick}
      title={tip}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default ActionButton;