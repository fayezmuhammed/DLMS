import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({ 
  className = '', 
  orientation = 'horizontal' 
}) => {
  return (
    <div
      className={`${
        orientation === 'horizontal' 
          ? 'h-[1px] w-full' 
          : 'h-full w-[1px]'
      } bg-border shrink-0 ${className}`}
      role="separator"
      aria-orientation={orientation}
    />
  );
};

export default Separator;

