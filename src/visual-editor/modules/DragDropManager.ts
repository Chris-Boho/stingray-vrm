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
        const renderingManager: IRenderingManager = window.renderingManager;

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

        // During drag, only enforce horizontal bounds
        const iconSize = 30;
        const canvasWidth = parseInt(canvas.getAttribute('width') || '1200');
        newX = Math.max(0, Math.min(newX, canvasWidth - iconSize));
        // Allow vertical movement beyond current canvas height during drag
        newY = Math.max(0, newY);

        // Update component position in the data model
        dragComponent.x = newX;
        dragComponent.y = newY;

        // Update the visual position immediately without re-rendering
        const groupElement = document.querySelector(`[data-component-id="${dragComponent.n}"][data-section="${dragComponent.section}"]`) as HTMLElement;
        if (groupElement) {
            // During drag, update position directly without any transitions
            groupElement.style.transform = `translate(${newX}px, ${newY}px)`;
            groupElement.setAttribute('data-x', newX.toString());
            groupElement.setAttribute('data-y', newY.toString());
        }

        // Update canvas height during drag if needed
        const sectionComponents = window.documentState.getComponents(dragComponent.section);
        const requiredHeight = renderingManager.calculateRequiredCanvasHeight(sectionComponents);
        const currentHeight = parseInt(canvas.getAttribute('height') || '2000');
        if (requiredHeight > currentHeight) {
            canvas.setAttribute('height', requiredHeight.toString());
        }

        // Update all connections for this component
        const allComponents = dragComponent.section === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();

        // Update outgoing connections (where this component is the source)
        if (dragComponent.j && dragComponent.j.length > 0) {
            dragComponent.j.forEach((targetId: number, index: number) => {
                // Only render connections that are actually set (not 0 or -1)
                if (targetId > 0) {
                    const targetComponent = allComponents.find(c => c.n === targetId);
                    if (targetComponent) {
                        renderingManager.renderConnection(dragComponent, targetComponent, index === 0, dragComponent.section + 'Canvas');
                    }
                }
            });
        }

        // Update incoming connections (where this component is the target)
        allComponents.forEach(component => {
            if (component.j && component.j.length > 0) {
                component.j.forEach((targetId: number, index: number) => {
                    // Only render connections that are actually set (not 0 or -1)
                    if (targetId > 0 && targetId === dragComponent.n) {
                        renderingManager.renderConnection(component, dragComponent, index === 0, dragComponent.section + 'Canvas');
                    }
                });
            }
        });
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
        console.log("testing");
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

        // Get rendering manager once
        const renderingManager: IRenderingManager = window.renderingManager;
        let maxY = 0;

        // Apply movement to all selected components
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [compSection, compId] = componentKey.split('-');
            const component = components.find((c: VrmComponent) => c.n === parseInt(compId));
            const startPosition = stateManager.getMultiDragStartPositions().get(componentKey);

            if (component && startPosition) {
                let componentNewX = startPosition.x + deltaX;
                let componentNewY = startPosition.y + deltaY;

                // During drag, only enforce horizontal bounds
                const iconSize = 30;
                const canvasWidth = parseInt(canvas.getAttribute('width') || '1200');
                componentNewX = Math.max(0, Math.min(componentNewX, canvasWidth - iconSize));
                // Allow vertical movement beyond current canvas height during drag
                componentNewY = Math.max(0, componentNewY);

                // Update component position in the data
                component.x = componentNewX;
                component.y = componentNewY;

                // Track the highest y coordinate
                maxY = Math.max(maxY, componentNewY);

                // Update the visual position immediately without re-rendering
                const groupElement = document.querySelector(`[data-component-id="${compId}"][data-section="${compSection}"]`) as HTMLElement;
                if (groupElement) {
                    // During drag, update position directly without any transitions
                    groupElement.style.transform = `translate(${componentNewX}px, ${componentNewY}px)`;
                    groupElement.setAttribute('data-x', componentNewX.toString());
                    groupElement.setAttribute('data-y', componentNewY.toString());
                }

                // Update all connections for this component
                // Update outgoing connections (where this component is the source)
                if (component.j && component.j.length > 0) {
                    component.j.forEach((targetId: number, index: number) => {
                        // Only render connections that are actually set (not 0 or -1)
                        if (targetId > 0) {
                            const targetComponent = components.find(c => c.n === targetId);
                            if (targetComponent) {
                                renderingManager.renderConnection(component, targetComponent, index === 0, component.section + 'Canvas');
                            }
                        }
                    });
                }

                // Update incoming connections (where this component is the target)
                components.forEach(otherComponent => {
                    if (otherComponent.j && otherComponent.j.length > 0) {
                        otherComponent.j.forEach((targetId: number, index: number) => {
                            // Only render connections that are actually set (not 0 or -1)
                            if (targetId > 0 && targetId === component.n) {
                                renderingManager.renderConnection(otherComponent, component, index === 0, component.section + 'Canvas');
                            }
                        });
                    }
                });
            }
        });

        // Update canvas height during drag if needed
        const requiredHeight = renderingManager.calculateRequiredCanvasHeight(components);
        const currentHeight = parseInt(canvas.getAttribute('height') || '2000');
        if (requiredHeight > currentHeight) {
            canvas.setAttribute('height', requiredHeight.toString());
        }

        // Restore selection states without re-rendering
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

        // Collect all moved components
        const movedComponents: VrmComponent[] = [];
        stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [compSection, id] = componentKey.split('-');
            const components = compSection === 'preproc' ?
                stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
            const component = components.find((c: VrmComponent) => c.n === parseInt(id));

            if (component) {
                const startPos = stateManager.getMultiDragStartPositions().get(componentKey);
                if (startPos && (component.x !== startPos.x || component.y !== startPos.y)) {
                    movedComponents.push(component);
                }
            }
        });

        // Send all updates in a single message if any components moved
        if (vscode && vscode.postMessage && movedComponents.length > 0) {
            console.log(`Sending update for ${movedComponents.length} moved components`);
            vscode.postMessage({
                command: 'updateComponent',
                components: movedComponents
            });
        } else if (movedComponents.length === 0) {
            console.log('No components were moved during multi-drag');
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