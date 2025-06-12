import React, { createContext, useContext, useState } from 'react';
import { ComponentTemplate, SectionType } from '../../types/vrm';
import { ComponentPalette } from './ComponentPalette';

// Create drag and drop context similar to React Flow example
const DnDContext = createContext<[ComponentTemplate | null, (template: ComponentTemplate | null) => void]>([null, () => {}]);

export const DnDProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draggedTemplate, setDraggedTemplate] = useState<ComponentTemplate | null>(null);

  return (
    <DnDContext.Provider value={[draggedTemplate, setDraggedTemplate]}>
      {children}
    </DnDContext.Provider>
  );
};

export const useDnD = () => {
  return useContext(DnDContext);
};

// Main layout component that includes the palette and canvas
interface DragDropLayoutProps {
  children: React.ReactNode;
  section: SectionType;
  isPaletteCollapsed?: boolean;
  onTogglePalette?: () => void;
}

export const DragDropLayout: React.FC<DragDropLayoutProps> = ({ 
  children, 
  section,
  isPaletteCollapsed = false,
  onTogglePalette
}) => {
  console.log('DragDropLayout rendered');

  return (
    <DnDProvider>
      <div className="flex h-full">
        {/* Component Palette */}
        <ComponentPalette 
          isCollapsed={isPaletteCollapsed}
          onToggleCollapse={onTogglePalette}
        />

        {/* Main Content Area - ReactFlow will handle drag and drop */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </DnDProvider>
  );
};

// Export the context hook and provider
export { DnDContext };