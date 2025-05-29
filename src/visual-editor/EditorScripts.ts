import { StateManager } from './modules/StateManager';
import { ContextMenuManager } from './modules/ContextMenuManager';
import { SelectionManager } from './modules/SelectionManager';
import { DragDropManager } from './modules/DragDropManager';
import { RenderingManager } from './modules/RenderingManager';
import { ComponentEditor } from './modules/ComponentEditor';
import { KeyboardManager } from './modules/KeyboardManager';
import { ConnectionManager } from './modules/ConnectionManager';
import { ComponentPalette } from './modules/ComponentPalette';
import { ComponentTemplates } from '../ComponentTemplate';

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
        
        ${ComponentPalette.inject()}
        
        // =================================================================
        // Component Templates - FIXED: Better injection method
        // =================================================================
        
        // Method 1: Direct class injection
        try {
            window.ComponentTemplates = (${ComponentTemplates.toString()});
            console.log('ComponentTemplates injected via direct assignment');
        } catch (error) {
            console.warn('Failed to inject ComponentTemplates directly:', error);
        }
        
        // Method 2: Eval-based injection as fallback
        try {
            eval('var ComponentTemplates = (' + ${JSON.stringify(ComponentTemplates.toString())} + ');');
            console.log('ComponentTemplates injected via eval as fallback');
        } catch (error) {
            console.warn('Failed to inject ComponentTemplates via eval:', error);
        }
        
        // Method 3: Create simplified inline version as ultimate fallback
        if (!window.ComponentTemplates && typeof ComponentTemplates === 'undefined') {
            console.warn('Creating inline ComponentTemplates fallback');
            window.ComponentTemplates = {
                createComponent: function(componentType, section, existingComponents, x, y) {
                    // Generate next available component ID
                    var getNextComponentId = function(components) {
                        if (components.length === 0) return 1;
                        var usedIds = components.map(function(c) { return c.n; });
                        var maxId = Math.max.apply(Math, usedIds);
                        for (var i = 1; i <= maxId; i++) {
                            if (usedIds.indexOf(i) === -1) {
                                return i;
                            }
                        }
                        return maxId + 1;
                    };

                    var nextId = getNextComponentId(existingComponents);
                    
                    // Default values by type
                    var getDefaultValues = function(type) {
                        switch (type) {
                            case 'CSF':
                                return { functionName: 'GetConstant', returnValue: '', functionParams: [] };
                            case 'SQLTRN':
                                return { transactionName: '', transactionType: '' };
                            case 'MATH':
                                return { mathName: '', mathFormat: '', mathParam: '' };
                            case 'TEMPLATE':
                                return { templateName: '', templateTarget: '' };
                            case 'INSERTUPDATEQUERY':
                            case 'SELECTQUERY':
                                return { query: '', params: [] };
                            case 'SCRIPT':
                                return { script: '', language: '' };
                            case 'ERROR':
                                return { errorMessage: '' };
                            case 'IF':
                                return { condition: '' };
                            case 'SET':
                                return { variables: [{ name: '', value: '' }] };
                            case 'EXTERNAL':
                                return { externalValue: '' };
                            default:
                                return {};
                        }
                    };
                    
                    return {
                        n: nextId,
                        t: componentType,
                        values: getDefaultValues(componentType),
                        j: [0, 0],
                        x: x,
                        y: y,
                        c: '',
                        wp: null,
                        section: section
                    };
                }
            };
            console.log('Inline ComponentTemplates fallback created');
        }
        
        // Verify ComponentTemplates is available
        setTimeout(function() {
            if (window.ComponentTemplates) {
                console.log('ComponentTemplates successfully available on window object');
            } else if (typeof ComponentTemplates !== 'undefined') {
                console.log('ComponentTemplates available in global scope');
            } else {
                console.error('ComponentTemplates is not available! Component insertion will fail.');
            }
        }, 100);
        
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
            
            // Initialize component palette
            if (window.componentPalette) {
                window.componentPalette.initializePalette();
            }
        });
    `;
}