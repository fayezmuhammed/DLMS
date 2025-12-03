import React, { createContext, useContext, useState } from 'react';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{
  asChild?: boolean;
  children: React.ReactNode;
}> = ({ asChild = false, children }) => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within a DropdownMenu');
  }

  const { isOpen, setIsOpen } = context;

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        const existingOnClick = (children.props as any).onClick;
        if (existingOnClick) existingOnClick(e);
        handleClick();
      },
      "aria-expanded": isOpen,
      "aria-haspopup": true
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup={true}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<{
  align?: 'start' | 'end' | 'center';
  children: React.ReactNode;
  className?: string;
}> = ({ align = 'center', children, className = '' }) => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenuContent must be used within a DropdownMenu');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div
      className={`absolute z-50 mt-2 min-w-[8rem] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]} ${className}`}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ asChild = false, children, onClick, className = '' }) => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenuItem must be used within a DropdownMenu');
  }

  const { setIsOpen } = context;

  const handleClick = () => {
    if (onClick) onClick();
    setIsOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    const childType = (children as React.ReactElement).type;
    const existingClassName = (children.props as any).className || '';

    const propsToAdd: Record<string, any> = {
      onClick: (e: React.MouseEvent) => {
        const existingOnClick = (children.props as any).onClick;
        if (existingOnClick) existingOnClick(e);
        handleClick();
      }
    };

    if (typeof childType === 'string' || (children.props as any).className !== undefined) {
      propsToAdd.className = `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${existingClassName}`.trim();
    }

    // Only add role if it already exists on the child or if it's a standard element
    if ('role' in children.props || typeof childType === 'string') {
      propsToAdd.role = 'menuitem';
    }

    return React.cloneElement(children as React.ReactElement<any>, propsToAdd);
  }

  return (
    <button
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${className}`}
      role="menuitem"
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="px-4 py-3 text-sm text-gray-900 font-medium">
      {children}
    </div>
  );
};

export const DropdownMenuSeparator: React.FC = () => {
  return <div className="border-t border-gray-200 my-1" />;
}; 