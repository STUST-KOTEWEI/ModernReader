import React from 'react';

export type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export const Card: React.FC<CardProps> = ({ title, children, className = '', onClick }) => {
  const interactiveProps = onClick ? {
    onClick,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onClick()
  } : {};

  return (
    <div 
      className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 ${className}`}
      {...interactiveProps}
    >
      {title && <h3 className="text-lg font-medium mb-2">{title}</h3>}
      <div className="text-sm text-gray-700 dark:text-gray-200">{children}</div>
    </div>
  );
};

export default Card;
