import React, { useState } from 'react';
import { ComponentTemplate } from '../../types/vrm';
import { useComponentStore } from '../../stores/componentStore';
import { useDnD } from './DndProvider';
import {
  errorIconBase64,
  externalIconBase64,
  ifIconBase64,
  insertUpdateIconBase64,
  mathIconBase64,
  multiSetIconBase64,
  scriptIconBase64,
  selectIconBase64,
  systemFunctionIconBase64,
  templateIconBase64,
  transactionIconBase64
} from '../../icons/base64';

// Icon components for different component types
const ComponentIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = "w-4 h-4" }) => {
  // Map component icon types to their corresponding base64 images
  const iconMap: Record<string, string> = {
    // Database components
    'database': transactionIconBase64,        // SQLTRN
    'search': selectIconBase64,               // SELECTQUERY  
    'edit': insertUpdateIconBase64,           // INSERTUPDATEQUERY
    
    // Script components
    'function': systemFunctionIconBase64,     // CSF
    'code': scriptIconBase64,                 // SCRIPT
    
    // Control components
    'fork': ifIconBase64,                     // IF
    'error': errorIconBase64,                 // ERROR
    
    // Data components
    'variable': multiSetIconBase64,           // SET
    'calculator': mathIconBase64,             // MATH
    
    // Integration components
    'external': externalIconBase64,           // EXTERNAL
    'template': templateIconBase64,           // TEMPLATE
  };

  const iconSrc = iconMap[icon];
  
  if (iconSrc) {
    return (
      <img 
        src={iconSrc} 
        alt={icon}
        className={className}
        style={{ 
          objectFit: 'contain',
          imageRendering: 'auto'
        }}
      />
    );
  }

  // Fallback to simple geometric shape for any unmapped icons
  return (
    <div 
      className={`${className} bg-current rounded-sm opacity-75`}
      style={{ aspectRatio: '1' }}
    />
  );
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
      w-16 h-16 bg-vscode-input-bg rounded-xl cursor-grab
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
      className="w-20 h-20 text-vscode-foreground rounded-xl"
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