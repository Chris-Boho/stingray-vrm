// types.ts - Centralized type definitions

// VS Code API interface
export interface VsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Component interface
export interface VrmComponent {
    n: number;           // Component number/ID
    t: string;           // Component type (IF, SELECTQUERY, etc.)
    values?: ComponentValues;
    j: number[];         // Jump/connection targets
    x: number;           // X coordinate
    y: number;           // Y coordinate
    c: string;           // Comment/description
    wp: boolean;         // Watchpoint flag
    section: 'preproc' | 'postproc';
}

export interface ComponentValues {
    conditions?: string[];
    query?: string;
    params?: ComponentParameter[];
}

export interface ComponentParameter {
    name: string;
    type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'DECIMAL';
    value: string;
}

// Position interfaces
export interface Position {
    x: number;
    y: number;
}

export interface GridSizes {
    x: number;
    y: number;
}

// State Manager interface
export interface IStateManager {
    // Getters
    getCurrentZoom(): number;
    getActiveTab(): string;
    getPreprocComponents(): VrmComponent[];
    getPostprocComponents(): VrmComponent[];
    getSelectedComponents(): Set<string>;
    getIsDragging(): boolean;
    getIsSelecting(): boolean;
    getIsContextMenuOpen(): boolean;
    getContextMenuPosition(): Position;
    getGridSizes(): GridSizes;
    getDragComponent(): VrmComponent | null;
    getDragOffset(): Position;
    getDragStartPos(): Position;
    getSelectionStart(): Position;
    getSelectionEnd(): Position;
    getSelectionRect(): SVGElement | null;
    getJustFinishedSelecting(): boolean;
    getIsMultiDragging(): boolean;
    getMultiDragStartPositions(): Map<string, Position>;
    getMultiDragOffset(): Position;
    getContextMenu(): HTMLElement | null;

    // Setters
    setActiveTab(tab: string): void;
    setPreprocComponents(components: VrmComponent[]): void;
    setPostprocComponents(components: VrmComponent[]): void;
    setSelectedComponents(components: Set<string>): void;
    setIsDragging(dragging: boolean): void;
    setIsSelecting(selecting: boolean): void;
    setIsContextMenuOpen(open: boolean): void;
    setContextMenuPosition(pos: Position): void;
    setDragComponent(component: VrmComponent | null): void;
    setDragOffset(offset: Position): void;
    setDragStartPos(pos: Position): void;
    setSelectionStart(start: Position): void;
    setSelectionEnd(end: Position): void;
    setSelectionRect(rect: SVGElement | null): void;
    setJustFinishedSelecting(finished: boolean): void;
    setIsMultiDragging(dragging: boolean): void;
    setMultiDragOffset(offset: Position): void;
    setContextMenu(menu: HTMLElement | null): void;

    // Utility methods
    snapToGrid(x: number, y: number): Position;
    getComponentColor(type: string): string;
    switchTab(tabName: string): void;
    updateComponentCounts(): void;
    zoomIn(): void;
    zoomOut(): void;
    resetZoom(): void;
}

// Selection Manager interface
export interface ISelectionManager {
    selectComponentsBelow(point: Position): void;
    selectComponentsAbove(point: Position): void;
    selectComponentsInRow(point: Position): void;
    selectComponentsInColumn(point: Position): void;
    selectAllComponents(): void;
    updateSelectionDetails(): void;
    clearSelection(): void;
    restoreSelectionStates(): void;
    startSelection(e: MouseEvent): void;
    updateSelection(e: MouseEvent): void;
    endSelection(e: MouseEvent): void;
}

// Rendering Manager interface
export interface IRenderingManager {
    renderComponents(components: VrmComponent[]): void;
    renderComponentSection(components: VrmComponent[], canvasId: string): void;
    renderComponent(component: VrmComponent, canvasId: string): void;
    renderConnection(fromComponent: VrmComponent, toComponent: VrmComponent, isPrimary: boolean, canvasId: string): void;
    addCanvasEventHandlers(canvas: Element): void;
}

// Drag Drop Manager interface
export interface IDragDropManager {
    startDrag(e: MouseEvent, component: VrmComponent, groupElement: Element): void;
    startMultiDrag(e: MouseEvent, clickedComponent: VrmComponent): void;
}

// Component Editor interface
export interface IComponentEditor {
    showComponentDetails(component: VrmComponent): void;
    showMultiSelectionDetails(): void;
    showComponentEditor(component: VrmComponent): void;
    closeComponentEditor(): void;
    addParameter(): void;
    removeParameter(index: number): void;
    saveComponentChanges(componentId: number): void;
}

// Context Menu Manager interface
export interface IContextMenuManager {
    showContextMenu(x: number, y: number): void;
    closeContextMenu(): void;
    handleRightClick(e: MouseEvent): boolean;
    showTemporaryMessage(message: string): void;
}

// Connection Manager interface
export interface IConnectionManager {
    handleShiftClick(e: MouseEvent, targetComponent: VrmComponent): void;
    handleShiftRightClick(e: MouseEvent, targetComponent: VrmComponent): void;
    showConnectionMenu(component: VrmComponent, x: number, y: number): void;
}

// Keyboard Manager interface
export interface IKeyboardManager {
    handleKeyDown(e: KeyboardEvent): void;
    initializeKeyboardHandlers(): void;
    initializeGlobalClickHandler(): void;
    initializeDragPrevention(): void;
}

// Properly typed window interface
export interface CustomWindow extends Window {
    stateManager: IStateManager;
    renderingManager: IRenderingManager;
    selectionManager: ISelectionManager;
    dragDropManager: IDragDropManager;
    componentEditor: IComponentEditor;
    contextMenuManager: IContextMenuManager;
    connectionManager: IConnectionManager;
    keyboardManager: IKeyboardManager;
    vscode?: VsCodeApi;
    acquireVsCodeApi?: () => VsCodeApi;
    
    // Global functions exposed to HTML
    zoomIn?: () => void;
    zoomOut?: () => void;
    resetZoom?: () => void;
    switchTab?: (tabName: string) => void;
    renderComponents?: (components: VrmComponent[]) => void;
    clearSelection?: () => void;
    selectAllComponents?: () => void;
    startSelection?: (e: MouseEvent) => void;
    updateSelection?: (e: MouseEvent) => void;
    endSelection?: (e: MouseEvent) => void;
    handleKeyDown?: (e: KeyboardEvent) => void;
    startDrag?: (e: MouseEvent, component: VrmComponent, groupElement: Element) => void;
    startMultiDrag?: (e: MouseEvent, clickedComponent: VrmComponent) => void;
    handleRightClick?: (e: MouseEvent) => boolean;
    showTemporaryMessage?: (message: string) => void;
    handleShiftClick?: (e: MouseEvent, targetComponent: VrmComponent) => void;
    handleShiftRightClick?: (e: MouseEvent, targetComponent: VrmComponent) => void;
    showConnectionMenu?: (component: VrmComponent, x: number, y: number) => void;
    closeComponentEditor?: () => void;
    addParameter?: () => void;
    removeParameter?: (index: number) => void;
    saveComponentChanges?: (componentId: number) => void;
    
    // Temporary storage
    currentEditingComponent?: VrmComponent;
}