export class KeyboardManager {
    
    public handleKeyDown(e: KeyboardEvent): void {
        console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
        
        const stateManager = (window as any).stateManager;
        
        // Delete key - delete selected components
        if (e.key === 'Delete' && stateManager.getSelectedComponents().size > 0) {
            e.preventDefault();
            // TODO: Implement component deletion
            console.log('Delete selected components:', stateManager.getSelectedComponents());
        }
        
        // Escape key - clear selection
        if (e.key === 'Escape') {
            e.preventDefault();
            const selectionManager = (window as any).selectionManager;
            selectionManager.clearSelection();
            console.log('Selection cleared');
        }
        
        // Ctrl+A - select all components in current tab
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            console.log('Ctrl+A pressed, selecting all');
            const selectionManager = (window as any).selectionManager;
            selectionManager.selectAllComponents();
        }
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
            const stateManager = (window as any).stateManager;
            
            // Don't clear selection if we just finished a box selection
            if (stateManager.getJustFinishedSelecting?.()) {
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
                    const selectionManager = (window as any).selectionManager;
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
        `;
    }
}