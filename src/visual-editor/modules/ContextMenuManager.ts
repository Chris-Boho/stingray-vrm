import {
    Position,
    IContextMenuManager,
    IStateManager,
    ISelectionManager,
    IRenderingManager,
    VrmComponent,
    IKeyboardManager,
    CustomWindow
} from '../../types';

declare const window: CustomWindow;

export class ContextMenuManager implements IContextMenuManager {

    public showContextMenu(x: number, y: number): void {
        const stateManager: IStateManager = window.stateManager;

        // Remove existing context menu if any
        const existingMenu = stateManager.getContextMenu();
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }

        stateManager.setIsContextMenuOpen(true);

        // Create main context menu
        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.backgroundColor = 'var(--vscode-menu-background)';
        contextMenu.style.border = '1px solid var(--vscode-menu-border)';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        contextMenu.style.zIndex = '1000';
        contextMenu.style.minWidth = '180px';
        contextMenu.style.overflow = 'visible';
        contextMenu.style.fontFamily = 'var(--vscode-font-family)';
        contextMenu.style.fontSize = 'var(--vscode-font-size)';

        // Create main menu items
        const mainMenuItems = [
            {
                text: 'Select',
                icon: '📋',
                hasSubmenu: true,
                submenuItems: [
                    {
                        text: 'All Below',
                        icon: '↓',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.selectComponentsBelow(stateManager.getContextMenuPosition());
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'All Above',
                        icon: '↑',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.selectComponentsAbove(stateManager.getContextMenuPosition());
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'All in Row',
                        icon: '↔',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.selectComponentsInRow(stateManager.getContextMenuPosition());
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'All in Column',
                        icon: '↕',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.selectComponentsInColumn(stateManager.getContextMenuPosition());
                            this.closeContextMenu();
                        }
                    },
                    { separator: true },
                    {
                        text: 'Select All',
                        icon: '⌘',
                        shortcut: 'Ctrl+A',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.selectAllComponents();
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'Clear Selection',
                        icon: '✕',
                        shortcut: 'Esc',
                        action: () => {
                            const selectionManager: ISelectionManager = window.selectionManager;
                            selectionManager.clearSelection();
                            this.closeContextMenu();
                        }
                    }
                ]
            },
            {
                text: 'Edit',
                icon: '✏️',
                hasSubmenu: true,
                submenuItems: [
                    {
                        text: 'Cut',
                        icon: '✂️',
                        shortcut: 'Ctrl+X',
                        action: () => {
                            // TODO: Implement cut functionality
                            console.log('Cut selected components');
                            this.showTemporaryMessage('Cut functionality coming soon');
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'Copy',
                        icon: '📋',
                        shortcut: 'Ctrl+C',
                        action: () => {
                            // TODO: Implement copy functionality
                            console.log('Copy selected components');
                            this.showTemporaryMessage('Copy functionality coming soon');
                            this.closeContextMenu();
                        }
                    },
                    {
                        text: 'Paste',
                        icon: '📄',
                        shortcut: 'Ctrl+V',
                        action: () => {
                            // TODO: Implement paste functionality
                            console.log('Paste components');
                            this.showTemporaryMessage('Paste functionality coming soon');
                            this.closeContextMenu();
                        }
                    },
                    { separator: true },
                    {
                        text: 'Delete Selected',
                        icon: '🗑️',
                        shortcut: 'Del',
                        action: () => {
                            this.deleteSelectedComponents();
                            this.closeContextMenu();
                        },
                        enabled: stateManager.getSelectedComponents().size > 0
                    }
                ]
            },
            {
                text: 'Insert Component',
                icon: '➕',
                hasSubmenu: true,
                submenuItems: [
                    {
                        text: 'SQL Transaction',
                        icon: '🔄',
                        action: () => {
                            this.insertComponent('SQLTRN', 'SQL Transaction');
                        }
                    },
                    {
                        text: 'Select Query',
                        icon: '🔍',
                        action: () => {
                            this.insertComponent('SELECTQUERY', 'Select Query');
                        }
                    },
                    {
                        text: 'Insert/Update Query',
                        icon: '📝',
                        action: () => {
                            this.insertComponent('INSERTUPDATEQUERY', 'Insert/Update Query');
                        }
                    },
                    {
                        text: 'Script Function',
                        icon: '⚙️',
                        action: () => {
                            this.insertComponent('CSF', 'Script Function');
                        }
                    },
                    {
                        text: 'Script Block',
                        icon: '💻',
                        action: () => {
                            this.insertComponent('SCRIPT', 'Script Block');
                        }
                    },
                    {
                        text: 'Condition (IF)',
                        icon: '❓',
                        action: () => {
                            this.insertComponent('IF', 'Condition (IF)');
                        }
                    },
                    {
                        text: 'Error Component',
                        icon: '⚠️',
                        action: () => {
                            this.insertComponent('ERROR', 'Error Component');
                        }
                    },
                    {
                        text: 'Multi-Set Variables',
                        icon: '📊',
                        action: () => {
                            this.insertComponent('SET', 'Multi-Set Variables');
                        }
                    },
                    {
                        text: 'Math Operation',
                        icon: '🔢',
                        action: () => {
                            this.insertComponent('MATH', 'Math Operation');
                        }
                    },
                    {
                        text: 'External Call',
                        icon: '🌐',
                        action: () => {
                            this.insertComponent('EXTERNAL', 'External Call');
                        }
                    },
                    {
                        text: 'Template',
                        icon: '📋',
                        action: () => {
                            this.insertComponent('TEMPLATE', 'Template');
                        }
                    }
                ]
            }
        ];

