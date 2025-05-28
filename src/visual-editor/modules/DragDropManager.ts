import { 
    VrmComponent, 
    Position, 
    DragHandlers,
    MultiDragHandlers,
    IDragDropManager,
    IStateManager,
    IRenderingManager,
    VsCodeApi,
    CustomWindow 
} from '../../types';

declare const window: CustomWindow;

export class DragDropManager implements IDragDropManager {
    
    public startDrag(e: MouseEvent, component: VrmComponent, groupElement: Element): void {
        e.preventDefault();
        e.stopPropagation();
        
        const stateManager: IStateManager = window.stateManager;
        
        // Prevent starting a new drag if already dragging
        if (stateManager.getIsDragging()) {
            console.log('Already dragging, ignoring new drag start');
            return;
        }
        
        console.log('Starting single drag for component:', component.n);
        stateManager.setIsDragging(true);
        stateManager.setDragComponent(component);
        
        // Get the SVG canvas for coordinate transformation
        const canvas = document.getElementById(component.section + 'Canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Calculate offset from mouse to component position
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const dragOffset: Position = {
            x: mouseX - component.x,
            y: mouseY - component.y
        };
        const dragStartPos: Position = {
            x: component.x,
            y: component.y
        };
        
        stateManager.setDragOffset(dragOffset);
        stateManager.setDragStartPos(dragStartPos);
        
        // Add visual feedback
        groupElement.classList.add('dragging');
        
        // Create bound event handlers that maintain proper context
        const handleDragBound = (event: MouseEvent) => {
            this.handleDrag(event, component);
        };
        
        const endDragBound = (event: MouseEvent) => {
            this.endDrag(event, component, groupElement, handleDragBound, endDragBound);
        };
        
        // Store handlers for cleanup
        const dragHandlers: DragHandlers = { handleDragBound, endDragBound };
        stateManager.setDragHandlers(dragHandlers);
        
        // Add global mouse handlers
        document.addEventListener('mousemove', handleDragBound);
        document.addEventListener('mouseup', endDragBound);
        
        // Hide details panel during drag
        const details = document.getElementById('componentDetails');
        if (details) details.style.display = 'none';
    }
    
    private handleDrag(e: MouseEvent, dragComponent: VrmComponent): void {
        const stateManager: IStateManager = window.stateManager;
        
        if (!stateManager.getIsDragging() || !dragComponent) return;
        
        e.preventDefault();
        
        const canvas = document.getElementById(dragComponent.section + 'Canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Calculate new position
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dragOffset = stateManager.getDragOffset();
        
        let newX = mouseX - dragOffset.x;
        let newY = mouseY - dragOffset.y;
        
        // Snap to grid with different X and Y spacing
        const snapped = stateManager.snapToGrid(newX, newY);
        newX = snapped.x;
        newY = snapped.y;
        
        // Ensure component stays within canvas bounds
        const iconSize = 30;
        const canvasWidth = parseInt(canvas.getAttribute('width') || '1200');
        const canvasHeight = parseInt(canvas.getAttribute('height') || '2000');
        
        newX = Math.max(0, Math.min(newX, canvasWidth - iconSize));
        newY = Math.max(0, Math.min(newY, canvasHeight - iconSize));
        
        // Update component position
        dragComponent.x = newX;
        dragComponent.y = newY;
        
        // Re-render the section to update visuals
        const renderingManager: IRenderingManager = window.renderingManager;
        const components = dragComponent.section === 'preproc' ? 
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        renderingManager.renderComponentSection(components, dragComponent.section + 'Canvas');
    }
    
    private endDrag(e: MouseEvent, dragComponent: VrmComponent, groupElement: Element, handleDragBound: any, endDragBound: any): void {
        const stateManager: IStateManager = window.stateManager;
        
        // Check if we're actually dragging - prevent multiple calls
        if (!stateManager.getIsDragging() || !dragComponent) {
            console.log('endDrag called but not dragging, ignoring');
            return;
        }
        
        e.preventDefault();
        console.log('Ending single drag for component:', dragComponent.n);
        
        // IMMEDIATELY set dragging to false to prevent multiple calls
        stateManager.setIsDragging(false);
        
        // Clean up event listeners FIRST - CRITICAL: Remove the exact same function references
        document.removeEventListener('mousemove', handleDragBound);
        document.removeEventListener('mouseup', endDragBound);
        
        // Check if component actually moved
        const dragStartPos = stateManager.getDragStartPos();
        const moved = dragComponent.x !== dragStartPos.x || dragComponent.y !== dragStartPos.y;
        
        if (moved) {
            // Get VS Code API safely - avoid multiple acquisitions
            let vscode: VsCodeApi | undefined = window.vscode;
            if (!vscode && window.acquireVsCodeApi) {
                try {
                    vscode = window.acquireVsCodeApi();
                    window.vscode = vscode; // Store for future use
                } catch (error) {
                    console.warn('VS Code API already acquired, using existing instance');
                    vscode = window.vscode; // Use existing instance
                }
            }
            
            if (vscode && vscode.postMessage) {
                console.log('Sending component update to extension');
                vscode.postMessage({
                    command: 'updateComponent',
                    component: dragComponent
                });
            } else {
                console.warn('VS Code API not available, cannot send component update');
            }
        }
        
        // Remove visual feedback
        groupElement.classList.remove('dragging');
        
        // Reset drag state completely
        stateManager.setDragComponent(null);
        stateManager.setDragOffset({ x: 0, y: 0 });
        stateManager.setDragStartPos({ x: 0, y: 0 });
        stateManager.setDragHandlers(null);
        
        console.log('Single drag ended successfully');
    }

    public startMultiDrag(e: MouseEvent, clickedComponent: VrmComponent): void {
        e.preventDefault();
        e.stopPropagation();
        
        const stateManager: IStateManager = window.stateManager;
        
        // Prevent multiple drag operations
        if (stateManager.getIsMultiDragging()) {
            console.log('Multi-drag already in progress, ignoring');
            return;
        }
        
        console.log('Starting multi-drag with', stateManager.getSelectedComponents().size, 'components');
        console.log('User clicked on component:', clickedComponent);
        
        stateManager.setIsMultiDragging(true);
        stateManager.getMultiDragStartPositions().clear();
        
        // CRITICAL: Store the clicked component as the reference
        stateManager.setMultiDragReferenceComponent(clickedComponent);
        
        const canvas = document.getElementById(clickedComponent.section + 'Canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Store initial positions of all selected components
        const components = clickedComponent.section === 'preproc' ? 
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [section, id] = componentKey.split('-');
            const component = components.find((c: VrmComponent) => c.n === parseInt(id));
            if (component) {
                stateManager.getMultiDragStartPositions().set(componentKey, { x: component.x, y: component.y });
            }
        });
        
        // Calculate offset from mouse to clicked component
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const multiDragOffset: Position = {
            x: mouseX - clickedComponent.x,
            y: mouseY - clickedComponent.y
        };
        stateManager.setMultiDragOffset(multiDragOffset);
        
        // Add visual feedback
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [section, id] = componentKey.split('-');
            const element = document.querySelector(`[data-component-id="${id}"][data-section="${section}"]`);
            if (element) {
                element.classList.add('dragging');
            }
        });
        
