import { StateManager } from './modules/StateManager';
import { ContextMenuManager } from './modules/ContextMenuManager';
import { SelectionManager } from './modules/SelectionManager';
import { DragDropManager } from './modules/DragDropManager';
import { RenderingManager } from './modules/RenderingManager';
import { ComponentEditor } from './modules/ComponentEditor';
import { KeyboardManager } from './modules/KeyboardManager';
import { ConnectionManager } from './modules/ConnectionManager';

export function getEditorScripts(): string {
    return `
        // =================================================================
        // VRM Editor JavaScript - Modular Architecture
        // =================================================================
        
        ${StateManager.inject()}
        
        ${ContextMenuManager.inject()}
        
        ${SelectionManager.inject()}
        
        ${DragDropManager.inject()}
        
        ${RenderingManager.inject()}
        
        ${ComponentEditor.inject()}
        
        ${KeyboardManager.inject()}
        
        ${ConnectionManager.inject()}
        
        // =================================================================
        // Initialization
        // =================================================================
        
        // Initialize everything when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM Content Loaded - setting up VRM editor');
            
            // Initialize all managers
            window.keyboardManager.initializeDragPrevention();
            window.keyboardManager.initializeKeyboardHandlers();
            window.keyboardManager.initializeGlobalClickHandler();
        });
    `;
}