import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ComponentType } from '../../types/vrm';
import { useSelectionStore } from '../../stores/selectionStore';
import { useComponentStore } from '../../stores/componentStore';
import { useDocumentStore } from '../../stores/documentStore';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  targetComponentId?: number;
  canvasPosition?: { x: number; y: number }; // For insert operations on empty space
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  submenu?: MenuItem[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  targetComponentId,
  canvasPosition
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  
  const { selectedComponents, selectComponent, clearSelection } = useSelectionStore();
  const { setEditingComponent, getComponentTemplate } = useComponentStore();
  const { document } = useDocumentStore();

  // Get component data if we have a target
  const targetComponent = targetComponentId 
    ? [...(document?.preproc || []), ...(document?.postproc || [])].find(c => c.n === targetComponentId)
    : null;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (position) {
      window.document.addEventListener('mousedown', handleClickOutside);
      window.document.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
      window.document.removeEventListener('keydown', handleEscape);
    };
  }, [position, onClose]);

  // Handle menu item selection
  const handleSelectAction = useCallback((action: string) => {
    if (!targetComponentId) return;
    
    switch (action) {
      case 'select-single':
        selectComponent(targetComponentId, false);
        break;
      case 'select-add':
        selectComponent(targetComponentId, true);
        break;
      case 'select-clear':
        clearSelection();
        break;
    }
    onClose();
  }, [targetComponentId, selectComponent, clearSelection, onClose]);

  const handleEditAction = useCallback((action: string) => {
    if (!targetComponentId) return;
    
    switch (action) {
      case 'edit-properties':
        setEditingComponent(targetComponentId);
        break;
      case 'edit-duplicate':
        // TODO: Implement duplicate
        console.log('Duplicate component:', targetComponentId);
        break;
      case 'edit-delete':
        // TODO: Implement delete
        console.log('Delete component:', targetComponentId);
        break;
    }
    onClose();
  }, [targetComponentId, setEditingComponent, onClose]);

  const handleInsertAction = useCallback((componentType: ComponentType) => {
    if (!canvasPosition) return;
    
    // TODO: Create component at canvas position
    console.log('Insert component:', componentType, 'at position:', canvasPosition);
    onClose();
  }, [canvasPosition, onClose]);

  // Build menu sections based on context
  const buildMenuSections = useCallback((): MenuSection[] => {
    const sections: MenuSection[] = [];

    // SELECT section - only show if we have a target component
    if (targetComponentId) {
      const isSelected = selectedComponents.includes(targetComponentId);
      const hasMultipleSelected = selectedComponents.length > 1;
      
      sections.push({
        title: 'Select',
        items: [
          {
            id: 'select-single',
            label: isSelected ? 'Selected' : 'Select This',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            ),
            disabled: isSelected && !hasMultipleSelected,
            onClick: () => handleSelectAction('select-single')
          },
          {
            id: 'select-add',
            label: isSelected ? 'Remove from Selection' : 'Add to Selection',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
            ),
            onClick: () => handleSelectAction('select-add')
          },
          {
            id: 'select-clear',
            label: 'Clear Selection',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            ),
            disabled: selectedComponents.length === 0,
            onClick: () => handleSelectAction('select-clear')
          }
        ]
      });
    }

    // EDIT section - only show if we have a target component
    if (targetComponentId && targetComponent) {
      sections.push({
        title: 'Edit',
        items: [
          {
            id: 'edit-properties',
            label: 'Edit Properties...',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
            ),
            onClick: () => handleEditAction('edit-properties')
          },
          {
            id: 'edit-duplicate',
            label: 'Duplicate',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
            ),
            onClick: () => handleEditAction('edit-duplicate')
          },
          {
            id: 'edit-delete',
            label: 'Delete',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            ),
            onClick: () => handleEditAction('edit-delete')
          }
        ]
      });
    }

    // INSERT section - show when clicking on empty space or always as submenu
    if (canvasPosition || targetComponentId) {
      const componentTypes: { type: ComponentType; category: string }[] = [
        // Database
        { type: 'SQLTRN', category: 'Database' },
        { type: 'SELECTQUERY', category: 'Database' },
        { type: 'INSERTUPDATEQUERY', category: 'Database' },
        // Script
        { type: 'CSF', category: 'Script' },
        { type: 'SCRIPT', category: 'Script' },
        // Control
        { type: 'IF', category: 'Control' },
        { type: 'ERROR', category: 'Control' },
        // Data
        { type: 'SET', category: 'Data' },
        { type: 'MATH', category: 'Data' },
        // Integration
        { type: 'EXTERNAL', category: 'Integration' },
        { type: 'TEMPLATE', category: 'Integration' },
      ];

      // Group by category
      const categorizedComponents = componentTypes.reduce((acc, { type, category }) => {
        if (!acc[category]) acc[category] = [];
        const template = getComponentTemplate(type);
        acc[category].push({
          id: `insert-${type}`,
          label: template?.label || type,
          onClick: () => handleInsertAction(type)
        });
        return acc;
      }, {} as Record<string, MenuItem[]>);

      // Create submenu items for each category
      const insertSubmenus: MenuItem[] = Object.entries(categorizedComponents).map(([category, items]) => ({
        id: `insert-category-${category}`,
        label: category,
        submenu: items
      }));

      sections.push({
        title: 'Insert',
        items: insertSubmenus
      });
    }

    return sections;
  }, [
    targetComponentId, 
    targetComponent, 
    selectedComponents, 
    canvasPosition,
    handleSelectAction,
    handleEditAction,
    handleInsertAction,
    getComponentTemplate
  ]);

  if (!position) return null;

  const menuSections = buildMenuSections();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-vscode-menu-background border border-vscode-menu-border rounded-md shadow-lg min-w-48 py-1"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {menuSections.map((section, sectionIndex) => (
        <div key={section.title}>
          {/* Section Header */}
          <div className="px-3 py-1 text-xs font-semibold text-vscode-menu-separatorBackground uppercase tracking-wide">
            {section.title}
          </div>
          
          {/* Section Items */}
          {section.items.map((item) => (
            <div key={item.id} className="relative">
              <button
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  text-vscode-menu-foreground hover:bg-vscode-menu-selectionBackground
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${item.disabled ? '' : 'hover:text-vscode-menu-selectionForeground'}
                `}
                disabled={item.disabled}
                onClick={item.submenu ? undefined : item.onClick}
                onMouseEnter={() => item.submenu ? setActiveSubmenu(item.id) : setActiveSubmenu(null)}
              >
                <div className="flex items-center space-x-2">
                  {item.icon && (
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </div>
                
                {item.submenu && (
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
              
              {/* Submenu */}
              {item.submenu && activeSubmenu === item.id && (
                <div
                  className="absolute left-full top-0 ml-1 bg-vscode-menu-background border border-vscode-menu-border rounded-md shadow-lg min-w-40 py-1 z-10"
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      className="w-full px-3 py-2 text-left text-sm text-vscode-menu-foreground hover:bg-vscode-menu-selectionBackground hover:text-vscode-menu-selectionForeground"
                      onClick={subItem.onClick}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Section Separator */}
          {sectionIndex < menuSections.length - 1 && (
            <div className="my-1 border-t border-vscode-menu-separatorBackground" />
          )}
        </div>
      ))}
    </div>
  );
};