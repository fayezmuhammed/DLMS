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
    // Do not pass aria-haspopup via cloneElement config, let user handle it
    return children;
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
}> = ({ align = 'center', children }) => {
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
      className={`absolute z-50 mt-2 min-w-[8rem] rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]}`}
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
}> = ({ asChild = false, children, onClick }) => {
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
    if (typeof childType === 'string') {
      // Only add className if it already exists on the child
      const existingClassName = (children.props as any).className;
      const propsToAdd: Record<string, any> = {};
      if (typeof existingClassName === 'string') {
        propsToAdd.className = `block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${existingClassName}`.trim();
      }
      // Only add role if it already exists on the child
      if ('role' in children.props) {
        propsToAdd.role = 'menuitem';
      }
      return React.cloneElement(children, propsToAdd);
    } else {
      // Custom component: return as-is
      return children;
    }
  }

  return (
    <button
      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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