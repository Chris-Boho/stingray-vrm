import {
    VrmComponent,
    Position,
    GridSizes,
    DragHandlers,
    MultiDragHandlers,
    IStateManager,
    ISelectionManager,
    CustomWindow
} from '../../types';
// Remove DocumentState import since we'll use window.documentState
// import { DocumentState } from './DocumentState';

declare const window: CustomWindow;

export class StateManager implements IStateManager {
    private static instance: StateManager;
    // Remove documentState property since we'll use window.documentState

    // UI state variables only
    private currentZoom: number = 1;
    private isDragging: boolean = false;
    private dragComponent: VrmComponent | null = null;
    private dragOffset: Position = { x: 0, y: 0 };
    private dragStartPos: Position = { x: 0, y: 0 };
    private dragHandlers: DragHandlers | null = null;
    private isSelecting: boolean = false;
    private selectionStart: Position = { x: 0, y: 0 };
    private selectionEnd: Position = { x: 0, y: 0 };
    private selectedComponents: Set<string> = new Set();
    private selectionRect: SVGElement | null = null;
    private justFinishedSelecting: boolean = false;
    private isMultiDragging: boolean = false;
    private multiDragStartPositions: Map<string, Position> = new Map();
    private multiDragOffset: Position = { x: 0, y: 0 };
    private multiDragReferenceComponent: VrmComponent | null = null;
    private multiDragHandlers: MultiDragHandlers | null = null;
    private contextMenu: HTMLElement | null = null;
    private contextMenuPosition: Position = { x: 0, y: 0 };
    private isContextMenuOpen: boolean = false;

    // Grid settings
    private readonly GRID_SIZE_X: number = 32;
    private readonly GRID_SIZE_Y: number = 26;

    private constructor() {
        // Use window.documentState instead of creating a new instance
        if (!window.documentState) {
            throw new Error('DocumentState must be initialized before StateManager');
        }
    }

