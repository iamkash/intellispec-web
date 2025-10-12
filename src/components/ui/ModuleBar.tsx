import React from 'react';
import { Space, Tooltip, Button } from 'antd';
import * as Icons from '@ant-design/icons';
import { Module, ModuleBarProps } from '../../schemas/module';

/**
 * ModuleBar Component
 * 
 * Displays a horizontal bar of modules below the header, allowing users to switch
 * between different licensable components of the application.
 */
interface ExtendedModuleBarProps extends ModuleBarProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export const ModuleBar: React.FC<ExtendedModuleBarProps> = ({
  modules,
  currentModule,
  onModuleSelect,
  className = '',
  collapsed = false,
  isMobile = false,
}) => {
  const buttonHeight = isMobile ? 30 : 32;
  const buttonPadding = isMobile ? '0 8px' : '0 10px';

  // Get icon component from string name
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? React.createElement(IconComponent) : React.createElement(Icons.AppstoreOutlined);
  };

  // Filter enabled modules and sort by order
  const enabledModules = modules
    .filter(module => module.enabled)
    .sort((a, b) => a.order - b.order);

  const handleModuleClick = (module: Module) => {
    onModuleSelect(module);
  };

  // Determine CSS classes based on state
  const getModuleBarClasses = () => {
    const classes = ['module-bar'];
    if (collapsed) classes.push('collapsed-sidebar');
    if (isMobile) classes.push('mobile-view');
    if (className) classes.push(className);
    return classes.join(' ');
  };

  return (
    <div className={getModuleBarClasses()}>
      <div className="module-bar-content">
        <Space 
          size={isMobile ? 4 : 6}
          style={{ 
            display: 'flex', 
            flexWrap: 'nowrap', 
            whiteSpace: 'nowrap',
            minWidth: 'max-content' 
          }}
        >
          {enabledModules.map((module) => (
            <Tooltip 
              key={module.id} 
              title={
                <div>
                  <div style={{ fontWeight: 'bold' }}>{module.label}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {module.description}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                    Version: {module.version} | License: {module.license_id}
                  </div>
                </div>
              }
              placement="bottom"
            >
              <Button
                type={currentModule?.id === module.id ? 'primary' : 'text'}
                icon={getIcon(module.icon)}
                onClick={() => handleModuleClick(module)}
                className={`module-button ${currentModule?.id === module.id ? 'active' : ''}`}
                style={{
                  height: `${buttonHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: buttonPadding,
                  borderRadius: '5px',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: currentModule?.id === module.id ? 600 : 400,
                  color: currentModule?.id === module.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  backgroundColor: currentModule?.id === module.id ? module.color : 'transparent',
                  border: currentModule?.id === module.id ? `1px solid ${module.color}` : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  flexShrink: 0, // Prevent shrinking
                }}
              >
                <span className="module-label">{module.label}</span>
              </Button>
            </Tooltip>
          ))}
        </Space>
      </div>
    </div>
  );
}; 
