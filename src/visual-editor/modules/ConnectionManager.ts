import {
    VrmComponent,
    CustomWindow,
    VsCodeApi,
    IStateManager,
    IRenderingManager,
    ISelectionManager
} from '../../types';
import { VSCodeApiHandler } from '../../VSCodeApiHandler';

declare const window: CustomWindow;

export class ConnectionManager {

    public handleShiftClick(e: MouseEvent, targetComponent: VrmComponent): void {
        e.preventDefault();
        e.stopPropagation();

        const stateManager: IStateManager = window.stateManager;

        // Check if exactly one component is selected
        if (stateManager.getSelectedComponents().size !== 1) {
            this.showMessage('Please select exactly one component first before creating connections.');
            return;
        }

        // Get the selected component
        const selectedComponentKeys = Array.from(stateManager.getSelectedComponents());
        const selectedComponentKey = selectedComponentKeys[0] as string;
        const [sourceSection, sourceId] = selectedComponentKey.split('-');

        // Find the source component
        const sourceComponents = sourceSection === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        const sourceComponent = sourceComponents.find((c: VrmComponent) => c.n === parseInt(sourceId));

        if (!sourceComponent) {
            this.showMessage('Source component not found.');
            return;
        }

        // Check if trying to connect to itself
        if (sourceComponent.n === targetComponent.n && sourceComponent.section === targetComponent.section) {
            this.showMessage('Cannot connect a component to itself.');
            return;
        }

        // Check if components are in the same section
        if (sourceComponent.section !== targetComponent.section) {
            this.showMessage('Components must be in the same section to connect.');
            return;
        }

        // Update primary connection (first <j> tag)
        this.updateConnection(sourceComponent, targetComponent.n, 'primary');

        console.log(`Connected component ${sourceComponent.n} to ${targetComponent.n} (primary)`);
        this.showMessage(`Primary connection: ${sourceComponent.n} → ${targetComponent.n}`);
    }

    public handleShiftRightClick(e: MouseEvent, targetComponent: VrmComponent): void {
        e.preventDefault();
        e.stopPropagation();

        const stateManager: IStateManager = window.stateManager;

        // Check if exactly one component is selected
        if (stateManager.getSelectedComponents().size !== 1) {
            this.showMessage('Please select exactly one component first before creating connections.');
            return;
        }

        // Get the selected component
        const selectedComponentKeys = Array.from(stateManager.getSelectedComponents());
        const selectedComponentKey = selectedComponentKeys[0] as string;
        const [sourceSection, sourceId] = selectedComponentKey.split('-');

        // Find the source component
        const sourceComponents = sourceSection === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        const sourceComponent = sourceComponents.find((c: VrmComponent) => c.n === parseInt(sourceId));

        if (!sourceComponent) {
            this.showMessage('Source component not found.');
            return;
        }

        // Check if trying to connect to itself
        if (sourceComponent.n === targetComponent.n && sourceComponent.section === targetComponent.section) {
            this.showMessage('Cannot connect a component to itself.');
            return;
        }

        // Check if components are in the same section
        if (sourceComponent.section !== targetComponent.section) {
            this.showMessage('Components must be in the same section to connect.');
            return;
        }

        // Update secondary connection (second <j> tag)
        this.updateConnection(sourceComponent, targetComponent.n, 'secondary');

        console.log(`Connected component ${sourceComponent.n} to ${targetComponent.n} (secondary)`);
        this.showMessage(`Secondary connection: ${sourceComponent.n} → ${targetComponent.n}`);
    }

