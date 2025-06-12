import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  closestCenter,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ComponentTemplate, SectionType } from '../../types/vrm';
import { useComponentStore } from '../../stores/componentStore';
import { useEditorStore } from '../../stores/editorStore';
import { ComponentPalette } from './ComponentPalette';

// Drag overlay component for showing the dragged item
const DragOverlayContent: React.FC<{ template: ComponentTemplate | null }> = ({ template }) => {
  if (!template) return null;

  return (
    <div className="p-2 bg-vscode-input-bg border border-vscode-list-focusBorder rounded-md shadow-lg opacity-90">
      <div className="flex items-center space-x-2">
        <div className="text-xs font-medium text-vscode-foreground">
          {template.label}
        </div>
        <div className="text-xs text-vscode-badge-foreground bg-vscode-badge-background px-2 py-0.5 rounded">
          {template.type}
        </div>
      </div>
    </div>
  );
};

// Droppable canvas area component
interface DroppableCanvasProps {
  children: React.ReactNode;
  section: SectionType;
  onDrop: (template: ComponentTemplate, position: { x: number; y: number }) => void;
}

const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ children, section, onDrop }) => {
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const { draggedTemplate } = useComponentStore();

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    if (draggedTemplate) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDragPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    // Handle click-to-insert functionality when not dragging
    if (!draggedTemplate) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    onDrop(draggedTemplate, position);
  };

  return (
    <div 
      className="relative w-full h-full"
      onMouseMove={handleCanvasMouseMove}
      onClick={handleCanvasClick}
      data-droppable="true"
      data-section={section}
    >
      {children}
      
      {/* Drop indicator */}
      {draggedTemplate && dragPosition && (
        <div 
          className="absolute pointer-events-none z-50"
          style={{
            left: dragPosition.x - 64, // Half of component width (128px)
            top: dragPosition.y - 16,  // Half of component height (32px)
          }}
        >
          <div className="w-32 h-8 border-2 border-dashed border-vscode-list-focusBorder bg-vscode-list-hoverBackground opacity-75 rounded flex items-center justify-center">
            <span className="text-xs text-vscode-foreground font-medium">
              {draggedTemplate.type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main DndProvider component
interface DndProviderProps {
  children: React.ReactNode;
  section: SectionType;
  isPaletteCollapsed?: boolean;
  onTogglePalette?: () => void;
}

export const DndProvider: React.FC<DndProviderProps> = ({ 
  children, 
  section,
  isPaletteCollapsed = false,
  onTogglePalette
}) => {
  const [activeTemplate, setActiveTemplate] = useState<ComponentTemplate | null>(null);
  const { createComponent, setDraggedTemplate, setIsDragging } = useComponentStore();
  const { zoom, pan } = useEditorStore();

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    if (active.data.current?.type === 'component-template') {
      const template = active.data.current.template as ComponentTemplate;
      setActiveTemplate(template);
      setDraggedTemplate(template);
      setIsDragging(true);
    }
  };

  // Handle drag move (for real-time feedback)
  const handleDragMove = (event: DragMoveEvent) => {
    // We can add real-time visual feedback here if needed
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTemplate(null);
    setDraggedTemplate(null);
    setIsDragging(false);

    if (!over || !active.data.current) return;

    // Check if dropped on canvas
    if (over.data.current?.droppable) {
      const template = active.data.current.template as ComponentTemplate;
      const dropPosition = event.delta;
      
      // Convert screen coordinates to canvas coordinates
      // Account for zoom and pan transformations
      const canvasPosition = {
        x: Math.max(0, (dropPosition.x - pan.x) / zoom),
        y: Math.max(0, (dropPosition.y - pan.y) / zoom)
      };

      handleComponentDrop(template, canvasPosition);
    }
  };

  // Handle component drop on canvas
  const handleComponentDrop = (template: ComponentTemplate, position: { x: number; y: number }) => {
    try {
      const newComponent = createComponent(template.type, position, section);
      
      // Optional: Add visual feedback for successful creation
      console.log(`Created ${template.type} component at (${position.x}, ${position.y})`);
      
      // Optional: Trigger success notification
      // You could integrate with a notification system here
      
    } catch (error) {
      console.error('Failed to create component:', error);
      
      // Optional: Show error notification
      // You could integrate with an error notification system here
    }
  };

  return (
    <div className="flex h-full">
      {/* Component Palette */}
      <ComponentPalette 
        isCollapsed={isPaletteCollapsed}
        onToggleCollapse={onTogglePalette}
      />

      {/* Main Content Area with Drag Context */}
      <div className="flex-1 relative">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* Droppable Canvas Area */}
          <DroppableCanvas 
            section={section}
            onDrop={handleComponentDrop}
          >
            {children}
          </DroppableCanvas>

          {/* Drag Overlay */}
          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            <DragOverlayContent template={activeTemplate} />
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

// Export convenience props type for consumers
export type { DndProviderProps };