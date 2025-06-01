import {
    VrmComponent,
    Position,
    GridSizes,
    ISelectionManager,
    IStateManager,
    IRenderingManager,
    IComponentEditor,
    IContextMenuManager,
    CustomWindow
} from '../../types';

declare const window: CustomWindow;

export class SelectionManager implements ISelectionManager {
    private static instance: SelectionManager;

    private constructor() {
        if (!window.documentState) {
            throw new Error('DocumentState must be initialized before SelectionManager');
        }
    }

    public static getInstance(): SelectionManager {
        if (!SelectionManager.instance) {
            SelectionManager.instance = new SelectionManager();
        }
        return SelectionManager.instance;
    }

    public selectComponentsBelow(point: Position): void {
        const section = window.stateManager.getActiveTab() as 'preproc' | 'postproc';
        const components = window.documentState.getComponents(section);
        const selected: VrmComponent[] = [];

        components.forEach((comp: VrmComponent) => {
            if (comp.y >= point.y) {
                selected.push(comp);
            }
        });

        if (selected.length > 0) {
            // Clear existing and select new (replace)
            this.clearSelection();
            const selectedSet = new Set(selected.map(comp => `${comp.section}-${comp.n}`));
            window.stateManager.setSelectedComponents(selectedSet);

            // Re-render to show selection
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = section + 'Canvas';
            renderingManager.renderComponentSection(components, canvasId);

            // Restore selection states after re-rendering
            this.restoreSelectionStates();

            this.updateSelectionDetails();

            console.log(`Selected ${selected.length} components below y=${point.y}`);

            // Visual feedback
            const contextMenuManager: IContextMenuManager = window.contextMenuManager;
            contextMenuManager.showTemporaryMessage(`Selected ${selected.length} components`);
        } else {
            console.log('No components found below the specified point');
            const contextMenuManager: IContextMenuManager = window.contextMenuManager;
            contextMenuManager.showTemporaryMessage('No components found below this point');
        }
    }

    public selectComponentsAbove(point: Position): void {
        const section = window.stateManager.getActiveTab() as 'preproc' | 'postproc';
        const components = window.documentState.getComponents(section);
        const selected: VrmComponent[] = [];

        components.forEach((comp: VrmComponent) => {
            if (comp.y <= point.y) {
                selected.push(comp);
            }
        });

        if (selected.length > 0) {
            this.clearSelection();
            const selectedSet = new Set(selected.map(comp => `${comp.section}-${comp.n}`));
            window.stateManager.setSelectedComponents(selectedSet);

            // Re-render to show selection
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = section + 'Canvas';
            renderingManager.renderComponentSection(components, canvasId);

            // Restore selection states after re-rendering
            this.restoreSelectionStates();

            this.updateSelectionDetails();

            console.log(`Selected ${selected.length} components above y=${point.y}`);
        }
    }

    public selectComponentsInRow(point: Position): void {
        const section = window.stateManager.getActiveTab() as 'preproc' | 'postproc';
        const components = window.documentState.getComponents(section);
        const selected: VrmComponent[] = [];
        const gridSizes: GridSizes = window.stateManager.getGridSizes();
        const tolerance = gridSizes.y; // Allow some tolerance for "same row"

        components.forEach((comp: VrmComponent) => {
            if (Math.abs(comp.y - point.y) <= tolerance) {
                selected.push(comp);
            }
        });

        if (selected.length > 0) {
            this.clearSelection();
            const selectedSet = new Set(selected.map(comp => `${comp.section}-${comp.n}`));
            window.stateManager.setSelectedComponents(selectedSet);

            // Re-render to show selection
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = section + 'Canvas';
            renderingManager.renderComponentSection(components, canvasId);

            // Restore selection states after re-rendering
            this.restoreSelectionStates();

            this.updateSelectionDetails();

            console.log(`Selected ${selected.length} components in row at y≈${point.y}`);
        }
    }

    public selectComponentsInColumn(point: Position): void {
        const stateManager: IStateManager = window.stateManager;
        const components = stateManager.getActiveTab() === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        const selected: VrmComponent[] = [];
        const gridSizes: GridSizes = stateManager.getGridSizes();
        const tolerance = gridSizes.x; // Allow some tolerance for "same column"

        components.forEach((comp: VrmComponent) => {
            if (Math.abs(comp.x - point.x) <= tolerance) {
                selected.push(comp);
            }
        });

        if (selected.length > 0) {
            this.clearSelection();
            const selectedSet = new Set(selected.map(comp => `${comp.section}-${comp.n}`));
            stateManager.setSelectedComponents(selectedSet);

            // Re-render to show selection
            const renderingManager: IRenderingManager = window.renderingManager;
            const canvasId = stateManager.getActiveTab() + 'Canvas';
            renderingManager.renderComponentSection(components, canvasId);

            // Restore selection states after re-rendering
            this.restoreSelectionStates();

            this.updateSelectionDetails();

            console.log(`Selected ${selected.length} components in column at x≈${point.x}`);
        }
    }

