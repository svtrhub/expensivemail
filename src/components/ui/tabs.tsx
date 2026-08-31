import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : selectedTab;

  const setActiveTab = (val: string) => {
    if (value === undefined) {
      setSelectedTab(val);
    }
    if (onValueChange) {
      onValueChange(val);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-slate-500 dark:text-slate-400 ${className}`}
  >
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ value, children, className = '', disabled = false }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => context.setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[36px] cursor-pointer ${
        isActive
          ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100 font-bold'
          : 'hover:text-slate-900 dark:hover:text-slate-100'
      } ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`mt-3 focus-visible:outline-none ${className}`}
    >
      {children}
    </div>
  );
};
