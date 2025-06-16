import React, { useState } from 'react';
import { ComponentTemplate } from '../../types/vrm';
import { useComponentStore } from '../../stores/componentStore';
import { useDnD } from './DndProvider';

// Icon components for different component types
const ComponentIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = "w-4 h-4" }) => {
  const iconMap = {
    database: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
      </svg>
    ),
    search: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
      </svg>
    ),
    edit: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
      </svg>
    ),
    function: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
      </svg>
    ),
    code: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
      </svg>
    ),
    fork: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
      </svg>
    ),
    error: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
    ),
    variable: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/>
      </svg>
    ),
    calculator: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11zm0-2a1 1 0 100 2h.01a1 1 0 100-2H11zm-2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm-2 0a1 1 0 100 2h.01a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    ),
    external: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
      </svg>
    ),
    template: (
      <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd"/>
      </svg>
    )
  };

  return iconMap[icon as keyof typeof iconMap] || iconMap.code;
};

// Simple HTML5 drag and drop component item - following React Flow pattern
const DraggableComponentItem: React.FC<{ template: ComponentTemplate }> = ({ template }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [_, setDraggedTemplate] = useDnD();

  const onDragStart = (event: React.DragEvent) => {
    console.log('Drag start:', template.type);
    setIsDragging(true);
    setDraggedTemplate(template);
    
    // Store the template data in the drag event (following React Flow pattern)
    event.dataTransfer.setData('application/json', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    console.log('Drag end:', template.type);
    setIsDragging(false);
    setDraggedTemplate(null);
  };

  return (
    <div
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`
      w-10 h-10 bg-vscode-input-bg border border-vscode-border rounded cursor-grab
      hover:bg-vscode-list-hoverBackground hover:border-vscode-list-focusBorder
      transition-all duration-150 select-none flex items-center justify-center
      ${isDragging ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}
    `}
    title={`${template.label} - ${template.description}`}  // Enhanced tooltip
    style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}
  >
    <ComponentIcon 
      icon={template.icon} 
      className="w-5 h-5 text-vscode-foreground"  // Larger icon
    />
  </div>
  );
};

// Main Component Palette
interface ComponentPaletteProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  isCollapsed = false,
  onToggleCollapse
}) => {
  const templates = useComponentStore(state => state.templates); // Direct access to templates

  if (isCollapsed) {
    return (
      <div className="w-12 bg-vscode-sideBar-background border-r border-vscode-border flex flex-col">
        {/* Collapsed Header */}
        <div className="p-2 border-b border-vscode-border">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 rounded hover:bg-vscode-list-hoverBackground"
            title="Expand Component Palette"
          >
            <ComponentIcon icon="template" className="w-5 h-5 text-vscode-foreground mx-auto" />
          </button>
        </div>
        
        {/* Collapsed Component Icons */}
        <div className="flex-1 py-2 space-y-2">
          {templates.map((template) => (
            <div key={template.type} className="px-2">
              <button
                className="w-full p-2 rounded hover:bg-vscode-list-hoverBackground"
                title={`${template.label} - ${template.description}`}
                onClick={() => {
                  onToggleCollapse?.();
                }}
              >
                <ComponentIcon 
                  icon={template.icon} 
                  className="w-4 h-4 text-vscode-foreground mx-auto" 
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-32 bg-vscode-sideBar-background border-r border-vscode-border flex flex-col">
    {/* Header - simplified */}
    <div className="p-2 border-b border-vscode-border">  
      {/* Removed the "Available" badge */}
    </div>

    {/* Component grid layout */}
    <div className="flex-1 overflow-y-auto p-2">
      <div className="grid grid-cols-1 gap-1 place-items-center">
        {templates.map((template) => (
          <DraggableComponentItem 
            key={template.type}
            template={template}
          />
        ))}
      </div>
    </div>

      {/* Footer */}
      <div className="p-2 border-t border-vscode-border">
        <div className="text-xs text-vscode-secondary text-center">
          Drag & Drop
        </div>
      </div>
    </div>
  );
};