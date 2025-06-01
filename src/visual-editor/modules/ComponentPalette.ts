import {
    VrmComponent,
    IStateManager,
    IRenderingManager,
    VsCodeApi,
    CustomWindow
} from '../../types';
import { VSCodeApiHandler } from '../../VSCodeApiHandler';

declare const window: CustomWindow;

export class ComponentPalette {
    private isDraggingFromPalette: boolean = false;
    private draggedComponentType: string | null = null;
    private paletteGhost: HTMLElement | null = null;

    // Component definitions with icons and descriptions
    private componentDefinitions = [
        {
            type: 'SQLTRN',
            name: 'SQL Transaction',
            icon: '🔄',
            description: 'Begin, commit, or rollback database transactions',
            category: 'Database'
        },
        {
            type: 'CSF',
            name: 'Script Function',
            icon: '⚙️',
            description: 'Call server-side script functions with parameters',
            category: 'Script'
        },
        {
            type: 'SCRIPT',
            name: 'Script Block',
            icon: '💻',
            description: 'Execute custom script code (Pascal)',
            category: 'Script'
        },
        {
            type: 'ERROR',
            name: 'Error',
            icon: '⚠️',
            description: 'Display error messages and halt execution',
            category: 'Control'
        },
        {
            type: 'IF',
            name: 'Condition',
            icon: '❓',
            description: 'Conditional branching based on expressions',
            category: 'Control'
        },
        {
            type: 'MATH',
            name: 'Math Operation',
            icon: '🔢',
            description: 'Perform calculations and format numbers',
            category: 'Data'
        },
        {
            type: 'SET',
            name: 'Multi-Set',
            icon: '📊',
            description: 'Set multiple variable values',
            category: 'Data'
        },
        {
            type: 'EXTERNAL',
            name: 'External Call',
            icon: '🌐',
            description: 'Call external rules or procedures',
            category: 'Integration'
        },
        {
            type: 'TEMPLATE',
            name: 'Template',
            icon: '📋',
            description: 'Apply templates to generate content',
            category: 'Integration'
        },
        {
            type: 'INSERTUPDATEQUERY',
            name: 'Insert/Update Query',
            icon: '📝',
            description: 'Insert or update database records',
            category: 'Database'
        },
        {
            type: 'SELECTQUERY',
            name: 'Select Query',
            icon: '🔍',
            description: 'Query database records',
            category: 'Database'
        }
    ];

    public initializePalette(): void {
        // Don't create new palette structure, just populate the existing ones
        this.populateExistingPalette('componentPalette');
        this.populateExistingPalette('componentPalettePostproc');
        this.setupPaletteEventHandlers();
    }

    private populateExistingPalette(paletteId: string): void {
        const palette = document.getElementById(paletteId);
        if (!palette) {
            console.warn(`Palette ${paletteId} not found, creating content in existing structure`);
            return;
        }

        const paletteContent = palette.querySelector('.palette-content');
        if (!paletteContent) {
            console.warn(`Palette content not found in ${paletteId}`);
            return;
        }

        // FIXED: Just display all components in a single horizontal row - no categories at all
        let contentHTML = '';

        this.componentDefinitions.forEach(comp => {
            contentHTML += `
                <div class="palette-component" 
                     data-component-type="${comp.type}"
                     draggable="true"
                     title="${comp.description}">
                    <div class="component-icon">${comp.icon}</div>
                    <div class="component-name">${comp.name}</div>
                </div>
            `;
        });

        paletteContent.innerHTML = contentHTML;
    }

    // Remove the groupComponentsByCategory method since we don't need it

    private setupPaletteEventHandlers(): void {
        // Handle drag start from palette
        document.addEventListener('dragstart', (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('palette-component')) {
                const componentType = target.getAttribute('data-component-type');
                if (componentType) {
                    this.startPaletteDrag(e, componentType);
                }
            }
        });

        // Handle drag over canvas
        document.addEventListener('dragover', (e: DragEvent) => {
            if (this.isDraggingFromPalette) {
                e.preventDefault();
                this.updatePaletteGhost(e);
            }
        });

