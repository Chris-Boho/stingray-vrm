// Handle shift+click for connection creation
import {
    VrmComponent,
    IRenderingManager,
    ISelectionManager,
    IDragDropManager,
    IComponentEditor,
    IContextMenuManager,
    IConnectionManager,
    CustomWindow,
    Position,
    IStateManager
} from '../../types';

declare const window: CustomWindow;

type ComponentSection = 'preproc' | 'postproc';

export class RenderingManager implements IRenderingManager {
    private static instance: RenderingManager;
    private selectionManager: ISelectionManager;

    private constructor() {
        if (!window.documentState) {
            throw new Error('DocumentState must be initialized before RenderingManager');
        }
        this.selectionManager = window.selectionManager;
    }

    public static getInstance(): RenderingManager {
        if (!RenderingManager.instance) {
            RenderingManager.instance = new RenderingManager();
        }
        return RenderingManager.instance;
    }

    public renderComponents(components: VrmComponent[]): void {
        console.log('Rendering components:', components.length);

        // Separate components by section
        const preprocComponents = components.filter(c => c.section === 'preproc');
        const postprocComponents = components.filter(c => c.section === 'postproc');

        // Update DocumentState
        window.documentState.loadState(components, '', ''); // HTML and JS content will be updated separately

        // Update component counts in UI
        this.updateComponentCounts();

        // Render each section
        this.renderComponentSection(preprocComponents, 'preprocCanvas');
        this.renderComponentSection(postprocComponents, 'postprocCanvas');

        // Restore selection states after re-rendering
        const selectionManager: ISelectionManager = window.selectionManager;
        selectionManager.restoreSelectionStates();
    }