    public handleShiftClickOnEmpty(e: MouseEvent, connectionType: 'primary' | 'secondary'): void {
        e.preventDefault();
        e.stopPropagation();

        const stateManager: IStateManager = window.stateManager;

        // Check if exactly one component is selected
        if (stateManager.getSelectedComponents().size !== 1) {
            this.showMessage('Please select exactly one component first before clearing connections.');
            return;
        }

        // Get the selected component
        const selectedComponentKeys = Array.from(stateManager.getSelectedComponents());
        const selectedComponentKey = selectedComponentKeys[0] as string;
        const [sourceSection, sourceId] = selectedComponentKey.split('-');

        // Find the source component
        const sourceComponents = sourceSection === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        const sourceComponent = sourceComponents.find((c: VrmComponent) => c.n === parseInt(sourceId));

        if (!sourceComponent) {
            this.showMessage('Source component not found.');
            return;
        }

        // Clear the appropriate connection
        this.removeConnection(sourceComponent, connectionType);

        const connectionTypeName = connectionType === 'primary' ? 'Primary' : 'Secondary';
        console.log(`Cleared ${connectionType} connection from component ${sourceComponent.n}`);
        this.showMessage(`${connectionTypeName} connection cleared from component ${sourceComponent.n}`);
    }

    private updateConnection(sourceComponent: VrmComponent, targetId: number, connectionType: 'primary' | 'secondary'): void {
        // Ensure the component has a j array
        if (!sourceComponent.j) {
            sourceComponent.j = [];
        }

        // Ensure the j array has at least 2 elements
        while (sourceComponent.j.length < 2) {
            sourceComponent.j.push(0);
        }

        // Update the appropriate connection
        if (connectionType === 'primary') {
            sourceComponent.j[0] = targetId;
        } else { // secondary
            sourceComponent.j[1] = targetId;
        }

        // Send update to extension
        this.saveComponentUpdate(sourceComponent);

        // Re-render the section to show the new connection
        const stateManager: IStateManager = window.stateManager;
        const renderingManager: IRenderingManager = window.renderingManager;
        const components = sourceComponent.section === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        renderingManager.renderComponentSection(components, sourceComponent.section + 'Canvas');

        // Restore selection states after re-rendering
        const selectionManager: ISelectionManager = window.selectionManager;
        selectionManager.restoreSelectionStates();
    }

    public removeConnection(sourceComponent: VrmComponent, connectionType: 'primary' | 'secondary'): void {
        if (!sourceComponent.j || sourceComponent.j.length === 0) {
            return;
        }

        // Remove the appropriate connection
        if (connectionType === 'primary' && sourceComponent.j.length > 0) {
            sourceComponent.j[0] = 0;
        } else if (connectionType === 'secondary' && sourceComponent.j.length > 1) {
            sourceComponent.j[1] = 0;
        }

        // Send update to extension
        this.saveComponentUpdate(sourceComponent);

        // Re-render the section to remove the connection visual
        const stateManager: IStateManager = window.stateManager;
        const renderingManager: IRenderingManager = window.renderingManager;
        const components = sourceComponent.section === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        renderingManager.renderComponentSection(components, sourceComponent.section + 'Canvas');

        // Restore selection states after re-rendering
        const selectionManager: ISelectionManager = window.selectionManager;
        selectionManager.restoreSelectionStates();

        console.log(`Removed ${connectionType} connection from component ${sourceComponent.n}`);
        this.showMessage(`Removed ${connectionType} connection from component ${sourceComponent.n}`);
    }

    private saveComponentUpdate(component: VrmComponent): void {
        const apiHandler = window.vsCodeApiHandler;
        if (apiHandler) {
            apiHandler.updateComponent(component);
        } else {
            console.warn('VS Code API Handler not available, cannot save component update');
        }
    }

    private showMessage(message: string): void {
        // Create a temporary message display
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.right = '20px';
        messageElement.style.backgroundColor = 'var(--vscode-notifications-background)';
        messageElement.style.color = 'var(--vscode-notifications-foreground)';
        messageElement.style.border = '1px solid var(--vscode-notifications-border)';
        messageElement.style.padding = '8px 16px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '10000';
        messageElement.style.fontSize = '12px';
        messageElement.style.fontFamily = 'var(--vscode-font-family)';
        messageElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        messageElement.style.maxWidth = '300px';

        document.body.appendChild(messageElement);

        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    document.body.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }

