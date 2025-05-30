import { 
    IKeyboardManager,
    IStateManager,
    ISelectionManager,
    IRenderingManager,
    VrmComponent,
    VsCodeApi,
    CustomWindow 
} from '../../types';

declare const window: CustomWindow;

export class KeyboardManager implements IKeyboardManager {
    
    public handleKeyDown(e: KeyboardEvent): void {
        console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
        
        const stateManager: IStateManager = window.stateManager;
        
        // Delete key - delete selected components
        if (e.key === 'Delete' && stateManager.getSelectedComponents().size > 0) {
            e.preventDefault();
            this.deleteSelectedComponents();
        }
        
        // Escape key - clear selection
        if (e.key === 'Escape') {
            e.preventDefault();
            const selectionManager: ISelectionManager = window.selectionManager;
            selectionManager.clearSelection();
            console.log('Selection cleared');
        }
        
        // Ctrl+A - select all components in current tab
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            console.log('Ctrl+A pressed, selecting all');
            const selectionManager: ISelectionManager = window.selectionManager;
            selectionManager.selectAllComponents();
        }
    }
    
    private deleteSelectedComponents(): void {
    const stateManager: IStateManager = window.stateManager;
    const selectedComponents = stateManager.getSelectedComponents();
    
    if (selectedComponents.size === 0) {
        console.log('No components selected for deletion');
        return;
    }
    
    console.log('Deleting selected components:', selectedComponents);
    
    const componentsToDelete: VrmComponent[] = [];
    const deletedIds: number[] = [];
    
    // Collect components to delete from both sections
    selectedComponents.forEach((componentKey: string) => {
        const [section, id] = componentKey.split('-');
        const componentId = parseInt(id);
        
        const components = section === 'preproc' ? 
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        
        const component = components.find((c: VrmComponent) => c.n === componentId);
        if (component) {
            componentsToDelete.push(component);
            deletedIds.push(componentId);
        }
    });
    
    if (componentsToDelete.length === 0) {
        console.log('No valid components found for deletion');
        return;
    }
    
    // NO CONFIRMATION - Just delete immediately
    
    // Perform deletion from state
    this.removeComponentsFromState(componentsToDelete);
    
    // Clean up connections that reference deleted components
    this.cleanupConnectionsToDeletedComponents(deletedIds);
    
    // Clear selection
    const selectionManager: ISelectionManager = window.selectionManager;
    selectionManager.clearSelection();
    
    // Update component counts
    stateManager.updateComponentCounts();
    
    // Re-render both sections
    const renderingManager: IRenderingManager = window.renderingManager;
    renderingManager.renderComponentSection(stateManager.getPreprocComponents(), 'preprocCanvas');
    renderingManager.renderComponentSection(stateManager.getPostprocComponents(), 'postprocCanvas');
    
    // Send delete commands to extension
    this.sendDeleteCommandsToExtension(componentsToDelete);
    
    // Show success message
    this.showMessage(`Deleted ${componentsToDelete.length} component(s)`);
    
    console.log(`Successfully deleted ${componentsToDelete.length} components`);
}
    
    private removeComponentsFromState(componentsToDelete: VrmComponent[]): void {
        const stateManager: IStateManager = window.stateManager;
        
        componentsToDelete.forEach(component => {
            if (component.section === 'preproc') {
                const preprocComponents = stateManager.getPreprocComponents();
                const index = preprocComponents.findIndex(c => c.n === component.n);
                if (index !== -1) {
                    preprocComponents.splice(index, 1);
                }
            } else {
                const postprocComponents = stateManager.getPostprocComponents();
                const index = postprocComponents.findIndex(c => c.n === component.n);
                if (index !== -1) {
                    postprocComponents.splice(index, 1);
                }
            }
        });
    }
    
    private cleanupConnectionsToDeletedComponents(deletedIds: number[]): void {
        const stateManager: IStateManager = window.stateManager;
        
        // Clean up connections in preproc components
        stateManager.getPreprocComponents().forEach(component => {
            if (component.j) {
                let connectionsChanged = false;
                for (let i = 0; i < component.j.length; i++) {
                    if (deletedIds.includes(component.j[i])) {
                        component.j[i] = 0; // Clear the connection
                        connectionsChanged = true;
                    }
                }
                
                // Send update if connections were changed
                if (connectionsChanged) {
                    this.sendComponentUpdateToExtension(component);
                }
            }
        });
        
        // Clean up connections in postproc components
        stateManager.getPostprocComponents().forEach(component => {
            if (component.j) {
                let connectionsChanged = false;
                for (let i = 0; i < component.j.length; i++) {
                    if (deletedIds.includes(component.j[i])) {
                        component.j[i] = 0; // Clear the connection
                        connectionsChanged = true;
                    }
                }
                
                // Send update if connections were changed
                if (connectionsChanged) {
                    this.sendComponentUpdateToExtension(component);
                }
            }
        });
    }
    
    private sendDeleteCommandsToExtension(componentsToDelete: VrmComponent[]): void {
        // Get VS Code API safely
        let vscode: VsCodeApi | undefined = window.vscode;
        if (!vscode && window.acquireVsCodeApi) {
            try {
                vscode = window.acquireVsCodeApi();
                window.vscode = vscode;
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                vscode = window.vscode;
            }
        }
        
        if (vscode && typeof vscode.postMessage === 'function') {
            componentsToDelete.forEach(component => {
                vscode!.postMessage({
                    command: 'deleteComponent',
                    component: component
                });
            });
        } else {
            console.warn('VS Code API not available, cannot send delete commands');
        }
    }
    
    private sendComponentUpdateToExtension(component: VrmComponent): void {
        // Get VS Code API safely
        let vscode: VsCodeApi | undefined = window.vscode;
        if (!vscode && window.acquireVsCodeApi) {
            try {
                vscode = window.acquireVsCodeApi();
                window.vscode = vscode;
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                vscode = window.vscode;
            }
        }
        
        if (vscode && vscode.postMessage) {
            vscode.postMessage({
                command: 'updateComponent',
                component: component
            });
        }
    }
    
    private showMessage(message: string): void {
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    document.body.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }
    
    public initializeKeyboardHandlers(): void {
        const documentAny = document as any;
        if (!documentAny._vrmKeyboardHandlerAdded) {
            document.addEventListener('keydown', (e: KeyboardEvent) => this.handleKeyDown(e));
            documentAny._vrmKeyboardHandlerAdded = true;
            console.log('Keyboard handlers attached');
        }
    }
    
    public initializeGlobalClickHandler(): void {
        document.addEventListener('click', (e: MouseEvent) => {
            const stateManager: IStateManager = window.stateManager;

            // Don't clear selection if shift is held (for connection clearing)
            if (e.shiftKey) {
                return;
            }
            
            // Don't clear selection if we just finished a box selection
            if (stateManager.getJustFinishedSelecting()) {
                return;
            }
            
            // Don't clear selection if context menu is open or was just used
            if (stateManager.getIsContextMenuOpen()) {
                return;
            }
            
            const target = e.target as Element;
            if (!target.closest('.component-details') && 
                !target.closest('.component-node') && 
                !target.closest('.selection-rect')) {
                
                // Only clear selection if not currently selecting
                if (!stateManager.getIsSelecting()) {
                    const selectionManager: ISelectionManager = window.selectionManager;
                    selectionManager.clearSelection();
                }
            }
        });
    }
    
    public initializeDragPrevention(): void {
        const canvases = document.querySelectorAll('.component-canvas');
        canvases.forEach(canvas => {
            canvas.addEventListener('dragstart', (e: Event) => e.preventDefault());
            canvas.addEventListener('selectstart', (e: Event) => e.preventDefault());
        });
    }
    
    public static inject(): string {
        return `
            window.keyboardManager = new (${KeyboardManager.toString()})();
            
            // Make functions globally available
            window.handleKeyDown = (e) => window.keyboardManager.handleKeyDown(e);
            
            // ADDED: Expose delete method globally
            window.deleteSelectedComponents = () => {
                if (window.keyboardManager && window.keyboardManager.deleteSelectedComponents) {
                    window.keyboardManager.deleteSelectedComponents();
                }
            };
        `;
    }
}