    public renderComponentSection(components: VrmComponent[], canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Get the latest components from DocumentState
        const section = canvasId.replace('Canvas', '') as 'preproc' | 'postproc';
        const latestComponents = window.documentState.getComponents(section);

        // Calculate and set the required canvas height
        const requiredHeight = this.calculateRequiredCanvasHeight(latestComponents);
        canvas.setAttribute('height', requiredHeight.toString());

        // Clear the canvas
        canvas.innerHTML = '';

        // Add arrow marker definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrowhead-${canvasId}" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#4FC3F7" />
            </marker>
            <marker id="arrowhead-secondary-${canvasId}" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
        `;
        canvas.appendChild(defs);

        // Log the components we're about to render
        console.log(`Rendering ${section} section with ${latestComponents.length} components:`,
            latestComponents.map(c => ({ id: c.n, type: c.t, values: c.values })));

        // Render connections first (so they appear behind nodes)
        latestComponents.forEach(component => {
            if (component.j) {
                component.j.forEach((targetId: number, index: number) => {
                    if (targetId > 0) {
                        const targetComponent = latestComponents.find(c => c.n === targetId);
                        if (targetComponent) {
                            this.renderConnection(component, targetComponent, index === 0, canvasId);
                        }
                    }
                });
            }
        });

        // Render components
        latestComponents.forEach(component => {
            this.renderComponent(component, canvasId);
        });

        // Add canvas event handlers for selection
        this.addCanvasEventHandlers(canvas);

        // Log completion
        console.log(`Finished rendering ${section} section`);
    }

    private updateComponentCounts(): void {
        const preprocCount = document.getElementById('preprocCount');
        const postprocCount = document.getElementById('postprocCount');

        if (preprocCount) {
            preprocCount.textContent = window.documentState.getComponents('preproc').length.toString();
        }
        if (postprocCount) {
            postprocCount.textContent = window.documentState.getComponents('postproc').length.toString();
        }
    }

    public renderComponent(component: VrmComponent, canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Get the latest component from DocumentState to ensure we have the most up-to-date data
        const section = component.section as ComponentSection;
        const latestComponent = window.documentState.getComponent(section, component.n);
        if (!latestComponent) return;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('component-node');
        group.setAttribute('data-component-id', component.n.toString());
        group.setAttribute('data-section', component.section);
        // Set initial transform
        group.style.transform = `translate(${component.x}px, ${component.y}px)`;
        group.setAttribute('data-x', component.x.toString());
        group.setAttribute('data-y', component.y.toString());

        // Get component color from DocumentState
        const color = window.documentState.getComponentColor(component.t);
        const iconSize = 30;
        const textOffset = iconSize + 10;

        // Component icon - position at 0,0 since we're using transform on the group
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', iconSize.toString());
        rect.setAttribute('height', iconSize.toString());
        rect.setAttribute('fill', color);
        rect.classList.add('component-rect');

        // Component type text (inside icon) - position relative to 0,0
        const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeText.setAttribute('x', (iconSize / 2).toString());
        typeText.setAttribute('y', (iconSize / 2).toString());
        typeText.classList.add('component-icon-text');
        typeText.textContent = component.t.substring(0, 2);

        // Component number and comment - position relative to 0,0
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', textOffset.toString());
        labelText.setAttribute('y', (iconSize / 2 + 2).toString());
        labelText.classList.add('component-label');

        const commentText = component.c || 'No comment';
        const truncatedComment = commentText.length > 20 ? commentText.substring(0, 20) + '...' : commentText;
        labelText.textContent = `${component.n}: ${truncatedComment}`;

        // Watchpoint indicator - position relative to 0,0
        if (component.wp) {
            const watchpoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            watchpoint.setAttribute('cx', (iconSize - 4).toString());
            watchpoint.setAttribute('cy', '4');
            watchpoint.setAttribute('r', '3');
            watchpoint.classList.add('watchpoint-indicator');
            group.appendChild(watchpoint);
        }

        group.appendChild(rect);
        group.appendChild(typeText);
        group.appendChild(labelText);

        // Add event handlers
        group.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0) { // Left mouse button
                e.stopPropagation(); // Prevent canvas selection

                const componentKey = `${component.section}-${component.n}`;

                // Handle shift+click for connection creation
                if (e.shiftKey) {
                    const connectionManager: IConnectionManager = window.connectionManager;
                    connectionManager.handleShiftClick(e, component);
                    return; // Don't proceed with drag/selection
                }

                // Handle selection logic
                if (e.ctrlKey || e.metaKey) {
                    // Toggle selection with Ctrl/Cmd
                    if (this.selectionManager.isComponentSelected(componentKey)) {
                        this.selectionManager.deselectComponent(componentKey);
                        group.classList.remove('selected');
                        console.log('Deselected:', componentKey);
                    } else {
                        this.selectionManager.selectComponent(componentKey);
                        group.classList.add('selected');
                        console.log('Selected:', componentKey);
                    }
                } else if (!this.selectionManager.isComponentSelected(componentKey)) {
                    // Single select if not already selected
                    this.selectionManager.clearSelection();
                    this.selectionManager.selectComponent(componentKey);
                    group.classList.add('selected');
                    console.log('Single selected:', componentKey);
                }

                // Start drag operation
                const dragDropManager: IDragDropManager = window.dragDropManager;
                if (this.selectionManager.getSelectedComponentCount() > 1) {
                    dragDropManager.startMultiDrag(e, component);
                } else {
                    dragDropManager.startDrag(e, component, group);
                }
            }
        });

        // Add right-click handler for shift+right-click connections
        group.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();

            if (e.shiftKey) {
                // Handle shift+right-click for secondary connection
                const connectionManager: IConnectionManager = window.connectionManager;
                connectionManager.handleShiftRightClick(e, component);
            } else {
                // Show connection menu for this specific component
                const connectionManager: IConnectionManager = window.connectionManager;
                connectionManager.showConnectionMenu(component, e.clientX, e.clientY);
            }
        });

        // Add click handler for single selection
        group.addEventListener('click', (e: MouseEvent) => {
            if (!this.selectionManager.isDragging() && !this.selectionManager.isMultiDragging()) {
                e.stopPropagation();

                const componentEditor: IComponentEditor = window.componentEditor;
                if (this.selectionManager.getSelectedComponentCount() === 1) {
                    componentEditor.showComponentDetails(component);
                } else if (this.selectionManager.getSelectedComponentCount() > 1) {
                    componentEditor.showMultiSelectionDetails();
                }
            }
        });

        group.addEventListener('dblclick', (e: MouseEvent) => {
            if (!this.selectionManager.isDragging() && !this.selectionManager.isMultiDragging()) {
                e.stopPropagation();
                const componentEditor: IComponentEditor = window.componentEditor;
                componentEditor.showComponentEditor(component);
            }
        });

        canvas.appendChild(group);
    }

    public renderConnection(source: VrmComponent, target: VrmComponent, isPrimary: boolean, canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Get the latest components from DocumentState to ensure we have the most up-to-date data
        const sourceSection = source.section as ComponentSection;
        const targetSection = target.section as ComponentSection;
        const latestSource = window.documentState.getComponent(sourceSection, source.n);
        const latestTarget = window.documentState.getComponent(targetSection, target.n);
        if (!latestSource || !latestTarget) return;

        // Try to find existing connection line
        const existingLine = document.querySelector(
            `[data-connection="${source.n}-${target.n}"][data-section="${source.section}"]`
        ) as SVGPathElement;

        let line: SVGPathElement;
        if (existingLine) {
            // Update existing line
            line = existingLine;
        } else {
            // Create new line
            line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('data-connection', `${source.n}-${target.n}`);
            line.setAttribute('data-section', source.section);
            line.classList.add('connection-line');
            line.classList.add(isPrimary ? 'primary-connection' : 'secondary-connection');
            line.setAttribute('marker-end',
                isPrimary ? `url(#arrowhead-${canvasId})` : `url(#arrowhead-secondary-${canvasId})`);
            canvas.appendChild(line);
        }

        const iconSize = 32;
        const handleOffset = 20;
        const verticalBuffer = 15; // Distance for clean vertical entry/exit

        // Check for handlebar case (same X axis and close vertically)
        const sameXAxis = source.x === target.x;
        const verticalDistance = Math.abs(source.y - target.y);
        const useHandlebars = sameXAxis && verticalDistance <= 30;

        let pathData: string;

        if (useHandlebars) {
            // Handlebar routing for vertically aligned close components
            const startX = source.x;
            const startY = source.y + iconSize / 2;
            const endX = target.x;
            const endY = target.y + iconSize / 2;
            const leftOffset = source.x - handleOffset;

            pathData = `M ${startX} ${startY} L ${leftOffset} ${startY} L ${leftOffset} ${endY} L ${endX} ${endY}`;
        } else {
            // Start and end points (always bottom center to top center)
            const startX = source.x + iconSize / 2;
            const startY = source.y + iconSize;
            const endX = target.x + iconSize / 2;
            const endY = target.y;

            // Calculate waypoints for clean orthogonal routing
            const exitY = startY + verticalBuffer;     // Exit point (down from source)
            const entryY = endY - verticalBuffer;      // Entry point (above target)
            const midX = startX + (endX - startX) / 2; // Horizontal midpoint

            // Determine routing based on relative positions
            if (startX === endX) {
                // Same column - simple vertical connection
                if (endY > startY) {
                    // Target below source - straight down
                    pathData = `M ${startX} ${startY} L ${startX} ${endY}`;
                } else {
                    // Target above source - go around
                    const loopX = startX - 30; // Go left to avoid overlap
                    pathData = `M ${startX} ${startY} L ${startX} ${exitY} L ${loopX} ${exitY} L ${loopX} ${entryY} L ${endX} ${entryY} L ${endX} ${endY}`;
                }
            } else {
                // Different columns - use waypoints
                const componentVerticalDistance = Math.abs(target.y - source.y);
                const isOptimalSpacing = componentVerticalDistance >= 50 && componentVerticalDistance <= 60;

                if (isOptimalSpacing) {
                    // Direct straight horizontal connection at exit level
                    pathData = `M ${startX} ${startY} L ${startX} ${exitY} L ${endX} ${exitY} L ${endX} ${endY}`;
                } else if (endY > exitY) {
                    // Target is below exit level - standard routing
                    pathData = `M ${startX} ${startY} L ${startX} ${exitY} L ${midX} ${exitY} L ${midX} ${entryY} L ${endX} ${entryY} L ${endX} ${endY}`;
                } else {
                    // Target is above exit level - use horizontal routing at exit level
                    pathData = `M ${startX} ${startY} L ${startX} ${exitY} L ${midX} ${exitY} L ${midX} ${entryY} L ${endX} ${entryY} L ${endX} ${endY}`;
                }
            }
        }

        // Update the path data
        line.setAttribute('d', pathData);
    }

