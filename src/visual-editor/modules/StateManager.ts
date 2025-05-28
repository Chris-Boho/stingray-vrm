export class StateManager {
    // Global state variables
    private currentZoom: number = 1;
    private activeTab: string = 'preproc';
    private preprocComponents: any[] = [];
    private postprocComponents: any[] = [];
    
    // Drag and drop state
    private isDragging: boolean = false;
    private dragComponent: any = null;
    private dragOffset = { x: 0, y: 0 };
    private dragStartPos = { x: 0, y: 0 };
    private dragHandlers: any = null;
    
    // Multi-select state
    private isSelecting: boolean = false;
    private selectionStart = { x: 0, y: 0 };
    private selectionEnd = { x: 0, y: 0 };
    private selectedComponents: Set<string> = new Set();
    private selectionRect: any = null;
    private justFinishedSelecting: boolean = false;
    
    // Multi-drag state
    private isMultiDragging: boolean = false;
    private multiDragStartPositions: Map<string, any> = new Map();
    private multiDragOffset = { x: 0, y: 0 };
    private multiDragReferenceComponent: any = null;
    private multiDragHandlers: any = null;
    
    // Context menu state
    private contextMenu: any = null;
    private contextMenuPosition = { x: 0, y: 0 };
    private isContextMenuOpen: boolean = false;
    
    // Grid settings
    private readonly GRID_SIZE_X: number = 32; // Horizontal grid spacing
    private readonly GRID_SIZE_Y: number = 26; // Vertical grid spacing
    
    // =================================================================
    // GETTERS - Allow other classes to access state
    // =================================================================
    public getCurrentZoom(): number { return this.currentZoom; }
    public getActiveTab(): string { return this.activeTab; }
    public getPreprocComponents(): any[] { return this.preprocComponents; }
    public getPostprocComponents(): any[] { return this.postprocComponents; }
    public getSelectedComponents(): Set<string> { return this.selectedComponents; }
    public getIsDragging(): boolean { return this.isDragging; }
    public getIsSelecting(): boolean { return this.isSelecting; }
    public getIsContextMenuOpen(): boolean { return this.isContextMenuOpen; }
    public getContextMenuPosition(): any { return this.contextMenuPosition; }
    public getGridSizes(): { x: number, y: number } { return { x: this.GRID_SIZE_X, y: this.GRID_SIZE_Y }; }
    public getDragComponent(): any { return this.dragComponent; }
    public getDragOffset(): any { return this.dragOffset; }
    public getDragStartPos(): any { return this.dragStartPos; }
    public getDragHandlers(): any { return this.dragHandlers; }
    public getSelectionStart(): any { return this.selectionStart; }
    public getSelectionEnd(): any { return this.selectionEnd; }
    public getSelectionRect(): any { return this.selectionRect; }
    public getJustFinishedSelecting(): boolean { return this.justFinishedSelecting; }
    public getIsMultiDragging(): boolean { return this.isMultiDragging; }
    public getMultiDragStartPositions(): Map<string, any> { return this.multiDragStartPositions; }
    public getMultiDragOffset(): any { return this.multiDragOffset; }
    public getMultiDragReferenceComponent(): any { return this.multiDragReferenceComponent; }
    public getMultiDragHandlers(): any { return this.multiDragHandlers; }
    public getContextMenu(): any { return this.contextMenu; }
    
    // =================================================================
    // SETTERS - Allow other classes to modify state
    // =================================================================
    public setActiveTab(tab: string): void { this.activeTab = tab; }
    public setPreprocComponents(components: any[]): void { this.preprocComponents = components; }
    public setPostprocComponents(components: any[]): void { this.postprocComponents = components; }
    public setSelectedComponents(components: Set<string>): void { this.selectedComponents = components; }
    public setIsDragging(dragging: boolean): void { this.isDragging = dragging; }
    public setIsSelecting(selecting: boolean): void { this.isSelecting = selecting; }
    public setIsContextMenuOpen(open: boolean): void { this.isContextMenuOpen = open; }
    public setContextMenuPosition(pos: any): void { this.contextMenuPosition = pos; }
    public setDragComponent(component: any): void { this.dragComponent = component; }
    public setDragOffset(offset: any): void { this.dragOffset = offset; }
    public setDragStartPos(pos: any): void { this.dragStartPos = pos; }
    public setDragHandlers(handlers: any): void { this.dragHandlers = handlers; }
    public setSelectionStart(start: any): void { this.selectionStart = start; }
    public setSelectionEnd(end: any): void { this.selectionEnd = end; }
    public setSelectionRect(rect: any): void { this.selectionRect = rect; }
    public setJustFinishedSelecting(finished: boolean): void { this.justFinishedSelecting = finished; }
    public setIsMultiDragging(dragging: boolean): void { this.isMultiDragging = dragging; }
    public setMultiDragOffset(offset: any): void { this.multiDragOffset = offset; }
    public setMultiDragReferenceComponent(component: any): void { this.multiDragReferenceComponent = component; }
    public setMultiDragHandlers(handlers: any): void { this.multiDragHandlers = handlers; }
    public setContextMenu(menu: any): void { this.contextMenu = menu; }
    
    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================
    public snapToGrid(x: number, y: number): { x: number, y: number } {
        return {
            x: Math.round(x / this.GRID_SIZE_X) * this.GRID_SIZE_X,
            y: Math.round(y / this.GRID_SIZE_Y) * this.GRID_SIZE_Y
        };
    }
    
    public getComponentColor(type: string): string {
        const colors: Record<string, string> = {
            'IF': '#4CAF50',
            'SELECTQUERY': '#2196F3', 
            'INSERTUPDATEQUERY': '#FF9800',
            'SET': '#9C27B0',
            'TEMPLATE': '#795548',
            'ERROR': '#F44336',
            'EXTERNAL': '#607D8B',
            'CSF': '#3F51B5',
            'SCRIPT': '#FF5722'
        };
        return colors[type] || '#666666';
    }
    
    // =================================================================
    // PUBLIC METHODS - Called from HTML and other managers
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
        
        this.activeTab = tabName;
        
        // Hide details panel when switching tabs
        const details = document.getElementById('componentDetails');
        if (details) details.style.display = 'none';
        
        // Clear selection when switching tabs - call through window reference
        if ((window as any).selectionManager) {
            (window as any).selectionManager.clearSelection();
        }
    }
    
    public updateComponentCounts(): void {
        const preprocCount = document.getElementById('preprocCount');
        const postprocCount = document.getElementById('postprocCount');
        
        if (preprocCount) preprocCount.textContent = this.preprocComponents.length.toString();
        if (postprocCount) postprocCount.textContent = this.postprocComponents.length.toString();
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
    // INJECTION METHOD - Converts class to webview JavaScript
    // =================================================================
    public static inject(): string {
        return `
            // Inject StateManager class
            window.stateManager = new (${StateManager.toString()})();
            
            // Make functions globally available for HTML onclick handlers
            window.zoomIn = () => window.stateManager.zoomIn();
            window.zoomOut = () => window.stateManager.zoomOut();
            window.resetZoom = () => window.stateManager.resetZoom();
            window.switchTab = (tabName) => window.stateManager.switchTab(tabName);
        `;
    }
}