        // Build menu structure
        this.buildMenuItem(contextMenu, mainMenuItems);

        document.body.appendChild(contextMenu);

        // Store reference to menu
        stateManager.setContextMenu(contextMenu);

        // Close menu when clicking outside
        const closeMenu = (e: Event) => {
            if (contextMenu && !this.isClickInsideAnyMenu(e.target as Node)) {
                this.closeContextMenu();
                document.removeEventListener('click', closeMenu);
            }
        };

        // Use setTimeout to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    private deleteSelectedComponents(): void {
        const stateManager: IStateManager = window.stateManager;
        const selectedComponents = stateManager.getSelectedComponents();

        if (selectedComponents.size === 0) {
            this.showTemporaryMessage('No components selected to delete');
            return;
        }

        console.log('Context menu delete triggered with', selectedComponents.size, 'components');

        // Simple approach: directly trigger delete key event
        const deleteEvent = new KeyboardEvent('keydown', {
            key: 'Delete',
            bubbles: true,
            cancelable: true
        });

        // Dispatch to document to ensure it gets picked up
        document.dispatchEvent(deleteEvent);
    }

    private buildMenuItem(parentElement: HTMLElement, menuItems: any[], level: number = 0): void {
        menuItems.forEach((item, index) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.height = '1px';
                separator.style.backgroundColor = 'var(--vscode-menu-separatorBackground)';
                separator.style.margin = '4px 0';
                parentElement.appendChild(separator);
                return;
            }

            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.style.display = 'flex';
            menuItem.style.alignItems = 'center';
            menuItem.style.justifyContent = 'space-between';
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.color = 'var(--vscode-menu-foreground)';
            menuItem.style.transition = 'background-color 0.2s';
            menuItem.style.position = 'relative';

            // Check if item is disabled
            const isDisabled = item.enabled === false;
            if (isDisabled) {
                menuItem.style.opacity = '0.5';
                menuItem.style.cursor = 'default';
                menuItem.style.color = 'var(--vscode-descriptionForeground)';
            }

            // Left side content (icon + text)
            const leftContent = document.createElement('div');
            leftContent.style.display = 'flex';
            leftContent.style.alignItems = 'center';
            leftContent.style.gap = '8px';

            // Icon
            if (item.icon) {
                const icon = document.createElement('span');
                icon.textContent = item.icon;
                icon.style.fontSize = '12px';
                icon.style.width = '16px';
                icon.style.textAlign = 'center';
                leftContent.appendChild(icon);
            }

            // Text
            const text = document.createElement('span');
            text.textContent = item.text;
            leftContent.appendChild(text);

            menuItem.appendChild(leftContent);

            // Right side content (shortcut + submenu arrow)
            const rightContent = document.createElement('div');
            rightContent.style.display = 'flex';
            rightContent.style.alignItems = 'center';
            rightContent.style.gap = '8px';

            // Shortcut
            if (item.shortcut) {
                const shortcut = document.createElement('span');
                shortcut.textContent = item.shortcut;
                shortcut.style.fontSize = '11px';
                shortcut.style.color = 'var(--vscode-descriptionForeground)';
                rightContent.appendChild(shortcut);
            }

            // Submenu arrow
            if (item.hasSubmenu) {
                const arrow = document.createElement('span');
                arrow.textContent = '▶';
                arrow.style.fontSize = '10px';
                arrow.style.color = 'var(--vscode-descriptionForeground)';
                rightContent.appendChild(arrow);
            }

            menuItem.appendChild(rightContent);

            // Hover effects (only if not disabled)
            if (!isDisabled) {
                menuItem.onmouseover = () => {
                    // Remove hover from siblings
                    Array.from(parentElement.children).forEach(child => {
                        if (child !== menuItem && child.classList.contains('menu-item')) {
                            (child as HTMLElement).style.backgroundColor = 'transparent';
                            (child as HTMLElement).style.color = 'var(--vscode-menu-foreground)';
                        }
                    });

                    menuItem.style.backgroundColor = 'var(--vscode-menu-selectionBackground)';
                    menuItem.style.color = 'var(--vscode-menu-selectionForeground)';
                };

                menuItem.onmouseout = () => {
                    menuItem.style.backgroundColor = 'transparent';
                    menuItem.style.color = 'var(--vscode-menu-foreground)';
                };
            }

            // Click handler (only if not disabled)
            if (!isDisabled) {
                if (item.hasSubmenu && level === 0) {
                    // Main menu items with submenus - show submenu on click
                    menuItem.onclick = (e) => {
                        e.stopPropagation();

                        // Hide any existing submenus from siblings
                        Array.from(parentElement.children).forEach(child => {
                            if (child !== menuItem && child.classList.contains('menu-item')) {
                                this.hideSubmenus(child as HTMLElement);
                            }
                        });

                        // Toggle submenu for this item
                        const existingSubmenu = menuItem.querySelector('.submenu');
                        if (existingSubmenu) {
                            this.hideSubmenus(menuItem);
                        } else {
                            this.showSubmenu(menuItem, item.submenuItems, level);
                        }
                    };
                } else if (item.hasSubmenu) {
                    // Nested submenu items - show on hover
                    menuItem.onmouseover = () => {
                        // Hide submenus from siblings
                        Array.from(parentElement.children).forEach(child => {
                            if (child !== menuItem && child.classList.contains('menu-item')) {
                                this.hideSubmenus(child as HTMLElement);
                            }
                        });

                        // Show submenu for this item
                        const existingSubmenu = menuItem.querySelector('.submenu');
                        if (!existingSubmenu) {
                            this.showSubmenu(menuItem, item.submenuItems, level);
                        }

                        // Apply hover style
                        menuItem.style.backgroundColor = 'var(--vscode-menu-selectionBackground)';
                        menuItem.style.color = 'var(--vscode-menu-selectionForeground)';
                    };
                } else if (item.action) {
                    // Items with actions - execute action on click
                    menuItem.onclick = (e) => {
                        e.stopPropagation();
                        item.action();
                    };
                }
            }

            parentElement.appendChild(menuItem);
        });
    }

    private showSubmenu(parentItem: HTMLElement, submenuItems: any[], level: number): void {
        // Remove existing submenu if any
        this.hideSubmenus(parentItem);

        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        submenu.style.position = 'absolute';
        submenu.style.backgroundColor = 'var(--vscode-menu-background)';
        submenu.style.border = '1px solid var(--vscode-menu-border)';
        submenu.style.borderRadius = '4px';
        submenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        submenu.style.zIndex = (1001 + level).toString();
        submenu.style.minWidth = '200px';
        submenu.style.overflow = 'visible';
        submenu.style.fontFamily = 'var(--vscode-font-family)';
        submenu.style.fontSize = 'var(--vscode-font-size)';

        // Position submenu to the right of parent item
        const parentRect = parentItem.getBoundingClientRect();
        submenu.style.left = (parentRect.width - 2) + 'px';
        submenu.style.top = '0px';

        // Build submenu items
        this.buildMenuItem(submenu, submenuItems, level + 1);

        parentItem.appendChild(submenu);

        // Adjust position if submenu goes off screen
        setTimeout(() => {
            const submenuRect = submenu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Check if submenu goes off right edge
            if (submenuRect.right > windowWidth) {
                submenu.style.left = (-submenuRect.width + 2) + 'px';
            }

            // Check if submenu goes off bottom edge
            if (submenuRect.bottom > windowHeight) {
                const adjustment = Math.min(submenuRect.bottom - windowHeight + 10, submenuRect.height - 50);
                submenu.style.top = (-adjustment) + 'px';
            }
        }, 10);
    }

    private hideSubmenus(parentItem: HTMLElement): void {
        const existingSubmenu = parentItem.querySelector('.submenu');
        if (existingSubmenu) {
            parentItem.removeChild(existingSubmenu);
        }
    }

    private isClickInsideAnyMenu(target: Node): boolean {
        let element = target as HTMLElement;
        while (element) {
            if (element.classList && (element.classList.contains('context-menu') || element.classList.contains('submenu'))) {
                return true;
            }
            element = element.parentElement as HTMLElement;
        }
        return false;
    }

    private insertComponent(componentType: string, componentName: string): void {
        console.log(`Insert ${componentType} component: ${componentName}`);
        this.closeContextMenu();

        const stateManager: IStateManager = window.stateManager;

        try {
            // Get context menu position for component placement
            const contextPos = stateManager.getContextMenuPosition();

            // Snap to grid
            const snapped = stateManager.snapToGrid(contextPos.x, contextPos.y);

            // Get current section and existing components
            const currentSection = stateManager.getActiveTab() as 'preproc' | 'postproc';
            const existingComponents = currentSection === 'preproc' ?
                stateManager.getPreprocComponents() : stateManager.getPostprocComponents();

            // Access ComponentTemplates from window (it should be available in the context)
            const ComponentTemplates = (window as any).ComponentTemplates;
            if (!ComponentTemplates) {
                throw new Error('ComponentTemplates not available - make sure it is properly injected');
            }

            // Create new component using template
            const newComponent = ComponentTemplates.createComponent(
                componentType,
                currentSection,
                existingComponents,
                snapped.x,
                snapped.y
            );

            console.log('Created new component via context menu:', newComponent);

            // Add to state
            if (currentSection === 'preproc') {
                stateManager.getPreprocComponents().push(newComponent);
            } else {
                stateManager.getPostprocComponents().push(newComponent);
            }

            // Update component counts
            stateManager.updateComponentCounts();

            // Re-render the current section
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = currentSection + 'Canvas';
            const components = currentSection === 'preproc' ?
                stateManager.getPreprocComponents() : stateManager.getPostprocComponents();

            renderingManager.renderComponentSection(components, canvasId);

            // Send to extension to update VRM file
            this.saveNewComponent(newComponent);

            // Show success message
            this.showTemporaryMessage(`Added ${componentName} #${newComponent.n}`);

        } catch (error) {
            console.error('Error creating component:', error);
            this.showTemporaryMessage(`Error creating ${componentName}: ${error}`);
        }
    }

    private saveNewComponent(component: VrmComponent): void {
        // Get VS Code API safely
        let vscode = (window as any).vscode;
        if (!vscode && (window as any).acquireVsCodeApi) {
            try {
                vscode = (window as any).acquireVsCodeApi();
                (window as any).vscode = vscode;
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                vscode = (window as any).vscode;
            }
        }

        if (vscode && vscode.postMessage) {
            vscode.postMessage({
                command: 'addComponent',
                component: component
            });
        } else {
            console.warn('VS Code API not available, cannot save new component');
        }
    }

    public closeContextMenu(): void {
        const stateManager: IStateManager = window.stateManager;
        const contextMenu = stateManager.getContextMenu();

        if (contextMenu && contextMenu.parentNode) {
            document.body.removeChild(contextMenu);
        }
        stateManager.setContextMenu(null);

        // Reset flag when menu is closed, with a small delay to prevent immediate selection clearing
        setTimeout(() => {
            stateManager.setIsContextMenuOpen(false);
        }, 50);
    }

    public handleRightClick(e: MouseEvent): boolean {
        e.preventDefault();

        const canvas = e.target as HTMLElement;
        const rect = canvas.getBoundingClientRect();
        const stateManager: IStateManager = window.stateManager;

        // Store the click position for the context menu
        const contextMenuPosition: Position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        stateManager.setContextMenuPosition(contextMenuPosition);

        // Show the context menu at the click position
        this.showContextMenu(e.clientX, e.clientY);

        // Prevent the default context menu
        return false;
    }

    public showTemporaryMessage(message: string): void {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = 'var(--vscode-notifications-background)';
        messageElement.style.color = 'var(--vscode-notifications-foreground)';
        messageElement.style.border = '1px solid var(--vscode-notifications-border)';
        messageElement.style.padding = '8px 16px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '10000';
        messageElement.style.fontSize = '12px';
        messageElement.style.fontFamily = 'var(--vscode-font-family)';
        messageElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        messageElement.style.transition = 'opacity 0.3s ease';

        document.body.appendChild(messageElement);

        // Remove after 2 seconds
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    document.body.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }

    public static inject(): string {
        return `
            window.contextMenuManager = new (${ContextMenuManager.toString()})();
            
            // Make functions globally available
            window.handleRightClick = (e) => window.contextMenuManager.handleRightClick(e);
            window.showTemporaryMessage = (message) => window.contextMenuManager.showTemporaryMessage(message);
        `;
    }
}