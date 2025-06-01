// types.ts - Centralized type definitions
import { VSCodeApiHandler } from './VSCodeApiHandler';
import { DocumentState } from './visual-editor/modules/DocumentState';

// VS Code API interface
export interface VsCodeApi {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

// Component interface (unified - removed duplicate)
export interface VrmComponent {
    n: number;           // Component number/ID
    t: string;           // Component type
    values?: ComponentValues;
    j: number[];         // Jump/connection targets [primary, secondary]
    x: number;           // X coordinate
    y: number;           // Y coordinate
    c: string;           // Comment/description
    wp: boolean | null;  // Watchpoint flag: true/false for set values, null for <wp/> (unset)
    section: 'preproc' | 'postproc';
}

// Position interfaces
export interface Position {
    x: number;
    y: number;
}

// =================================================================
// ENHANCED COMPONENT VALUES INTERFACE  
// =================================================================

export interface ComponentValues {
    // Common fields used by multiple component types
    conditions?: string[];  // Legacy IF conditions (keeping for backward compatibility)
    query?: string;        // INSERTUPDATEQUERY, SELECTQUERY
    params?: ComponentParameter[];  // INSERTUPDATEQUERY, SELECTQUERY parameters

    // Component-specific values based on your documentation

    // CSF (Script Function) Component - alternating n/v pairs
    functionName?: string;     // First n tag
    returnValue?: string;      // First v tag  
    functionParams?: CsfParameter[];  // Additional n/v pairs

    // SQLTRN (SQL Transaction) Component
    transactionName?: string;  // n tag (can be empty)
    transactionType?: string;  // t tag (Begin/Commit/Rollback)

    // MATH Component
    mathName?: string;         // n tag
    mathFormat?: string;       // f tag (INTEGER, LONGDATETIME, etc.)
    mathParam?: string;        // v tag

    // TEMPLATE Component  
    templateName?: string;     // n tag
    templateTarget?: string;   // t tag

    // SCRIPT Component
    script?: string;           // v tag content
    language?: string;         // lng tag (Pascal)

    // ERROR Component
    errorMessage?: string;     // v tag content

    // IF Component
    condition?: string;        // v tag content (single condition)

    // SET (Multi-Set) Component - multiple n/v pairs
    variables?: SetVariable[]; // Array of name/value pairs

    // EXTERNAL Component
    externalValue?: string;    // v tag (displayed as "Rule name" in UI)
}

// Parameter interfaces
export interface ComponentParameter {
    name: string;
    type: 'BOOLEAN' | 'CURRENCY' | 'DATETIME' | 'FLOAT' | 'INTEGER' | 'STRING' | 'SECURE';
    value: string;
}

export interface CsfParameter {
    label: string;    // n tag
    value: string;    // v tag
}

export interface SetVariable {
    name: string;     // n tag
    value: string;    // v tag
}

// Handler types for drag operations
export interface DragHandlers {
    handleDragBound: (event: MouseEvent) => void;
    endDragBound: (event: MouseEvent) => void;
}

export interface MultiDragHandlers {
    handleMultiDragBound: (event: MouseEvent) => void;
    endMultiDragBound: (event: MouseEvent) => void;
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
    getDragHandlers(): DragHandlers | null;
    getSelectionStart(): Position;
    getSelectionEnd(): Position;
    getSelectionRect(): SVGElement | null;
    getJustFinishedSelecting(): boolean;
    getIsMultiDragging(): boolean;
    getMultiDragStartPositions(): Map<string, Position>;
    getMultiDragOffset(): Position;
    getMultiDragReferenceComponent(): VrmComponent | null;
    getMultiDragHandlers(): MultiDragHandlers | null;
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
    setDragHandlers(handlers: DragHandlers | null): void;
    setSelectionStart(start: Position): void;
    setSelectionEnd(end: Position): void;
    setSelectionRect(rect: SVGElement | null): void;
    setJustFinishedSelecting(finished: boolean): void;
    setIsMultiDragging(dragging: boolean): void;
    setMultiDragOffset(offset: Position): void;
    setMultiDragReferenceComponent(component: VrmComponent | null): void;
    setMultiDragHandlers(handlers: MultiDragHandlers | null): void;
    setContextMenu(menu: HTMLElement | null): void;

    // Utility methods
    snapToGrid(x: number, y: number): Position;
    getComponentColor(type: string): string;
    updateComponentCounts(): void;
    zoomIn(): void;
    zoomOut(): void;
    resetZoom(): void;
    switchTab(tabName: string): void;

    // New method for component updates
    updateComponent(component: VrmComponent): void;
}

// Selection Manager interface
export interface ISelectionManager {
    startSelection(e: MouseEvent): void;
    updateSelection(e: MouseEvent): void;
    endSelection(e: MouseEvent): void;
    clearSelection(): void;
    selectAllComponents(): void;
    restoreSelectionStates(): void;
    getSelectedComponentCount(): number;
    isComponentSelected(componentKey: string): boolean;
    selectComponent(componentKey: string): void;
    deselectComponent(componentKey: string): void;
    isSelecting(): boolean;
    isDragging(): boolean;
    isMultiDragging(): boolean;
    selectComponentsBelow(point: Position): void;
    selectComponentsAbove(point: Position): void;
    selectComponentsInRow(point: Position): void;
    selectComponentsInColumn(point: Position): void;
    updateSelectionDetails(): void;
}

// Rendering Manager interface
export interface IRenderingManager {
    renderComponents(components: VrmComponent[]): void;
    renderComponentSection(components: VrmComponent[], canvasId: string): void;
    renderComponent(component: VrmComponent, canvasId: string): void;
    renderConnection(fromComponent: VrmComponent, toComponent: VrmComponent, isPrimary: boolean, canvasId: string): void;
    addCanvasEventHandlers(canvas: HTMLElement): void;
    calculateRequiredCanvasHeight(components: VrmComponent[]): number;
}

// Drag Drop Manager interface
export interface IDragDropManager {
    startDrag(e: MouseEvent, component: VrmComponent, groupElement: Element): void;
    startMultiDrag(e: MouseEvent, clickedComponent: VrmComponent): void;
}

// Component Editor interface - Fixed with all required methods
export interface IComponentEditor {
    showComponentDetails(component: VrmComponent): void;
    showMultiSelectionDetails(): void;
    showComponentEditor(component: VrmComponent): void;
    closeComponentEditor(): void;
    addParameter(): void;
    removeParameter(index: number): void;
    addCsfParameter(): void;
    removeCsfParameter(index: number): void;
    addSetVariable(): void;
    removeSetVariable(index: number): void;
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
    handleShiftClickOnEmpty(e: MouseEvent, connectionType: 'primary' | 'secondary'): void;
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
    documentState: DocumentState;
    vscode?: VsCodeApi;
    acquireVsCodeApi?: () => VsCodeApi;
    vsCodeApiHandler?: VSCodeApiHandler;

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
    handleShiftClickOnEmpty?: (e: MouseEvent, connectionType: 'primary' | 'secondary') => void;
    showConnectionMenu?: (component: VrmComponent, x: number, y: number) => void;
    closeComponentEditor?: () => void;
    addParameter?: () => void;
    removeParameter?: (index: number) => void;
    addCsfParameter?: () => void;
    removeCsfParameter?: (index: number) => void;
    addSetVariable?: () => void;
    removeSetVariable?: (index: number) => void;
    saveComponentChanges?: (componentId: number) => void;

    // Temporary storage
    currentEditingComponent?: VrmComponent | null;
}