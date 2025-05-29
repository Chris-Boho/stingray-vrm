import { 
    VrmComponent,
    IStateManager,
    IRenderingManager,
    VsCodeApi,
    CustomWindow 
} from '../../types';
import { ComponentTemplates } from '../../ComponentTemplate';

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
    
        // Group components by category
        const categories = this.groupComponentsByCategory();
        
        let contentHTML = '';
        
        // Add components by category in horizontal layout
        Object.entries(categories).forEach(([category, components]) => {
            contentHTML += `
                <div class="palette-category">
                    <div class="category-header">${category}</div>
                    <div class="category-components">
            `;
            
            components.forEach(comp => {
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
            
            contentHTML += `
                    </div>
                </div>
            `;
        });
        
        paletteContent.innerHTML = contentHTML;
    }

    private groupComponentsByCategory(): Record<string, typeof this.componentDefinitions> {
        const categories: Record<string, typeof this.componentDefinitions> = {};
        
        this.componentDefinitions.forEach(comp => {
            if (!categories[comp.category]) {
                categories[comp.category] = [];
            }
            categories[comp.category].push(comp);
        });

        return categories;
    }

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

        // Handle drag end
        document.addEventListener('dragend', (e: DragEvent) => {
            if (this.isDraggingFromPalette) {
                this.endPaletteDrag();
            }
        });

        // Handle click for component insertion (alternative to drag)
        document.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const paletteComponent = target.closest('.palette-component') as HTMLElement;
            
            if (paletteComponent) {
                const componentType = paletteComponent.getAttribute('data-component-type');
                if (componentType) {
                    // Insert at default position (center of current view)
                    this.insertComponentAtPosition(componentType, 200, 200);
                }
            }
        });
    }

    private startPaletteDrag(e: DragEvent, componentType: string): void {
        console.log('Starting palette drag for:', componentType);
        this.isDraggingFromPalette = true;
        this.draggedComponentType = componentType;

        // Create ghost element
        this.createPaletteGhost(componentType);

        // Set drag data
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', componentType);
            e.dataTransfer.effectAllowed = 'copy';
        }
    }

    private createPaletteGhost(componentType: string): void {
        const ghost = document.createElement('div');
        ghost.className = 'palette-ghost';
        
        const componentDef = this.componentDefinitions.find(c => c.type === componentType);
        if (componentDef) {
            ghost.innerHTML = `
                <div class="ghost-icon">${componentDef.icon}</div>
                <div class="ghost-name">${componentDef.name}</div>
            `;
        }

        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '10000';
        ghost.style.opacity = '0.8';
        
        document.body.appendChild(ghost);
        this.paletteGhost = ghost;
    }

    private updatePaletteGhost(e: DragEvent): void {
        if (this.paletteGhost) {
            this.paletteGhost.style.left = (e.clientX + 10) + 'px';
            this.paletteGhost.style.top = (e.clientY + 10) + 'px';
        }
    }

    private handlePaletteDrop(e: DragEvent): void {
        // Check if we're dropping on a canvas
        const target = e.target as HTMLElement;
        const canvas = target.closest('.component-canvas') as HTMLElement;
        
        if (canvas && this.draggedComponentType) {
            const canvasRect = canvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left;
            const y = e.clientY - canvasRect.top;
            
            console.log(`Dropping ${this.draggedComponentType} at (${x}, ${y})`);
            this.insertComponentAtPosition(this.draggedComponentType, x, y);
        }
    }

    private insertComponentAtPosition(componentType: string, x: number, y: number): void {
        const stateManager: IStateManager = window.stateManager;
        
        // Snap to grid
        const snapped = stateManager.snapToGrid(x, y);
        
        // Get current section components
        const currentSection = stateManager.getActiveTab() as 'preproc' | 'postproc';
        const existingComponents = currentSection === 'preproc' ? 
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();

        try {
            // Create new component using template
            const newComponent = ComponentTemplates.createComponent(
                componentType, 
                currentSection, 
                existingComponents, 
                snapped.x, 
                snapped.y
            );

            console.log('Created new component:', newComponent);

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
            this.showMessage(`Added ${componentType} component #${newComponent.n}`);

        } catch (error) {
            console.error('Error creating component:', error);
            this.showMessage(`Error creating ${componentType} component: ${error}`);
        }
    }

    private endPaletteDrag(): void {
        console.log('Ending palette drag');
        this.isDraggingFromPalette = false;
        this.draggedComponentType = null;

        // Remove ghost
        if (this.paletteGhost) {
            document.body.removeChild(this.paletteGhost);
            this.paletteGhost = null;
        }
    }

    private saveNewComponent(component: VrmComponent): void {
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
                command: 'addComponent',
                component: component
            });
        } else {
            console.warn('VS Code API not available, cannot save new component');
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