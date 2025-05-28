export class RenderingManager {
    
    public renderComponents(components: any[]): void {
        console.log('Rendering components:', components.length);
        
        const stateManager = (window as any).stateManager;
        
        // Separate components by section
        const preprocComponents = components.filter(c => c.section === 'preproc');
        const postprocComponents = components.filter(c => c.section === 'postproc');
        
        stateManager.setPreprocComponents(preprocComponents);
        stateManager.setPostprocComponents(postprocComponents);
        
        stateManager.updateComponentCounts();
        
        // Render each section
        this.renderComponentSection(preprocComponents, 'preprocCanvas');
        this.renderComponentSection(postprocComponents, 'postprocCanvas');
        
        // Restore selection states after re-rendering
        const selectionManager = (window as any).selectionManager;
        selectionManager.restoreSelectionStates();
    }
    
    public renderComponentSection(components: any[], canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
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
        
        // Render connections first (so they appear behind nodes)
        components.forEach(component => {
            component.j.forEach((targetId: number, index: number) => {
                if (targetId > 0) {
                    const targetComponent = components.find(c => c.n === targetId);
                    if (targetComponent) {
                        this.renderConnection(component, targetComponent, index === 0, canvasId);
                    }
                }
            });
        });
        
        // Render components
        components.forEach(component => {
            this.renderComponent(component, canvasId);
        });
        
        // Add canvas event handlers for selection
        this.addCanvasEventHandlers(canvas);
    }
    
    public renderComponent(component: any, canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('component-node');
        group.setAttribute('data-component-id', component.n.toString());
        group.setAttribute('data-section', component.section);
        
        const stateManager = (window as any).stateManager;
        const color = stateManager.getComponentColor(component.t);
        const iconSize = 30;
        const textOffset = iconSize + 10;
        
        // Component icon
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', component.x.toString());
        rect.setAttribute('y', component.y.toString());
        rect.setAttribute('width', iconSize.toString());
        rect.setAttribute('height', iconSize.toString());
        rect.setAttribute('fill', color);
        rect.classList.add('component-rect');
        
        // Component type text (inside icon)
        const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeText.setAttribute('x', (component.x + iconSize/2).toString());
        typeText.setAttribute('y', (component.y + iconSize/2).toString());
        typeText.classList.add('component-icon-text');
        typeText.textContent = component.t.substring(0, 2);
        
        // Component number and comment
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', (component.x + textOffset).toString());
        labelText.setAttribute('y', (component.y + iconSize/2 + 2).toString());
        labelText.classList.add('component-label');
        
        const commentText = component.c || 'No comment';
        labelText.textContent = `${component.n}: ${commentText}`;
        
        // Watchpoint indicator
        if (component.wp) {
            const watchpoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            watchpoint.setAttribute('cx', (component.x + iconSize - 4).toString());
            watchpoint.setAttribute('cy', (component.y + 4).toString());
            watchpoint.setAttribute('r', '3');
            watchpoint.classList.add('watchpoint-indicator');
            group.appendChild(watchpoint);
        }
        
        group.appendChild(rect);
        group.appendChild(typeText);
        group.appendChild(labelText);
        
        // Add drag and drop event handlers
        group.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0) { // Left mouse button
                e.stopPropagation(); // Prevent canvas selection
                
                const componentKey = `${component.section}-${component.n}`;
                
                // Handle selection logic
                if (e.ctrlKey || e.metaKey) {
                    // Toggle selection with Ctrl/Cmd
                    if (stateManager.getSelectedComponents().has(componentKey)) {
                        stateManager.getSelectedComponents().delete(componentKey);
                        group.classList.remove('selected');
                        console.log('Deselected:', componentKey);
                    } else {
                        stateManager.getSelectedComponents().add(componentKey);
                        group.classList.add('selected');
                        console.log('Selected:', componentKey);
                    }
                } else if (!stateManager.getSelectedComponents().has(componentKey)) {
                    // Single select if not already selected
                    const selectionManager = (window as any).selectionManager;
                    selectionManager.clearSelection();
                    stateManager.getSelectedComponents().add(componentKey);
                    group.classList.add('selected');
                    console.log('Single selected:', componentKey);
                }
                
                // Start drag operation
                const dragDropManager = (window as any).dragDropManager;
                if (stateManager.getSelectedComponents().size > 1) {
                    dragDropManager.startMultiDrag(e, component);
                } else {
                    dragDropManager.startDrag(e, component, group);
                }
            }
        });
        
        // Add click handler for single selection
        group.addEventListener('click', (e: MouseEvent) => {
            if (!stateManager.getIsDragging() && !stateManager.getIsMultiDragging?.()) {
                e.stopPropagation();
                
                const componentEditor = (window as any).componentEditor;
                if (stateManager.getSelectedComponents().size === 1) {
                    componentEditor.showComponentDetails(component);
                } else if (stateManager.getSelectedComponents().size > 1) {
                    componentEditor.showMultiSelectionDetails();
                }
            }
        });
        
        group.addEventListener('dblclick', (e: MouseEvent) => {
            if (!stateManager.getIsDragging() && !stateManager.getIsMultiDragging?.()) {
                e.stopPropagation();
                const componentEditor = (window as any).componentEditor;
                componentEditor.showComponentEditor(component);
            }
        });
        
        canvas.appendChild(group);
    }
    
    public renderConnection(fromComponent: any, toComponent: any, isPrimary: boolean, canvasId: string): void {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const iconSize = 32;
        const handleOffset = 20;
        const verticalBuffer = 15; // Distance for clean vertical entry/exit
        
        // Check for handlebar case (same X axis and close vertically)
        const sameXAxis = fromComponent.x === toComponent.x;
        const verticalDistance = Math.abs(fromComponent.y - toComponent.y);
        const useHandlebars = sameXAxis && verticalDistance <= 30;
        
        let pathData: string;
        
        if (useHandlebars) {
            // Handlebar routing for vertically aligned close components
            const startX = fromComponent.x;
            const startY = fromComponent.y + iconSize/2;
            const endX = toComponent.x;
            const endY = toComponent.y + iconSize/2;
            const leftOffset = fromComponent.x - handleOffset;
            
            pathData = `M ${startX} ${startY} L ${leftOffset} ${startY} L ${leftOffset} ${endY} L ${endX} ${endY}`;
            
        } else {
            // Multi-segment orthogonal routing
            
            // Start and end points (always bottom center to top center)
            const startX = fromComponent.x + iconSize/2;
            const startY = fromComponent.y + iconSize;
            const endX = toComponent.x + iconSize/2;
            const endY = toComponent.y;
            
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
                
                // Check for special case: if component Y distance is 52-56px, use direct horizontal connection
                const componentVerticalDistance = Math.abs(toComponent.y - fromComponent.y);
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
        
        line.setAttribute('d', pathData);
        line.classList.add('connection-line');
        line.classList.add(isPrimary ? 'primary-connection' : 'secondary-connection');
        line.setAttribute('marker-end', 
            isPrimary ? `url(#arrowhead-${canvasId})` : `url(#arrowhead-secondary-${canvasId})`);
        
        canvas.appendChild(line);
    }
    
    public addCanvasEventHandlers(canvas: Element): void {
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
        
        // Create new handlers and store references
        canvasElement._vrmMouseDownHandler = (e: MouseEvent) => {
            if (e.target === canvas) {
                const selectionManager = (window as any).selectionManager;
                selectionManager.startSelection(e);
            }
        };
        
        canvasElement._vrmMouseMoveHandler = (e: MouseEvent) => {
            const stateManager = (window as any).stateManager;
            if (stateManager.getIsSelecting()) {
                const selectionManager = (window as any).selectionManager;
                selectionManager.updateSelection(e);
            }
        };
        
        canvasElement._vrmMouseUpHandler = (e: MouseEvent) => {
            const stateManager = (window as any).stateManager;
            if (stateManager.getIsSelecting()) {
                const selectionManager = (window as any).selectionManager;
                selectionManager.endSelection(e);
            }
        };
        
        canvasElement._vrmContextMenuHandler = (e: MouseEvent) => {
            const contextMenuManager = (window as any).contextMenuManager;
            contextMenuManager.handleRightClick(e);
        };
        
        // Add event listeners
        canvas.addEventListener('mousedown', canvasElement._vrmMouseDownHandler);
        canvas.addEventListener('mousemove', canvasElement._vrmMouseMoveHandler);
        canvas.addEventListener('mouseup', canvasElement._vrmMouseUpHandler);
        canvas.addEventListener('contextmenu', canvasElement._vrmContextMenuHandler);
    }
    
    public static inject(): string {
        return `
            window.renderingManager = new (${RenderingManager.toString()})();
            
            // Make functions globally available
            window.renderComponents = (components) => window.renderingManager.renderComponents(components);
        `;
    }
}