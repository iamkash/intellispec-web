import { Menu } from 'antd';
import React from 'react';

interface WizardSidebarProps {
  menuItems: Array<{
    key: string;
    icon: React.ReactNode;
    label: React.ReactNode;
  }>;
  currentStep: number;
  handleStepChange: (step: number) => void;
}

export const WizardSidebar: React.FC<WizardSidebarProps> = ({
  menuItems,
  currentStep,
  handleStepChange
}) => {
  return (
    <aside 
      className="wizard-sidebar" 
      role="navigation" 
      aria-label="Wizard steps"
      style={{
        width: '280px',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        background: 'hsl(var(--background))',
        borderRight: '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Sidebar Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid hsl(var(--border))',
        background: 'transparent',
        flexShrink: 0
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '11px',
          fontWeight: 600,
          color: 'hsl(var(--muted-foreground))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Inspection Steps
        </h3>
      </div>

      {/* Scrollable Menu Container */}
      <div 
        className="sidebar-body"
        style={{ 
          padding: '8px 0'
        }}>
        <Menu
          mode="inline"
          selectedKeys={[String(currentStep)]}
          style={{
            borderRight: 0,
            background: 'transparent',
            color: 'hsl(var(--foreground))',
            fontSize: '13px',
            height: 'auto'
          }}
          items={menuItems}
          onClick={({ key }) => handleStepChange(Number(key))}
        />
      </div>
    </aside>
  );
};
