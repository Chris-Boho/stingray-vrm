import { 
    Position,
    IContextMenuManager,
    IStateManager,
    ISelectionManager,
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
        
        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.backgroundColor = 'var(--vscode-menu-background)';
        contextMenu.style.border = '1px solid var(--vscode-menu-border)';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        contextMenu.style.zIndex = '1000';
        contextMenu.style.minWidth = '200px';
        contextMenu.style.overflow = 'hidden';
        contextMenu.style.fontFamily = 'var(--vscode-font-family)';
        contextMenu.style.fontSize = 'var(--vscode-font-size)';
        
        // Add menu items
        const menuItems = [
            {
                text: 'Select All Below',
                action: () => {
                    const selectionManager: ISelectionManager = window.selectionManager;
                    selectionManager.selectComponentsBelow(stateManager.getContextMenuPosition());
                    this.closeContextMenu();
                },
                icon: '↓'
            },
            {
                text: 'Select All Above',
                action: () => {
                    const selectionManager: ISelectionManager = window.selectionManager;
                    selectionManager.selectComponentsAbove(stateManager.getContextMenuPosition());
                    this.closeContextMenu();
                },
                icon: '↑'
            },
            {
                text: 'Select All in Row',
                action: () => {
                    const selectionManager: ISelectionManager = window.selectionManager;
                    selectionManager.selectComponentsInRow(stateManager.getContextMenuPosition());
                    this.closeContextMenu();
                },
                icon: '↔'
            },
            {
                text: 'Select All in Column',
                action: () => {
                    const selectionManager: ISelectionManager = window.selectionManager;
                    selectionManager.selectComponentsInColumn(stateManager.getContextMenuPosition());
                    this.closeContextMenu();
                },
                icon: '↕'
            }
        ];
        
        menuItems.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.style.display = 'flex';
            menuItem.style.alignItems = 'center';
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.color = 'var(--vscode-menu-foreground)';
            menuItem.style.transition = 'background-color 0.2s';
            menuItem.style.gap = '8px';
            
            // Add icon
            const icon = document.createElement('span');
            icon.textContent = item.icon;
            icon.style.fontSize = '12px';
            icon.style.width = '16px';
            icon.style.textAlign = 'center';
            
            // Add text
            const text = document.createElement('span');
            text.textContent = item.text;
            
            menuItem.appendChild(icon);
            menuItem.appendChild(text);
            
            menuItem.onmouseover = () => {
                menuItem.style.backgroundColor = 'var(--vscode-menu-selectionBackground)';
                menuItem.style.color = 'var(--vscode-menu-selectionForeground)';
            };
            menuItem.onmouseout = () => {
                menuItem.style.backgroundColor = 'transparent';
                menuItem.style.color = 'var(--vscode-menu-foreground)';
            };
            
            menuItem.onclick = item.action;
            
            contextMenu.appendChild(menuItem);
            
            // Add separator after first item
            if (index === 0) {
                const separator = document.createElement('div');
                separator.style.height = '1px';
                separator.style.backgroundColor = 'var(--vscode-menu-separatorBackground)';
                separator.style.margin = '4px 0';
                contextMenu.appendChild(separator);
            }
        });
        
        document.body.appendChild(contextMenu);
        
        // Store reference to menu
        stateManager.setContextMenu(contextMenu);
        
        // Close menu when clicking outside
        const closeMenu = (e: Event) => {
            if (contextMenu && !contextMenu.contains(e.target as Node)) {
                this.closeContextMenu();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Use setTimeout to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
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