    public static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }

    // =================================================================
    // GETTERS - UI State Only
    // =================================================================
    public getCurrentZoom(): number { return this.currentZoom; }
    public getActiveTab(): string { return window.documentState.getCurrentSection(); }
    public getPreprocComponents(): VrmComponent[] { return window.documentState.getComponents('preproc'); }
    public getPostprocComponents(): VrmComponent[] { return window.documentState.getComponents('postproc'); }
    public getSelectedComponents(): Set<string> { return this.selectedComponents; }
    public getIsDragging(): boolean { return this.isDragging; }
    public getIsSelecting(): boolean { return this.isSelecting; }
    public getIsContextMenuOpen(): boolean { return this.isContextMenuOpen; }
    public getContextMenuPosition(): Position { return this.contextMenuPosition; }
    public getGridSizes(): GridSizes { return { x: this.GRID_SIZE_X, y: this.GRID_SIZE_Y }; }
    public getDragComponent(): VrmComponent | null { return this.dragComponent; }
    public getDragOffset(): Position { return this.dragOffset; }
    public getDragStartPos(): Position { return this.dragStartPos; }
    public getDragHandlers(): DragHandlers | null { return this.dragHandlers; }
    public getSelectionStart(): Position { return this.selectionStart; }
    public getSelectionEnd(): Position { return this.selectionEnd; }
    public getSelectionRect(): SVGElement | null { return this.selectionRect; }
    public getJustFinishedSelecting(): boolean { return this.justFinishedSelecting; }
    public getIsMultiDragging(): boolean { return this.isMultiDragging; }
    public getMultiDragStartPositions(): Map<string, Position> { return this.multiDragStartPositions; }
    public getMultiDragOffset(): Position { return this.multiDragOffset; }
    public getMultiDragReferenceComponent(): VrmComponent | null { return this.multiDragReferenceComponent; }
    public getMultiDragHandlers(): MultiDragHandlers | null { return this.multiDragHandlers; }
    public getContextMenu(): HTMLElement | null { return this.contextMenu; }

    // =================================================================
    // SETTERS - UI State Only
    // =================================================================
    public setActiveTab(tab: string): void {
        window.documentState.setCurrentSection(tab as 'preproc' | 'postproc');
    }

    public setPreprocComponents(components: VrmComponent[]): void {
        // Delegate to DocumentState
        components.forEach(component => {
            window.documentState.updateComponent(component);
        });
    }

    public setPostprocComponents(components: VrmComponent[]): void {
        // Delegate to DocumentState
        components.forEach(component => {
            window.documentState.updateComponent(component);
        });
    }

    public updateComponent(component: VrmComponent): void {
        // Use window.documentState
        window.documentState.updateComponent(component);
    }

    public setSelectedComponents(components: Set<string>): void { this.selectedComponents = components; }
    public setIsDragging(dragging: boolean): void { this.isDragging = dragging; }
    public setIsSelecting(selecting: boolean): void { this.isSelecting = selecting; }
    public setIsContextMenuOpen(open: boolean): void { this.isContextMenuOpen = open; }
    public setContextMenuPosition(pos: Position): void { this.contextMenuPosition = pos; }
    public setDragComponent(component: VrmComponent | null): void { this.dragComponent = component; }
    public setDragOffset(offset: Position): void { this.dragOffset = offset; }
    public setDragStartPos(pos: Position): void { this.dragStartPos = pos; }
    public setDragHandlers(handlers: DragHandlers | null): void { this.dragHandlers = handlers; }
    public setSelectionStart(start: Position): void { this.selectionStart = start; }
    public setSelectionEnd(end: Position): void { this.selectionEnd = end; }
    public setSelectionRect(rect: SVGElement | null): void { this.selectionRect = rect; }
    public setJustFinishedSelecting(finished: boolean): void { this.justFinishedSelecting = finished; }
    public setIsMultiDragging(dragging: boolean): void { this.isMultiDragging = dragging; }
    public setMultiDragOffset(offset: Position): void { this.multiDragOffset = offset; }
    public setMultiDragReferenceComponent(component: VrmComponent | null): void { this.multiDragReferenceComponent = component; }
    public setMultiDragHandlers(handlers: MultiDragHandlers | null): void { this.multiDragHandlers = handlers; }
    public setContextMenu(menu: HTMLElement | null): void { this.contextMenu = menu; }

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================
    public snapToGrid(x: number, y: number): Position {
        return {
            x: Math.round(x / this.GRID_SIZE_X) * this.GRID_SIZE_X,
            y: Math.round(y / this.GRID_SIZE_Y) * this.GRID_SIZE_Y
        };
    }

    public getComponentColor(type: string): string {
        return window.documentState.getComponentColor(type);
    }

    // =================================================================
    // PUBLIC METHODS - UI Operations
    // =================================================================
    public switchTab(tabName: string): void {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const tabButton = document.getElementById(tabName + 'Tab');
        if (tabButton) tabButton.classList.add('active');

        // Update section content
        document.querySelectorAll('.section-content').forEach(section => section.classList.remove('active'));
        const section = document.getElementById(tabName + 'Section');
        if (section) section.classList.add('active');

        // Update DocumentState
        window.documentState.setCurrentSection(tabName as 'preproc' | 'postproc');

        // Hide details panel when switching tabs
        const details = document.getElementById('componentDetails');
        if (details) details.style.display = 'none';

        // Clear selection when switching tabs
        const selectionManager: ISelectionManager = window.selectionManager;
        if (selectionManager) {
            selectionManager.clearSelection();
        }
    }

    public updateComponentCounts(): void {
        const preprocCount = document.getElementById('preprocCount');
        const postprocCount = document.getElementById('postprocCount');

        if (preprocCount) {
            preprocCount.textContent = window.documentState.getComponents('preproc').length.toString();
        }
        if (postprocCount) {
            postprocCount.textContent = window.documentState.getComponents('postproc').length.toString();
        }
    }

    public zoomIn(): void {
        this.currentZoom *= 1.2;
        this.updateZoom();
    }

    public zoomOut(): void {
        this.currentZoom /= 1.2;
        this.updateZoom();
    }

    public resetZoom(): void {
        this.currentZoom = 1;
        this.updateZoom();
    }

    private updateZoom(): void {
        const canvases = document.querySelectorAll('.component-canvas') as NodeListOf<HTMLElement>;
        canvases.forEach(canvas => {
            canvas.style.transform = `scale(${this.currentZoom})`;
            canvas.style.transformOrigin = '0 0';
        });
    }

    // =================================================================
    // INJECTION METHOD
    // =================================================================
    public static inject(): string {
        return `
            // Inject StateManager class as singleton
            window.stateManager = (${StateManager.toString()}).getInstance();
            
            // Make functions globally available for HTML onclick handlers
            window.zoomIn = () => window.stateManager.zoomIn();
            window.zoomOut = () => window.stateManager.zoomOut();
            window.resetZoom = () => window.stateManager.resetZoom();
            window.switchTab = (tabName) => window.stateManager.switchTab(tabName);
        `;
    }
}