        // Handle drop on canvas
        document.addEventListener('drop', (e: DragEvent) => {
            if (this.isDraggingFromPalette) {
                e.preventDefault();
                this.handlePaletteDrop(e);
            }
        });

        // Handle drag end - FIXED: Always clean up, even if drop didn't happen
        document.addEventListener('dragend', (e: DragEvent) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('palette-component')) {
                this.endPaletteDrag();
            }
        });

        // FIXED: Handle click for component insertion - only if NOT dragging
        document.addEventListener('click', (e: MouseEvent) => {
            // Don't handle click if we just finished a drag operation
            if (this.isDraggingFromPalette) {
                return;
            }

            const target = e.target as HTMLElement;
            const paletteComponent = target.closest('.palette-component') as HTMLElement;

            if (paletteComponent) {
                const componentType = paletteComponent.getAttribute('data-component-type');
                if (componentType) {
                    // Only insert via click if draggable attribute is false or if it's a deliberate click
                    // Check if this was a mouse click without drag
                    if (!paletteComponent.hasAttribute('data-drag-started')) {
                        // Insert at default position (center of current view)
                        this.insertComponentAtPosition(componentType, 200, 200);
                    }
                }
            }
        });

        // FIXED: Add mouse down/up tracking to distinguish clicks from drags
        document.addEventListener('mousedown', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const paletteComponent = target.closest('.palette-component') as HTMLElement;
            if (paletteComponent) {
                paletteComponent.setAttribute('data-mouse-down', 'true');
            }
        });

        document.addEventListener('mouseup', (e: MouseEvent) => {
            // FIXED: Clean up all palette components, not just the target
            document.querySelectorAll('.palette-component').forEach(component => {
                component.removeAttribute('data-mouse-down');
                component.removeAttribute('data-drag-started');
                // Remove any visual drag states
                component.classList.remove('dragging', 'pressed', 'active');
            });
        });
    }

    private startPaletteDrag(e: DragEvent, componentType: string): void {
        console.log('Starting palette drag for:', componentType);
        this.isDraggingFromPalette = true;
        this.draggedComponentType = componentType;

        // FIXED: Mark the component as drag-started to prevent click handler
        const target = e.target as HTMLElement;
        const paletteComponent = target.closest('.palette-component') as HTMLElement;
        if (paletteComponent) {
            paletteComponent.setAttribute('data-drag-started', 'true');
        }

        // FIXED: Disable the default drag image to prevent ghost effects
        if (e.dataTransfer) {
            // Create a transparent 1x1 pixel image to replace the default drag image
            const emptyImg = new Image();
            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
            e.dataTransfer.setDragImage(emptyImg, 0, 0);

            e.dataTransfer.setData('text/plain', componentType);
            e.dataTransfer.effectAllowed = 'copy';
        }

        // Create our custom ghost element
        this.createPaletteGhost(componentType);
    }

    private createPaletteGhost(componentType: string): void {
        // FIXED: Remove any existing ghost first
        this.cleanupPaletteGhost();

        const ghost = document.createElement('div');
        ghost.className = 'palette-ghost';

        const componentDef = this.componentDefinitions.find(c => c.type === componentType);
        if (componentDef) {
            ghost.innerHTML = `
                <div class="ghost-icon">${componentDef.icon}</div>
                <div class="ghost-name">${componentDef.name}</div>
            `;
        }

        // FIXED: Better styling to prevent interference
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '10000';
        ghost.style.opacity = '0.8';
        ghost.style.backgroundColor = 'var(--vscode-editor-background)';
        ghost.style.border = '1px solid var(--vscode-focusBorder)';
        ghost.style.borderRadius = '4px';
        ghost.style.padding = '4px 8px';
        ghost.style.fontSize = '12px';
        ghost.style.color = 'var(--vscode-foreground)';
        ghost.style.whiteSpace = 'nowrap';
        ghost.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        // FIXED: Start hidden until first mouse move
        ghost.style.visibility = 'hidden';

        document.body.appendChild(ghost);
        this.paletteGhost = ghost;
    }

    private updatePaletteGhost(e: DragEvent): void {
        if (this.paletteGhost) {
            // FIXED: Show ghost on first move and update position
            this.paletteGhost.style.visibility = 'visible';
            this.paletteGhost.style.left = (e.clientX + 10) + 'px';
            this.paletteGhost.style.top = (e.clientY + 10) + 'px';
        }
    }

    private handlePaletteDrop(e: DragEvent): void {
        // FIXED: Prevent double insertion by checking if drop actually happened on canvas
        const target = e.target as HTMLElement;
        const canvas = target.closest('.component-canvas') as HTMLElement;

        if (!canvas || !this.draggedComponentType) {
            console.log('Drop not on canvas or no component type, ignoring');
            return;
        }

        // FIXED: Only insert if we haven't already inserted via click
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        console.log(`Dropping ${this.draggedComponentType} at (${x}, ${y})`);

        // FIXED: Set a flag to prevent click insertion
        this.isDraggingFromPalette = false; // Mark as not dragging before insertion
        this.insertComponentAtPosition(this.draggedComponentType, x, y);

        // FIXED: Clear the dragged component type immediately to prevent double insertion
        this.draggedComponentType = null;
    }

    private insertComponentAtPosition(componentType: string, x: number, y: number): void {
        const stateManager: IStateManager = window.stateManager;
        const documentState = window.documentState;

        // Snap to grid
        const snapped = stateManager.snapToGrid(x, y);

        // Get current section
        const currentSection = stateManager.getActiveTab() as 'preproc' | 'postproc';
        const existingComponents = documentState.getComponents(currentSection);

        try {
            // Access ComponentTemplates properly from the global window
            const ComponentTemplates = this.getComponentTemplatesClass();
            if (!ComponentTemplates) {
                throw new Error('ComponentTemplates class not available - ensure it is properly injected into the window object');
            }

            // Create new component using template
            const newComponent = ComponentTemplates.createComponent(
                componentType,
                currentSection,
                existingComponents,
                snapped.x,
                snapped.y
            );

            console.log('Created new component:', newComponent);

            // Add to DocumentState
            documentState.addComponent(newComponent);

            // Update component counts in state manager
            stateManager.updateComponentCounts();

            // Re-render the current section
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = currentSection + 'Canvas';
            const components = documentState.getComponents(currentSection);

            renderingManager.renderComponentSection(components, canvasId);

            // Send to extension to update VRM file
            this.saveNewComponent(newComponent);

            // Show success message
            this.showMessage(`Added ${componentType} component #${newComponent.n}`);

        } catch (error) {
            console.error('Error creating component:', error);
            this.showMessage(`Error creating ${componentType} component: ${error}`);
        }
    }

    /**
     * FIXED: Helper method to safely access ComponentTemplates from window
     * This handles the different ways ComponentTemplates might be stored
     */
    private getComponentTemplatesClass(): any {
        // Try multiple ways to access ComponentTemplates
        const windowAny = window as any;

        // Method 1: Direct property access
        if (windowAny.ComponentTemplates) {
            console.log('Found ComponentTemplates via direct access');
            return windowAny.ComponentTemplates;
        }

        // Method 2: Check if it's nested somewhere
        if (windowAny.ComponentTemplate_1) {
            console.log('Found ComponentTemplates as ComponentTemplate_1');
            return windowAny.ComponentTemplate_1;
        }

        // Method 3: Try to find it in the global scope by name
        try {
            const globalComponentTemplates = eval('ComponentTemplates');
            if (globalComponentTemplates) {
                console.log('Found ComponentTemplates via eval');
                return globalComponentTemplates;
            }
        } catch (e) {
            // Eval failed, continue
        }

        // Method 4: Last resort - create inline templates
        console.warn('ComponentTemplates not found, creating inline fallback');
        return this.createInlineComponentTemplates();
    }

    /**
     * FIXED: Fallback inline component templates if the main class isn't available
     */
    private createInlineComponentTemplates(): any {
        return {
            createComponent: (componentType: string, section: 'preproc' | 'postproc', existingComponents: VrmComponent[], x: number, y: number): VrmComponent => {
                // Generate next available component ID
                const getNextComponentId = (components: VrmComponent[]): number => {
                    if (components.length === 0) return 1;
                    const usedIds = components.map(c => c.n);
                    const maxId = Math.max(...usedIds);
                    for (let i = 1; i <= maxId; i++) {
                        if (!usedIds.includes(i)) {
                            return i;
                        }
                    }
                    return maxId + 1;
                };

                const nextId = getNextComponentId(existingComponents);

                // Create basic template for any component type
                const baseComponent: VrmComponent = {
                    n: nextId,
                    t: componentType,
                    values: this.getDefaultValuesForType(componentType),
                    j: [0, 0],
                    x: x,
                    y: y,
                    c: '',
                    wp: null,
                    section: section
                };

                return baseComponent;
            }
        };
    }

    /**
     * FIXED: Default values for each component type
     */
    private getDefaultValuesForType(componentType: string): any {
        switch (componentType) {
            case 'CSF':
                return {
                    functionName: 'GetConstant',
                    returnValue: '',
                    functionParams: []
                };
            case 'SQLTRN':
                return {
                    transactionName: '',
                    transactionType: ''
                };
            case 'MATH':
                return {
                    mathName: '',
                    mathFormat: '',
                    mathParam: ''
                };
            case 'TEMPLATE':
                return {
                    templateName: '',
                    templateTarget: ''
                };
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return {
                    query: '',
                    params: []
                };
            case 'SCRIPT':
                return {
                    script: '',
                    language: ''
                };
            case 'ERROR':
                return {
                    errorMessage: ''
                };
            case 'IF':
                return {
                    condition: ''
                };
            case 'SET':
                return {
                    variables: [{ name: '', value: '' }]
                };
            case 'EXTERNAL':
                return {
                    externalValue: ''
                };
            default:
                return {};
        }
    }

    private endPaletteDrag(): void {
        console.log('Ending palette drag');
        this.isDraggingFromPalette = false;
        this.draggedComponentType = null;

        // FIXED: Clean up all drag states from palette components
        document.querySelectorAll('.palette-component').forEach(component => {
            component.removeAttribute('data-drag-started');
            component.removeAttribute('data-mouse-down');
            // Remove any drag-related classes
            component.classList.remove('dragging', 'pressed', 'active');
        });

        // FIXED: Always clean up ghost
        this.cleanupPaletteGhost();
    }

    // FIXED: Separate method for ghost cleanup
    private cleanupPaletteGhost(): void {
        if (this.paletteGhost) {
            if (this.paletteGhost.parentNode) {
                document.body.removeChild(this.paletteGhost);
            }
            this.paletteGhost = null;
        }
    }

    private saveNewComponent(component: VrmComponent): void {
        const apiHandler = window.vsCodeApiHandler;
        if (apiHandler) {
            apiHandler.addComponent(component);
        } else {
            console.warn('VS Code API Handler not available, cannot save new component');
        }
    }

    private showMessage(message: string): void {
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

    public togglePalette(): void {
        const palette = document.getElementById('componentPalette');
        if (palette) {
            palette.classList.toggle('collapsed');

            const toggleButton = palette.querySelector('.palette-toggle') as HTMLElement;
            if (toggleButton) {
                toggleButton.textContent = palette.classList.contains('collapsed') ? '▶' : '◀';
            }
        }
    }

    // Method to get component definition by type
    public getComponentDefinition(type: string) {
        return this.componentDefinitions.find(c => c.type === type);
    }

    // Method to get all component types for context menu
    public getAllComponentTypes(): typeof this.componentDefinitions {
        return this.componentDefinitions;
    }

    public static inject(): string {
        return `
            window.componentPalette = new (${ComponentPalette.toString()})();
            
            // Initialize palette when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                // Don't call createPaletteSidebar, just initialize with existing structure
                if (window.componentPalette) {
                    window.componentPalette.initializePalette();
                }
            });
            
            // Make functions globally available
            window.togglePalette = () => window.componentPalette.togglePalette();
        `;
    }
}