    public addCanvasEventHandlers(canvas: HTMLElement): void {
        const dragDropManager: IDragDropManager = window.dragDropManager;
        const componentEditor: IComponentEditor = window.componentEditor;
        const contextMenuManager: IContextMenuManager = window.contextMenuManager;
        const connectionManager: IConnectionManager = window.connectionManager;

        // Remove existing handlers to avoid duplicates
        const canvasElement = canvas as any;
        if (canvasElement._vrmMouseDownHandler) {
            canvas.removeEventListener('mousedown', canvasElement._vrmMouseDownHandler);
        }
        if (canvasElement._vrmMouseMoveHandler) {
            canvas.removeEventListener('mousemove', canvasElement._vrmMouseMoveHandler);
        }
        if (canvasElement._vrmMouseUpHandler) {
            canvas.removeEventListener('mouseup', canvasElement._vrmMouseUpHandler);
        }
        if (canvasElement._vrmContextMenuHandler) {
            canvas.removeEventListener('contextmenu', canvasElement._vrmContextMenuHandler);
        }

        // Create new handlers and store references
        canvasElement._vrmContextMenuHandler = (e: MouseEvent) => {
            if (e.target === canvas) {
                contextMenuManager.handleRightClick(e);
            }
        };

        canvasElement._vrmMouseDownHandler = (e: MouseEvent) => {
            if (e.target === canvas) {
                // Handle shift+click on empty canvas for clearing connections
                if (e.shiftKey) {
                    if (e.button === 0) { // Left click
                        connectionManager.handleShiftClickOnEmpty(e, 'primary');
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return; // Don't proceed with selection
                }

                this.selectionManager.startSelection(e);
            }
        };

        canvasElement._vrmMouseMoveHandler = (e: MouseEvent) => {
            if (this.selectionManager.isSelecting()) {
                this.selectionManager.updateSelection(e);
            }
        };

        canvasElement._vrmMouseUpHandler = (e: MouseEvent) => {
            if (this.selectionManager.isSelecting()) {
                this.selectionManager.endSelection(e);
            }
        };

        // Add the handlers
        canvas.addEventListener('mousedown', canvasElement._vrmMouseDownHandler);
        canvas.addEventListener('mousemove', canvasElement._vrmMouseMoveHandler);
        canvas.addEventListener('mouseup', canvasElement._vrmMouseUpHandler);
        canvas.addEventListener('contextmenu', canvasElement._vrmContextMenuHandler);
    }

    public static inject(): string {
        return `
            window.renderingManager = new (${RenderingManager.toString()})();
            
            // Make functions globally available for HTML onclick handlers
            window.renderComponents = (components) => window.renderingManager.renderComponents(components);
        `;
    }

    public calculateRequiredCanvasHeight(components: VrmComponent[]): number {
        if (components.length === 0) {
            return 800; // Default minimum height
        }

        // Find the highest y coordinate among all components
        const highestY = Math.max(...components.map(comp => comp.y));
        const iconSize = 30; // Component icon size
        const buffer = 200; // Additional space below the highest component

        // Return the highest y coordinate plus icon size and buffer
        return Math.max(800, highestY + iconSize + buffer);
    }
}