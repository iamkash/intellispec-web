import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../ui/Layout';
import { ModuleContainer } from './ModuleContainer';
import { Module } from '../../schemas/module';

export interface LayoutContainerProps {
  children: React.ReactNode;
  title?: string;
  logo?: string;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  footerText?: string;
  currentMenuItem?: any;
  onMenuClick?: (menuItem: any) => void; // Changed from key to menuItem
  onLogout?: () => Promise<void>;
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({
  children,
  title = 'Intellispec Web',
  logo,
  user = { name: 'John Doe', role: 'Administrator' },
  footerText,
  currentMenuItem,
  onMenuClick,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(true); // Start collapsed by default
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Force collapsed on mobile
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch gesture support for mobile sidebar
  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const diffX = currentX - startX;
      const diffY = currentY - startY;
      
      // Check if it's a horizontal swipe (more horizontal than vertical movement)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
        // Swipe from left edge to open sidebar
        if (startX < 50 && diffX > 100 && collapsed) {
          setCollapsed(false);
        }
        
        // Swipe right to left to close sidebar
        if (diffX < -100 && !collapsed) {
          setCollapsed(true);
        }
      }
    };

    const handleTouchEnd = () => {
      startX = 0;
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, collapsed]);

  // Memoize menu click handler to prevent unnecessary re-renders
  const handleMenuClick = useCallback((menuItem: any) => {
    // Auto-collapse sidebar on mobile after menu click
    if (isMobile) {
      setCollapsed(true);
    }
    
    onMenuClick?.(menuItem);
  }, [isMobile, onMenuClick]);

  // Memoize module change handler to prevent module resets
  const handleModuleChange = useCallback((module: Module | null) => {
}, []);

  // Memoize module select handler to prevent module resets
  const handleModuleSelect = useCallback((module: Module) => {
// Module selection is handled by ModuleContainer
  }, []);

  // Memoize collapse handler to prevent unnecessary re-renders
  const handleCollapse = useCallback((collapsed: boolean) => {
setCollapsed(collapsed);
  }, [isMobile]);

  return (
    <ModuleContainer onModuleChange={handleModuleChange}>
      <AppLayout
        title={title}
        logo={logo}
        user={user}
        footerText={footerText}
        collapsed={collapsed}
        onCollapse={handleCollapse}
        isMobile={isMobile}
        currentMenuItem={currentMenuItem}
        onMenuClick={handleMenuClick}
        onModuleSelect={handleModuleSelect}
        onLogout={onLogout}
      >
        {children}
      </AppLayout>
    </ModuleContainer>
  );
}; 