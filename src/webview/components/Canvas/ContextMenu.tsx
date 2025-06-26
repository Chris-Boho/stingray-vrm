import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStoreApi } from '@xyflow/react';
import { ComponentType } from '../../types/vrm';
import { useSelectionStore } from '../../stores/selectionStore';
import { useComponentStore } from '../../stores/componentStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';

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

// Update the MenuItem type at the top of your file
type MenuItem = 
  | {
      id: string;
      label: string;
      icon?: React.ReactNode;
      disabled?: boolean;
      onClick?: () => void;
      submenu?: MenuItem[];
      type?: undefined;
    }
  | {
      type: 'divider';
      id?: never;
      label?: never;
      icon?: never;
      disabled?: never;
      onClick?: never;
      submenu?: never;
    };

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  targetComponentId,
  canvasPosition
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  
  // React Flow store API for internal selection management
  const store = useStoreApi();
  
  const { selectedComponents, clearSelection, selectAll, selectComponents } = useSelectionStore();
  const { setEditingComponent, getComponentTemplate } = useComponentStore();
  const { document } = useDocumentStore();
  const { activeSection } = useEditorStore();

  // Get component data if we have a target
  const targetComponent = targetComponentId 
    ? [...(document?.preproc || []), ...(document?.postproc || [])].find(c => c.n === targetComponentId)
    : null;

  // Get all components in the current section
  const currentSectionComponents = document 
    ? (activeSection === 'preproc' ? document.preproc : document.postproc)
    : [];

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
  const handleSelectAction = useCallback((action: string, canvasPosition?: { x: number; y: number }) => {
    const reactFlowState = store.getState();
    
    switch (action) {
      case 'select-all':
        // Get all component IDs in current section
        const allComponentIds = currentSectionComponents.map(c => c.n);
        const allNodeIds = allComponentIds.map(id => id.toString());
        
        // Clear our store first
        clearSelection();
        
        // Update React Flow selection with all nodes
        reactFlowState.addSelectedNodes(allNodeIds);
        
        // Update our store with all component IDs
        selectAll(allComponentIds);
        break;
        
      case 'select-clear':
        // Clear React Flow selection
        reactFlowState.addSelectedNodes([]);
        
        // Clear our store
        clearSelection();
        break;
      
      case 'select-all-above':
        if (!canvasPosition) return;
        // Get component IDs above cursor
        const aboveComponentIds = currentSectionComponents.filter(c => c.y < canvasPosition.y).map(c => c.n);
        
        // Clear our store first
        clearSelection();
        
        // Update React Flow selection with all nodes
        reactFlowState.addSelectedNodes(aboveComponentIds.map(id => id.toString()));
        
        // Update our store with all component IDs
        selectComponents(aboveComponentIds);
        break;

      case 'select-all-below':
        if (!canvasPosition) return;
        // Get component IDs below cursor
        const belowComponentIds = currentSectionComponents.filter(c => c.y > canvasPosition.y).map(c => c.n);
        
        // Clear our store first
        clearSelection();
        
        // Update React Flow selection with all nodes
        reactFlowState.addSelectedNodes(belowComponentIds.map(id => id.toString()));
        
        // Update our store with all component IDs
        selectComponents(belowComponentIds);
        break;
    }
    onClose();
  }, [
    clearSelection, 
    selectAll,
    currentSectionComponents,
    activeSection,
    store,
    onClose
  ]);

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
    const mainMenuItems: MenuItem[] = [];

    // SELECT section - only show global selection actions
    const hasSelection = selectedComponents.length > 0;
    const allComponentsSelected = selectedComponents.length === currentSectionComponents.length && currentSectionComponents.length > 0;

    // Select menu
    mainMenuItems.push({
      id: 'select',
      label: 'Select',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
      ),
      submenu: [
        {
          id: 'select-all',
          label: 'Select All',
          onClick: () => {
            handleSelectAction('select-all')
          },
          disabled: currentSectionComponents.length === 0 || allComponentsSelected,
        },
        {
          id: 'select-none',
          label: 'Select None',
          disabled: selectedComponents.length === 0,
          onClick: () => {
            clearSelection();
            onClose();
          }
        },
        {
          id: 'select-invert',
          label: 'Invert Selection',
          disabled: selectedComponents.length === 0,
          onClick: () => {
            const allIds = currentSectionComponents.map(c => c.n);
            const inverted = allIds.filter(id => !selectedComponents.includes(id));
            selectComponents(inverted);
            onClose();
          }
        },
        { type: 'divider' },
        {
          id: 'select-all-above',
          label: 'All Above',
          onClick: () => {
            handleSelectAction('select-all-above', canvasPosition)
            // onClose();
          }
        },
        {
          id: 'select-all-below',
          label: 'All Below',
          onClick: () => {
            handleSelectAction('select-all-below')
            onClose();
          }
        }
      ]
    });

    // Edit menu
    mainMenuItems.push({
      id: 'edit',
      label: 'Edit',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
      ),
      submenu: [
        {
          id: 'edit-cut',
          label: 'Cut',
          disabled: selectedComponents.length === 0,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12a1 1 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          ),
          onClick: () => {
            console.log('Cut components:', selectedComponents);
            onClose();
          }
        },
        {
          id: 'edit-copy',
          label: 'Copy',
          disabled: selectedComponents.length === 0,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          ),
          onClick: () => {
            console.log('Copy components:', selectedComponents);
            onClose();
          }
        },
        {
          id: 'edit-paste',
          label: 'Paste',
          disabled: true, // TODO: Enable when clipboard has content
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          ),
          onClick: () => {
            console.log('Paste components');
            onClose();
          }
        },
        { type: 'divider' },
        {
          id: 'edit-delete',
          label: 'Delete',
          disabled: selectedComponents.length === 0,
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          ),
          onClick: () => {
            handleEditAction('edit-delete');
            onClose();
          }
        },
        { type: 'divider' },
        {
          id: 'edit-properties',
          label: 'Properties',
          disabled: selectedComponents.length !== 1,
          onClick: () => {
            if (selectedComponents.length === 1) {
              handleEditAction('edit-properties');
              onClose();
            }
          }
        }
      ]
    });

    // Insert menu
    mainMenuItems.push({
      id: 'insert',
      label: 'Insert',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
      ),
      submenu: [
        { id: 'insert-sqltrn', label: 'Transaction', onClick: () => handleInsertAction('SQLTRN') },
        { id: 'insert-select', label: 'Select Query', onClick: () => handleInsertAction('SELECTQUERY') },
        { id: 'insert-update', label: 'Insert/Update Query', onClick: () => handleInsertAction('INSERTUPDATEQUERY') },
        { type: 'divider' },
        { id: 'insert-csf', label: 'Script Function', onClick: () => handleInsertAction('CSF') },
        { id: 'insert-script', label: 'Script Block', onClick: () => handleInsertAction('SCRIPT') },
        { type: 'divider' },
        { id: 'insert-if', label: 'IF', onClick: () => handleInsertAction('IF') },
        { id: 'insert-error', label: 'Error', onClick: () => handleInsertAction('ERROR') },
        { type: 'divider' },
        { id: 'insert-set', label: 'Set', onClick: () => handleInsertAction('SET') },
        { id: 'insert-math', label: 'Math', onClick: () => handleInsertAction('MATH') },
        { type: 'divider' },
        { id: 'insert-external', label: 'External', onClick: () => handleInsertAction('EXTERNAL') },
        { id: 'insert-template', label: 'Template', onClick: () => handleInsertAction('TEMPLATE') }
      ]
    });

    // Add the main menu items as a single section
    if (mainMenuItems.length > 0) {
      sections.push({
        title: '',
        items: mainMenuItems
      });
    }

    return sections;
  }, [
    targetComponentId,
    targetComponent,
    selectedComponents,
    currentSectionComponents,
    handleEditAction,
    handleInsertAction,
    selectComponents,
    clearSelection,
    onClose
  ]);

  if (!position) return null;

  const menuSections = buildMenuSections();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 border border-vscode-menu-border rounded-md shadow-lg min-w-48 py-1.5 transition-all duration-150 ease-out transform origin-top-left bg-vscode-menu-background"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="rounded-md">
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex}>
            {section.title && (
              <div className="px-4 py-1.5 text-[11px] font-medium text-vscode-descriptionForeground uppercase tracking-wider">
                {section.title}
              </div>
            )}
            
            {section.items.map((item) => (
              <div key={item.id || `divider-${Math.random()}`} className="relative group">
                {item.type === 'divider' ? (
                  <div className="my-1.5 mx-2 border-t border-vscode-menu-separatorBackground" />
                ) : (
                  <>
                    <button
                      className={`
                        w-full px-4 py-1.5 text-left text-sm flex items-center justify-between
                        text-vscode-menu-foreground hover:bg-vscode-menu-selectionBackground
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${item.disabled ? '' : 'hover:text-vscode-menu-selectionForeground'}
                      `}
                      disabled={item.disabled}
                      onClick={item.submenu ? undefined : (e) => {
                        e.stopPropagation();
                        item.onClick?.();
                      }}
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
                    
                    {item.submenu && activeSubmenu === item.id && (
                      <div
                        className="absolute left-full top-0 ml-1 bg-vscode-menu-background border border-vscode-menu-border rounded-md shadow-lg min-w-40 py-1.5 z-10"
                        onMouseEnter={() => setActiveSubmenu(item.id)}
                        onMouseLeave={() => setActiveSubmenu(null)}
                      >
                        {item.submenu.map((subItem) => (
                          <div key={subItem.id || `subdivider-${Math.random()}`}>
                            {subItem.type === 'divider' ? (
                              <div className="my-1.5 mx-2 border-t border-vscode-menu-separatorBackground" />
                            ) : (
                              <button
                                className={`
                                  w-full px-4 py-1.5 text-left text-sm flex items-center
                                  text-vscode-menu-foreground hover:bg-vscode-menu-selectionBackground
                                  hover:text-vscode-menu-selectionForeground
                                  ${subItem.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                disabled={subItem.disabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  subItem.onClick?.();
                                  onClose();
                                }}
                              >
                                {subItem.icon && (
                                  <span className="w-4 h-4 mr-2 flex-shrink-0">
                                    {subItem.icon}
                                  </span>
                                )}
                                <span>{subItem.label}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            
            {sectionIndex < menuSections.length - 1 && section.items.length > 0 && (
              <div className="my-1.5 mx-2 border-t border-vscode-menu-separatorBackground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};