    public selectAllComponents(): void {
        console.log('Select all components triggered');
        this.clearSelection();
        const stateManager: IStateManager = window.stateManager;
        const components = stateManager.getActiveTab() === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();

        console.log('Components to select:', components.length);

        components.forEach((component: VrmComponent) => {
            const componentKey = `${component.section}-${component.n}`;
            stateManager.getSelectedComponents().add(componentKey);

            const element = document.querySelector(`[data-component-id="${component.n}"][data-section="${component.section}"]`);
            if (element) {
                element.classList.add('selected');
                console.log('Selected component:', componentKey);
            }
        });

        console.log('Total selected:', stateManager.getSelectedComponents().size);

        if (stateManager.getSelectedComponents().size > 0) {
            const componentEditor: IComponentEditor = window.componentEditor;
            componentEditor.showMultiSelectionDetails();
        }
    }

    public updateSelectionDetails(): void {
        const stateManager: IStateManager = window.stateManager;
        if (stateManager.getSelectedComponents().size > 0) {
            const componentEditor: IComponentEditor = window.componentEditor;
            componentEditor.showMultiSelectionDetails();
        }
    }

    public clearSelection(): void {
        console.log('Clearing selection...');
        const stateManager: IStateManager = window.stateManager;
        stateManager.getSelectedComponents().clear();
        document.querySelectorAll('.component-node').forEach(node => {
            node.classList.remove('selected', 'selecting');
        });
        const details = document.getElementById('componentDetails');
        if (details) details.style.display = 'none';
    }

    public restoreSelectionStates(): void {
        // Restore visual selection states after re-rendering
        window.stateManager.getSelectedComponents().forEach((componentKey: string) => {
            const [section, id] = componentKey.split('-');
            const element = document.querySelector(`[data-component-id="${id}"][data-section="${section}"]`);
            if (element) {
                element.classList.add('selected');
            }
        });
    }

    // Box selection functions
    public startSelection(e: MouseEvent): void {
        console.log('Starting selection...');
        const canvas = e.target as HTMLElement;
        const rect = canvas.getBoundingClientRect();
        const stateManager: IStateManager = window.stateManager;

        stateManager.setIsSelecting(true);
        const selectionStart: Position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        stateManager.setSelectionStart(selectionStart);
        stateManager.setSelectionEnd(selectionStart);

        console.log('Selection start:', selectionStart);

        // Clear existing selection if not holding Ctrl/Cmd
        if (!e.ctrlKey && !e.metaKey) {
            this.clearSelection();
        }

        // Create selection rectangle
        this.createSelectionRect(canvas);

        // Prevent default to avoid text selection
        e.preventDefault();
        e.stopPropagation();
    }

    public updateSelection(e: MouseEvent): void {
        const stateManager: IStateManager = window.stateManager;
        if (!stateManager.getIsSelecting()) return;

        const canvas = document.getElementById(stateManager.getActiveTab() + 'Canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        const selectionEnd: Position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        stateManager.setSelectionEnd(selectionEnd);

        this.updateSelectionRect();
        this.highlightComponentsInSelection();
    }

    public endSelection(e: MouseEvent): void {
        const stateManager: IStateManager = window.stateManager;
        if (!stateManager.getIsSelecting()) return;

        console.log('Ending selection...');

        stateManager.setIsSelecting(false);
        stateManager.setJustFinishedSelecting(true);

        // Finalize selection BEFORE removing selection rectangle
        this.finalizeSelection();

        // Remove selection rectangle
        const selectionRect = stateManager.getSelectionRect();
        if (selectionRect) {
            selectionRect.remove();
            stateManager.setSelectionRect(null);
        }

        console.log('Selected components after finalization:', stateManager.getSelectedComponents());

        // Update details panel if components are selected
        if (stateManager.getSelectedComponents().size > 0) {
            const componentEditor: IComponentEditor = window.componentEditor;
            componentEditor.showMultiSelectionDetails();
        }

        // Reset the flag after a short delay to prevent immediate clearing
        setTimeout(() => {
            stateManager.setJustFinishedSelecting(false);
        }, 50);
    }

    private createSelectionRect(canvas: HTMLElement): void {
        const stateManager: IStateManager = window.stateManager;
        const selectionRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selectionRect.setAttribute('class', 'selection-rect');
        selectionRect.setAttribute('fill', 'rgba(33, 150, 243, 0.2)');
        selectionRect.setAttribute('stroke', '#2196F3');
        selectionRect.setAttribute('stroke-width', '1');
        selectionRect.setAttribute('stroke-dasharray', '5,5');
        canvas.appendChild(selectionRect);
        stateManager.setSelectionRect(selectionRect);
    }

    private updateSelectionRect(): void {
        const stateManager: IStateManager = window.stateManager;
        const selectionRect = stateManager.getSelectionRect();
        if (!selectionRect) return;

        const selectionStart = stateManager.getSelectionStart();
        const selectionEnd = stateManager.getSelectionEnd();

        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);

        selectionRect.setAttribute('x', left.toString());
        selectionRect.setAttribute('y', top.toString());
        selectionRect.setAttribute('width', width.toString());
        selectionRect.setAttribute('height', height.toString());
    }

