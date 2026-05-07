import React from 'react';
import './PageHeader.css';

function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="page-header">
      <div className="page-title-group">
        <span className="material-symbols-outlined page-icon">{icon}</span>
        <div className="page-title-text">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-sub">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;