        // Create bound event handlers that maintain proper context
        const handleMultiDragBound = (event: MouseEvent) => {
            this.handleMultiDrag(event, clickedComponent);
        };
        
        const endMultiDragBound = (event: MouseEvent) => {
            // Prevent multiple calls
            if (!stateManager.getIsMultiDragging()) return;
            this.endMultiDrag(event, handleMultiDragBound, endMultiDragBound);
        };
        
        // Add global mouse handlers
        document.addEventListener('mousemove', handleMultiDragBound);
        document.addEventListener('mouseup', endMultiDragBound);
        
        // Store handlers for emergency cleanup
        const multiDragHandlers: MultiDragHandlers = { handleMultiDragBound, endMultiDragBound };
        stateManager.setMultiDragHandlers(multiDragHandlers);
        
        // Hide details panel during drag
        const details = document.getElementById('componentDetails');
        if (details) details.style.display = 'none';
    }
    
    private handleMultiDrag(e: MouseEvent, clickedComponent: VrmComponent): void {
        const stateManager: IStateManager = window.stateManager;
        
        if (!stateManager.getIsMultiDragging()) return;
        
        e.preventDefault();
        
        // Get user selected component to calculate relative movement
        const userSelectedComponentKey = clickedComponent.section + '-' + clickedComponent.n;
        const [section, id] = userSelectedComponentKey.split('-');
        const components = section === 'preproc' ? 
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        
        const canvas = document.getElementById(section + 'Canvas');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Calculate new position for the first component (reference point)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const multiDragOffset = stateManager.getMultiDragOffset();
        
        let newX = mouseX - multiDragOffset.x;
        let newY = mouseY - multiDragOffset.y;
        
        // Snap to grid
        const snapped = stateManager.snapToGrid(newX, newY);
        newX = snapped.x;
        newY = snapped.y;
        
        // Calculate movement delta from the first component's start position
        const firstStartPos = stateManager.getMultiDragStartPositions().get(userSelectedComponentKey);
        if (!firstStartPos) return;
        
        const deltaX = newX - firstStartPos.x;
        const deltaY = newY - firstStartPos.y;
        
        // Apply movement to all selected components
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [compSection, compId] = componentKey.split('-');
            const component = components.find((c: VrmComponent) => c.n === parseInt(compId));
            const startPosition = stateManager.getMultiDragStartPositions().get(componentKey);
            
            if (component && startPosition) {
                let componentNewX = startPosition.x + deltaX;
                let componentNewY = startPosition.y + deltaY;
                
                // Ensure component stays within canvas bounds
                const iconSize = 30;
                const canvasWidth = parseInt(canvas.getAttribute('width') || '1200');
                const canvasHeight = parseInt(canvas.getAttribute('height') || '2000');
                
                componentNewX = Math.max(0, Math.min(componentNewX, canvasWidth - iconSize));
                componentNewY = Math.max(0, Math.min(componentNewY, canvasHeight - iconSize));
                
                // Update component position in the data
                component.x = componentNewX;
                component.y = componentNewY;
            }
        });
        
        // Re-render the section to update visuals
        const renderingManager: IRenderingManager = window.renderingManager;
        renderingManager.renderComponentSection(components, section + 'Canvas');
        
        // Restore selection states
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [compSection, compId] = componentKey.split('-');
            const element = document.querySelector(`[data-component-id="${compId}"][data-section="${compSection}"]`);
            if (element) {
                element.classList.add('selected', 'dragging');
            }
        });
    }
    
    private endMultiDrag(e: MouseEvent, handleMultiDragBound: any, endMultiDragBound: any): void {
        const stateManager: IStateManager = window.stateManager;
        
        if (!stateManager.getIsMultiDragging()) {
            console.log('endMultiDrag called but not multi-dragging, ignoring');
            return;
        }
        
        e.preventDefault();
        console.log('Ending multi-drag - ONCE');
        
        // Set state to false FIRST to prevent multiple calls
        stateManager.setIsMultiDragging(false);
        
        // Clean up event listeners IMMEDIATELY
        document.removeEventListener('mousemove', handleMultiDragBound);
        document.removeEventListener('mouseup', endMultiDragBound);
        
        // Get VS Code API safely - avoid multiple acquisitions
        let vscode: VsCodeApi | undefined = window.vscode;
        if (!vscode && window.acquireVsCodeApi) {
            try {
                vscode = window.acquireVsCodeApi();
                window.vscode = vscode; // Store for future use
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                vscode = window.vscode; // Use existing instance
            }
        }
        
        // Send updates for all moved components
        if (vscode && vscode.postMessage) {
            stateManager.getSelectedComponents().forEach((componentKey: string) => {
                const [section, id] = componentKey.split('-');
                const components = section === 'preproc' ? 
                    stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
                const component = components.find((c: VrmComponent) => c.n === parseInt(id));
                
                if (component) {
                    vscode.postMessage({
                        command: 'updateComponent',
                        component: component
                    });
                }
            });
        } else {
            console.warn('VS Code API not available, cannot send component updates');
        }
        
        // Remove visual feedback but keep selection
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [section, id] = componentKey.split('-');
            const element = document.querySelector(`[data-component-id="${id}"][data-section="${section}"]`);
            if (element) {
                element.classList.remove('dragging');
                element.classList.add('selected'); // Ensure it stays selected
            }
        });
        
        // Reset state
        stateManager.getMultiDragStartPositions().clear();
        stateManager.setMultiDragOffset({ x: 0, y: 0 });
        stateManager.setMultiDragHandlers(null);
        
        console.log('Multi-drag ended successfully');
    }
    
    public static inject(): string {
        return `
            window.dragDropManager = new (${DragDropManager.toString()})();
            
            // Make functions globally available
            window.startDrag = (e, component, groupElement) => window.dragDropManager.startDrag(e, component, groupElement);
            window.startMultiDrag = (e, clickedComponent) => window.dragDropManager.startMultiDrag(e, clickedComponent);
        `;
    }
}