    public showConnectionMenu(component: VrmComponent, x: number, y: number): void {
        // Remove existing connection menu if any
        const existingMenu = document.querySelector('.connection-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }

        // Create connection menu
        const connectionMenu = document.createElement('div');
        connectionMenu.className = 'connection-menu';
        connectionMenu.style.position = 'absolute';
        connectionMenu.style.left = x + 'px';
        connectionMenu.style.top = y + 'px';
        connectionMenu.style.backgroundColor = 'var(--vscode-menu-background)';
        connectionMenu.style.border = '1px solid var(--vscode-menu-border)';
        connectionMenu.style.borderRadius = '4px';
        connectionMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        connectionMenu.style.zIndex = '1000';
        connectionMenu.style.minWidth = '200px';
        connectionMenu.style.overflow = 'hidden';
        connectionMenu.style.fontFamily = 'var(--vscode-font-family)';
        connectionMenu.style.fontSize = 'var(--vscode-font-size)';

        const primaryConnection = component.j && component.j[0] ? component.j[0] : 'None';
        const secondaryConnection = component.j && component.j[1] ? component.j[1] : 'None';

        // Add menu items
        const menuItems = [
            {
                text: `Primary: ${primaryConnection}`,
                action: primaryConnection !== 'None' ? () => {
                    this.removeConnection(component, 'primary');
                    this.closeConnectionMenu();
                } : null,
                disabled: primaryConnection === 'None'
            },
            {
                text: `Secondary: ${secondaryConnection}`,
                action: secondaryConnection !== 'None' ? () => {
                    this.removeConnection(component, 'secondary');
                    this.closeConnectionMenu();
                } : null,
                disabled: secondaryConnection === 'None'
            }
        ];

        menuItems.forEach((item) => {
            const menuItem = document.createElement('div');
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = item.disabled ? 'default' : 'pointer';
            menuItem.style.color = item.disabled ? 'var(--vscode-descriptionForeground)' : 'var(--vscode-menu-foreground)';
            menuItem.style.opacity = item.disabled ? '0.6' : '1';

            if (!item.disabled) {
                menuItem.style.transition = 'background-color 0.2s';
                menuItem.onmouseover = () => {
                    menuItem.style.backgroundColor = 'var(--vscode-menu-selectionBackground)';
                    menuItem.style.color = 'var(--vscode-menu-selectionForeground)';
                };
                menuItem.onmouseout = () => {
                    menuItem.style.backgroundColor = 'transparent';
                    menuItem.style.color = 'var(--vscode-menu-foreground)';
                };

                if (item.action) {
                    menuItem.onclick = item.action;
                }
            }

            menuItem.textContent = item.text;
            connectionMenu.appendChild(menuItem);
        });

        // Add instructions
        const instructions = document.createElement('div');
        instructions.style.padding = '8px 16px';
        instructions.style.borderTop = '1px solid var(--vscode-menu-separatorBackground)';
        instructions.style.fontSize = '11px';
        instructions.style.color = 'var(--vscode-descriptionForeground)';
        instructions.innerHTML = '<strong>Shift+Click:</strong> Set primary<br><strong>Shift+Right-click:</strong> Set secondary';
        connectionMenu.appendChild(instructions);

        document.body.appendChild(connectionMenu);

        // Close menu when clicking outside
        const closeMenu = (e: Event) => {
            if (connectionMenu && !connectionMenu.contains(e.target as Node)) {
                this.closeConnectionMenu();
                document.removeEventListener('click', closeMenu);
            }
        };

        // Use setTimeout to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    private closeConnectionMenu(): void {
        const connectionMenu = document.querySelector('.connection-menu');
        if (connectionMenu && connectionMenu.parentNode) {
            document.body.removeChild(connectionMenu);
        }
    }

    public static inject(): string {
        return `
            window.connectionManager = new (${ConnectionManager.toString()})();
            
            // Make functions globally available
            window.handleShiftClick = (e, targetComponent) => window.connectionManager.handleShiftClick(e, targetComponent);
            window.handleShiftRightClick = (e, targetComponent) => window.connectionManager.handleShiftRightClick(e, targetComponent);
            window.handleShiftClickOnEmpty = (e, connectionType) => window.connectionManager.handleShiftClickOnEmpty(e, connectionType);
            window.showConnectionMenu = (component, x, y) => window.connectionManager.showConnectionMenu(component, x, y);
        `;
    }
}