    private highlightComponentsInSelection(): void {
        const stateManager: IStateManager = window.stateManager;
        const components = stateManager.getActiveTab() === 'preproc' ?
            stateManager.getPreprocComponents() : stateManager.getPostprocComponents();
        const selectionStart = stateManager.getSelectionStart();
        const selectionEnd = stateManager.getSelectionEnd();

        const left = Math.min(selectionStart.x, selectionEnd.x);
        const top = Math.min(selectionStart.y, selectionEnd.y);
        const right = Math.max(selectionStart.x, selectionEnd.x);
        const bottom = Math.max(selectionStart.y, selectionEnd.y);

        components.forEach((component: VrmComponent) => {
            const componentInSelection = (
                component.x >= left &&
                component.y >= top &&
                component.x + 30 <= right && // 30 is icon size
                component.y + 30 <= bottom
            );

            const componentElement = document.querySelector(
                `[data-component-id="${component.n}"][data-section="${component.section}"]`
            );

            if (componentElement) {
                if (componentInSelection) {
                    componentElement.classList.add('selecting');
                } else {
                    componentElement.classList.remove('selecting');
                }
            }
        });
    }

    private finalizeSelection(): void {
        console.log('Finalizing selection...');
        const stateManager: IStateManager = window.stateManager;

        // Find all components that are currently being selected
        const selectingElements = document.querySelectorAll('.selecting');
        console.log('Found selecting elements:', selectingElements.length);

        selectingElements.forEach(element => {
            const componentId = element.getAttribute('data-component-id');
            const section = element.getAttribute('data-section');
            const componentKey = `${section}-${componentId}`;

            console.log('Adding to selection:', componentKey);

            // Add to selection set
            stateManager.getSelectedComponents().add(componentKey);

            // Update visual state
            element.classList.remove('selecting');
            element.classList.add('selected');
        });

        console.log('Selection finalized. Total selected:', stateManager.getSelectedComponents().size);
    }

    public isSelecting(): boolean {
        return window.stateManager.getIsSelecting();
    }

    public isDragging(): boolean {
        return window.stateManager.getIsDragging();
    }

    public isMultiDragging(): boolean {
        return window.stateManager.getIsMultiDragging();
    }

    public getSelectedComponentCount(): number {
        return window.stateManager.getSelectedComponents().size;
    }

    public isComponentSelected(componentId: string): boolean {
        return window.stateManager.getSelectedComponents().has(componentId);
    }

    public selectComponent(componentId: string): void {
        const selected = new Set(window.stateManager.getSelectedComponents());
        selected.add(componentId);
        window.stateManager.setSelectedComponents(selected);
        this.updateSelectionDetails();
    }

    public deselectComponent(componentId: string): void {
        const selected = new Set(window.stateManager.getSelectedComponents());
        selected.delete(componentId);
        window.stateManager.setSelectedComponents(selected);
        this.updateSelectionDetails();
    }

    public static inject(): string {
        return `
            window.selectionManager = new (${SelectionManager.toString()})();
            
            // Make functions globally available for HTML onclick handlers
            window.clearSelection = () => window.selectionManager.clearSelection();
            window.selectAllComponents = () => window.selectionManager.selectAllComponents();
            window.startSelection = (e) => window.selectionManager.startSelection(e);
            window.updateSelection = (e) => window.selectionManager.updateSelection(e);
            window.endSelection = (e) => window.selectionManager.endSelection(e);
        `;
    }
}