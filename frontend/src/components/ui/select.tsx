import React, { createContext, useContext, useState } from 'react';

interface SelectContextType {
  value: any;
  onValueChange: (value: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

export interface SelectProps {
  children: React.ReactNode;
  value: any;
  onValueChange: (value: any) => void;
  defaultValue?: any;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  defaultValue: _defaultValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Note: defaultValue is accepted for API compatibility but value is the source of truth

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = '',
  id,
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within a Select');
  }

  const { isOpen, setIsOpen } = context;

  return (
    <button
      type="button"
      id={id}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      aria-expanded={isOpen}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
};

export interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, children }) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectValue must be used within a Select');
  }

  const { value } = context;

  // Safely render value
  const safeRender = (value: any) => {
    // Priority 1: If children are provided, use them
    if (children !== undefined) {
      return children;
    }

    // Priority 2: If no value, use placeholder
    if (value === null || value === undefined) {
      return placeholder || '';
    }

    // Priority 3: Handle different value types
    try {
      if (typeof value === 'object') {
        if (value.name) return value.name;
        if (value.label) return value.label;
        if (value.title) return value.title;
        return '(Selected)';
      }
      return String(value);
    } catch {
      return placeholder || '';
    }
  };

  return <span>{safeRender(value)}</span>;
};

export interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectContent must be used within a Select');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-full mt-1 ${className}`}
    >
      <div className="w-full p-1">{children}</div>
    </div>
  );
};

export interface SelectItemProps {
  children: React.ReactNode;
  value: any;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  children,
  value,
  className = '',
}) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within a Select');
  }

  const { value: selectedValue, onValueChange, setIsOpen } = context;
  
  // Compare values safely, handling objects properly
  const isSelected = (() => {
    if (selectedValue === value) return true;
    
    // For objects, try to do a deep comparison using JSON
    if (typeof selectedValue === 'object' && typeof value === 'object' && 
        selectedValue !== null && value !== null) {
      try {
        return JSON.stringify(selectedValue) === JSON.stringify(value);
      } catch {
        return false;
      }
    }
    
    return false;
  })();

  const handleClick = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      } ${className}`}
      onClick={handleClick}
      role="option"
      aria-selected={isSelected}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
};
