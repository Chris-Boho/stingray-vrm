import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ComponentTemplate } from '../../types/vrm';
import { useComponentTemplatesByCategory, useComponentStore } from '../../stores/componentStore';

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

// Draggable component item
const DraggableComponentItem: React.FC<{ template: ComponentTemplate }> = ({ template }) => {
  const { setDraggedTemplate, setIsDragging } = useComponentStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `template-${template.type}`,
    data: {
      template,
      type: 'component-template'
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  React.useEffect(() => {
    if (isDragging) {
      setDraggedTemplate(template);
      setIsDragging(true);
    } else {
      setDraggedTemplate(null);
      setIsDragging(false);
    }
  }, [isDragging, template, setDraggedTemplate, setIsDragging]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group p-3 bg-vscode-input-bg border border-vscode-border rounded-md cursor-grab
        hover:bg-vscode-list-hoverBackground hover:border-vscode-list-focusBorder
        active:cursor-grabbing transition-all duration-150
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
      title={template.description}
    >
      <div className="flex items-start space-x-3">
        {/* Component Icon */}
        <div className="flex-shrink-0 p-2 bg-vscode-button-background border border-vscode-button-border rounded">
          <ComponentIcon 
            icon={template.icon} 
            className="w-4 h-4 text-vscode-button-foreground"
          />
        </div>
        
        {/* Component Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-vscode-foreground truncate">
            {template.label}
          </div>
          <div className="text-xs text-vscode-secondary mt-1 leading-relaxed">
            {template.description}
          </div>
          <div className="text-xs text-vscode-badge-foreground bg-vscode-badge-background px-2 py-0.5 rounded mt-2 inline-block">
            {template.type}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category section component
const CategorySection: React.FC<{ 
  category: string; 
  templates: ComponentTemplate[];
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ category, templates, isExpanded, onToggle }) => {
  const categoryLabels = {
    database: 'Database',
    script: 'Script',
    control: 'Control Flow',
    data: 'Data',
    integration: 'Integration'
  };

  const categoryColors = {
    database: 'text-blue-400',
    script: 'text-green-400',
    control: 'text-amber-400',
    data: 'text-purple-400',
    integration: 'text-pink-400'
  };

  return (
    <div className="mb-4">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 bg-vscode-sideBar-background 
                   border border-vscode-border rounded-md hover:bg-vscode-list-hoverBackground
                   transition-colors duration-150"
      >
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${categoryColors[category as keyof typeof categoryColors] || 'text-vscode-foreground'}`}>
            {categoryLabels[category as keyof typeof categoryLabels] || category}
          </span>
          <span className="text-xs text-vscode-secondary bg-vscode-badge-background px-2 py-0.5 rounded">
            {templates.length}
          </span>
        </div>
        
        {/* Expand/Collapse Icon */}
        <svg 
          className={`w-4 h-4 text-vscode-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : 'rotate-0'
          }`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
        </svg>
      </button>
      
      {/* Category Items */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {templates.map((template) => (
            <DraggableComponentItem 
              key={template.type}
              template={template}
            />
          ))}
        </div>
      )}
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
  const templatesByCategory = useComponentTemplatesByCategory();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['database', 'script', 'control']) // Default expanded categories
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const totalComponents = Object.values(templatesByCategory).reduce(
    (total, templates) => total + templates.length, 
    0
  );

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
        
        {/* Collapsed Category Icons */}
        <div className="flex-1 py-2 space-y-2">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category} className="px-2">
              <button
                className="w-full p-2 rounded hover:bg-vscode-list-hoverBackground"
                title={`${category} (${templates.length})`}
                onClick={() => {
                  onToggleCollapse?.();
                  toggleCategory(category);
                }}
              >
                <ComponentIcon 
                  icon={templates[0]?.icon || 'code'} 
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
    <div className="w-80 bg-vscode-sideBar-background border-r border-vscode-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-vscode-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-vscode-foreground">Component Palette</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-vscode-list-hoverBackground"
              title="Collapse Palette"
            >
              <svg className="w-4 h-4 text-vscode-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-vscode-secondary">
          Drag components to the canvas to add them to your workflow
        </p>
        <div className="text-xs text-vscode-badge-foreground bg-vscode-badge-background px-2 py-1 rounded mt-2 inline-block">
          {totalComponents} Components Available
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-vscode-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            className="w-full px-3 py-2 pl-8 text-sm bg-vscode-input-background border border-vscode-input-border 
                       rounded text-vscode-input-foreground placeholder-vscode-input-placeholderForeground
                       focus:outline-none focus:border-vscode-focusBorder"
          />
          <ComponentIcon 
            icon="search" 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-input-placeholderForeground" 
          />
        </div>
      </div>

      {/* Component Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(templatesByCategory).map(([category, templates]) => (
          <CategorySection
            key={category}
            category={category}
            templates={templates}
            isExpanded={expandedCategories.has(category)}
            onToggle={() => toggleCategory(category)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-vscode-border">
        <div className="text-xs text-vscode-secondary text-center">
          Drag & Drop • Double-click to insert
        </div>
      </div>
    </div>
  );
};