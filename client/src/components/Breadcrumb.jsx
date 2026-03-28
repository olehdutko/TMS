import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="breadcrumb-sep">›</span>}
            {isLast ? (
              <span className="breadcrumb-item current">{item.label}</span>
            ) : (
              <Link to={item.to} className="breadcrumb-item">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
