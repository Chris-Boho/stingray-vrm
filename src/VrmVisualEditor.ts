import * as vscode from 'vscode';

export interface VrmComponent {
    n: number;           // Component number/ID
    t: string;           // Component type (IF, SELECTQUERY, etc.)
    values?: any;        // Component-specific values
    j: number[];         // Jump/connection targets
    x: number;           // X coordinate
    y: number;           // Y coordinate
    c: string;           // Comment/description
    wp: boolean;         // Watchpoint flag
    section: 'preproc' | 'postproc'; // New field to track component section
}

export class VrmVisualEditor {
    private preprocComponents: VrmComponent[] = [];
    private postprocComponents: VrmComponent[] = [];
    private webview: vscode.Webview;

    constructor(webview: vscode.Webview) {
        this.webview = webview;
    }

    public parseComponents(xmlContent: string): VrmComponent[] {
        // Parse preproc and postproc sections separately
        const preprocMatch = xmlContent.match(/<preproc>([\s\S]*?)<\/preproc>/);
        const postprocMatch = xmlContent.match(/<postproc>([\s\S]*?)<\/postproc>/);

        this.preprocComponents = [];
        this.postprocComponents = [];

        if (preprocMatch) {
            this.preprocComponents = this.parseComponentSection(preprocMatch[1], 'preproc');
        }

        if (postprocMatch) {
            this.postprocComponents = this.parseComponentSection(postprocMatch[1], 'postproc');
        }

        // Return combined list for backward compatibility
        return [...this.preprocComponents, ...this.postprocComponents];
    }

    public parseComponentSection(sectionContent: string, sectionType: 'preproc' | 'postproc'): VrmComponent[] {
        const components: VrmComponent[] = [];

        const componentXmls = this.extractComponents(sectionContent);

        componentXmls.forEach((componentXml) => {
            try {
                const component = this.parseComponent(componentXml);
                if (component) {
                    component.section = sectionType; // Mark the section
                    components.push(component);
                }
            } catch (error) {
                console.error('Error parsing component:', error);
            }
        });

        return components;
    }

    private extractComponents(xmlContent: string): string[] {
        const components: string[] = [];

        // Simple approach: split by component boundaries
        const componentPattern = /<c>[\s\S]*?<\/c>/g;
        let match;

        while ((match = componentPattern.exec(xmlContent)) !== null) {
            let componentXml = match[0];

            // Check if this component has nested <c> tags (comment tags)
            // If it has a comment pattern <y>number</y> followed by <c>comment</c> followed by <wp>
            const hasCommentPattern = /<y>\d+<\/y>\s*<c>[^<]*<\/c>\s*<wp>/.test(componentXml);

            if (!hasCommentPattern) {
                // This might be a component that got cut off at the comment tag
                // Try to extend it to include the wp tag
                const afterMatch = xmlContent.substring(componentPattern.lastIndex);
                const wpMatch = afterMatch.match(/^\s*<wp>\d+<\/wp>\s*<\/c>/);
                if (wpMatch) {
                    componentXml += wpMatch[0];
                    // Update the lastIndex to skip the extended part
                    componentPattern.lastIndex += wpMatch[0].length;
                }
            }
            components.push(componentXml);
        }

        return components;
    }

    private parseComponent(componentXml: string): VrmComponent | null {
        try {
            // Extract basic component data directly from the full XML
            const nMatch = componentXml.match(/<n>(\d+)<\/n>/);
            const tMatch = componentXml.match(/<t>([^<]+)<\/t>/);
            const xMatch = componentXml.match(/<x>(\d+)<\/x>/);
            const yMatch = componentXml.match(/<y>(\d+)<\/y>/);
            const wpMatch = componentXml.match(/<wp>([01])<\/wp>/);

            // Extract comment (look for <c>content</c> that comes after <y> and before <wp>)
            let comment = '';
            const commentPattern = /<y>\d+<\/y>\s*<c>([^<]*)<\/c>\s*<wp>/;
            const commentMatch = componentXml.match(commentPattern);

            if (commentMatch) {
                comment = commentMatch[1].trim();
            }

            // Extract jump connections
            const jMatches = componentXml.match(/<j>(\d*)<\/j>/g);
            const jumps: number[] = [];
            if (jMatches) {
                jMatches.forEach(jMatch => {
                    const jValue = jMatch.match(/<j>(\d*)<\/j>/);
                    if (jValue && jValue[1] !== '') {
                        jumps.push(parseInt(jValue[1]));
                    }
                });
            }

            // Extract values section
            let values = null;
            const valuesMatch = componentXml.match(/<values>([\s\S]*?)<\/values>/);
            if (valuesMatch) {
                values = this.parseValues(valuesMatch[1]);
            }

            if (!nMatch || !tMatch || !xMatch || !yMatch) {
                return null;
            }

            return {
                n: parseInt(nMatch[1]),
                t: tMatch[1],
                values: values,
                j: jumps,
                x: parseInt(xMatch[1]),
                y: parseInt(yMatch[1]),
                c: comment,
                wp: wpMatch ? wpMatch[1] === '1' : false,
                section: 'preproc' // Will be overridden by caller
            };
        } catch (error) {
            console.error('Error parsing component XML:', error);
            return null;
        }
    }

    private parseValues(valuesContent: string): any {
        // Parse different types of values (this can be expanded)
        const result: any = {};

        // Parse <v> tags with CDATA
        const vMatches = valuesContent.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/g);
        if (vMatches) {
            result.conditions = vMatches.map(vMatch => {
                const cdataMatch = vMatch.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);
                return cdataMatch ? cdataMatch[1] : '';
            });
        }

        // Parse query tags
        const queryMatch = valuesContent.match(/<query><!\[CDATA\[([\s\S]*?)\]\]><\/query>/);
        if (queryMatch) {
            result.query = queryMatch[1];
        }

        // Parse param tags
        const paramMatches = valuesContent.match(/<param>[\s\S]*?<\/param>/g);
        if (paramMatches) {
            result.params = paramMatches.map(paramXml => {
                const nameMatch = paramXml.match(/<n>([^<]+)<\/n>/);
                const typeMatch = paramXml.match(/<t>([^<]+)<\/t>/);
                const valueMatch = paramXml.match(/<v><!\[CDATA\[([\s\S]*?)\]\]><\/v>/);

                return {
                    name: nameMatch ? nameMatch[1] : '',
                    type: typeMatch ? typeMatch[1] : '',
                    value: valueMatch ? valueMatch[1] : ''
                };
            });
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    public generateVisualEditorHtml(): string {
        return `
            <div class="visual-editor">
                <div class="editor-toolbar">
                    <button class="toolbar-btn" onclick="zoomIn()">Zoom In</button>
                    <button class="toolbar-btn" onclick="zoomOut()">Zoom Out</button>
                    <button class="toolbar-btn" onclick="resetZoom()">Reset Zoom</button>
                </div>
                
                <div class="section-tabs">
                    <button class="tab-btn active" onclick="switchTab('preproc')" id="preprocTab">
                        Preprocessing (<span id="preprocCount">0</span>)
                    </button>
                    <button class="tab-btn" onclick="switchTab('postproc')" id="postprocTab">
                        Postprocessing (<span id="postprocCount">0</span>)
                    </button>
                </div>
                
                <div class="canvas-container">
                    <div class="section-content active" id="preprocSection">
                        <div class="section-header">
                            <h3>Preprocessing Components</h3>
                            <p>Components that run before the main processing logic</p>
                        </div>
                        <div class="canvas-wrapper">
                            <svg id="preprocCanvas" class="component-canvas" width="1200" height="2000">
                                <!-- Preproc components will be rendered here -->
                            </svg>
                        </div>
                    </div>
                    
                    <div class="section-content" id="postprocSection">
                        <div class="section-header">
                            <h3>Postprocessing Components</h3>
                            <p>Components that run after the main processing logic</p>
                        </div>
                        <div class="canvas-wrapper">
                            <svg id="postprocCanvas" class="component-canvas" width="1200" height="2000">
                                <!-- Postproc components will be rendered here -->
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div class="component-details" id="componentDetails" style="display: none;">
                    <h3>Component Details</h3>
                    <div id="detailsContent"></div>
                </div>
            </div>

            <style>
                .visual-editor {
                    margin-top: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    background: var(--vscode-editor-background);
                }
                
                .editor-toolbar {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    background: var(--vscode-editor-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    align-items: center;
                }
                
                .toolbar-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .toolbar-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .section-tabs {
                    display: flex;
                    background: var(--vscode-tab-unfocusedActiveBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .tab-btn {
                    background: var(--vscode-tab-inactiveBackground);
                    color: var(--vscode-tab-inactiveForeground);
                    border: none;
                    padding: 12px 20px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    border-right: 1px solid var(--vscode-panel-border);
                    transition: all 0.2s ease;
                }
                
                .tab-btn:hover {
                    background: var(--vscode-tab-unfocusedActiveBackground);
                    color: var(--vscode-tab-activeForeground);
                }
                
                .tab-btn.active {
                    background: var(--vscode-tab-activeBackground);
                    color: var(--vscode-tab-activeForeground);
                    border-bottom: 2px solid var(--vscode-focusBorder);
                }
                
                .canvas-container {
                    position: relative;
                    background: var(--vscode-editor-background);
                    height: 800px;
                    overflow: hidden;
                }
                
                .section-content {
                    display: none;
                    height: 100%;
                }
                
                .section-content.active {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .section-header {
                    padding: 15px 20px;
                    background: var(--vscode-sideBar-background);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    flex-shrink: 0;
                }
                
                .section-header h3 {
                    margin: 0 0 5px 0;
                    color: var(--vscode-foreground);
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .section-header p {
                    margin: 0;
                    color: var(--vscode-descriptionForeground);
                    font-size: 13px;
                }
                
                .canvas-wrapper {
                    flex: 1;
                    overflow: auto;
                    position: relative;
                    background: var(--vscode-editor-background);
                }
                
                .component-canvas {
                    background: var(--vscode-editor-background);
                    cursor: default;
                    min-width: 1200px;
                    min-height: 2000px;
                    position: relative;
                    background-image: 
                        radial-gradient(circle, var(--vscode-panel-border) 1px, transparent 1px);
                    background-size: 32px 27px;
                    background-position: 0 0;
                }
                
                .canvas-wrapper::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }
                
                .canvas-wrapper::-webkit-scrollbar-track {
                    background: var(--vscode-scrollbar-shadow);
                }
                
                .canvas-wrapper::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-background);
                    border-radius: 6px;
                }
                
                .canvas-wrapper::-webkit-scrollbar-thumb:hover {
                    background: var(--vscode-scrollbarSlider-hoverBackground);
                }
                
                .canvas-wrapper::-webkit-scrollbar-corner {
                    background: var(--vscode-scrollbar-shadow);
                }
                
                .component-node {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .component-node:hover {
                    filter: brightness(1.1);
                }
                
                .component-node.dragging {
                    cursor: grabbing;
                    opacity: 0.8;
                    filter: brightness(1.2);
                }
                
                .component-node.selected {
                    filter: brightness(1.3);
                     outline: 2px solid var(--vscode-focusBorder);
                    outline-offset: 2px;
                }
                
                .component-rect {
                    stroke: var(--vscode-panel-border);
                    stroke-width: 2;
                    rx: 6;
                }
                
                .component-text {
                    fill: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: 12px;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                }
                
                .component-icon-text {
                    fill: white;
                    font-family: var(--vscode-font-family);
                    font-size: 10px;
                    font-weight: bold;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none;
                }
                
                .component-label {
                    fill: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: 13px;
                    dominant-baseline: middle;
                    pointer-events: none;
                }
                
                .component-comment {
                    fill: var(--vscode-descriptionForeground);
                    font-family: var(--vscode-font-family);
                    font-size: 10px;
                    text-anchor: middle;
                    pointer-events: none;
                }
                
                .connection-line {
                    stroke-width: 3;
                    fill: none;
                    marker-end: url(#arrowhead);
                }
                
                .primary-connection {
                    stroke: #4FC3F7;
                }
                
                .secondary-connection {
                    stroke: #666;
                }
                
                .watchpoint-indicator {
                    fill: #FF5722;
                    stroke: #FF5722;
                    stroke-width: 1;
                }
                
                .component-editor-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: var(--vscode-foreground);
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--vscode-foreground);
                }
                
                .modal-body {
                    padding: 20px;
                }
                
                .modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid var(--vscode-panel-border);
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: var(--vscode-foreground);
                }
                
                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 3px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: var(--vscode-font-family);
                }
                
                .form-group input[type="checkbox"] {
                    width: auto;
                }
                
                .parameter-row {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                    align-items: center;
                }
                
                .parameter-row input {
                    flex: 1;
                }
                
                .parameter-row select {
                    flex: 0 0 120px;
                }
                
                .parameter-row button {
                    flex: 0 0 80px;
                    padding: 6px 12px;
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                
                .modal-footer button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                
                .modal-footer button:first-child {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .modal-footer button:last-child {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .component-details {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 300px;
                    padding: 15px;
                    background: var(--vscode-sideBar-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    z-index: 100;
                }
                
                .detail-row {
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                
                .detail-label {
                    font-weight: 500;
                    color: var(--vscode-descriptionForeground);
                }
                
                .detail-value {
                    color: var(--vscode-foreground);
                    margin-left: 8px;
                }
            </style>

            <script>
                let currentZoom = 1;
                let activeTab = 'preproc';
                let preprocComponents = [];
                let postprocComponents = [];
                
                // Drag and drop state
                let isDragging = false;
                let dragComponent = null;
                let dragOffset = { x: 0, y: 0 };
                let dragStartPos = { x: 0, y: 0 };
                
                // Grid settings
                const GRID_SIZE_X = 32; // Horizontal grid spacing
                const GRID_SIZE_Y = 26; // Vertical grid spacing
                
                function snapToGrid(x, y) {
                    return {
                        x: Math.round(x / GRID_SIZE_X) * GRID_SIZE_X,
                        y: Math.round(y / GRID_SIZE_Y) * GRID_SIZE_Y
                    };
                }
                
                function getComponentColor(type) {
                    const colors = {
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
                
                function switchTab(tabName) {
                    // Update tab buttons
                    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                    document.getElementById(tabName + 'Tab').classList.add('active');
                    
                    // Update section content
                    document.querySelectorAll('.section-content').forEach(section => section.classList.remove('active'));
                    document.getElementById(tabName + 'Section').classList.add('active');
                    
                    activeTab = tabName;
                    
                    // Hide details panel when switching tabs
                    document.getElementById('componentDetails').style.display = 'none';
                    
                    // Remove selected class from all components when switching tabs
                    document.querySelectorAll('.component-node').forEach(node => {
                        node.classList.remove('selected');
                    });
                }
                
                function updateComponentCounts() {
                    document.getElementById('preprocCount').textContent = preprocComponents.length;
                    document.getElementById('postprocCount').textContent = postprocComponents.length;
                }
                
                function renderComponents(components) {
                    // Separate components by section
                    preprocComponents = components.filter(c => c.section === 'preproc');
                    postprocComponents = components.filter(c => c.section === 'postproc');
                    
                    updateComponentCounts();
                    
                    // Render each section
                    renderComponentSection(preprocComponents, 'preprocCanvas');
                    renderComponentSection(postprocComponents, 'postprocCanvas');
                }
                
                function renderComponentSection(components, canvasId) {
                    const canvas = document.getElementById(canvasId);
                    canvas.innerHTML = '';
                    
                    // Add arrow marker definition
                    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                    defs.innerHTML = \`
                        <marker id="arrowhead-\${canvasId}" markerWidth="10" markerHeight="7" 
                                refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4FC3F7" />
                        </marker>
                        <marker id="arrowhead-secondary-\${canvasId}" markerWidth="10" markerHeight="7" 
                                refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                        </marker>
                    \`;
                    canvas.appendChild(defs);
                    
                    // Render connections first (so they appear behind nodes)
                    components.forEach(component => {
                        component.j.forEach((targetId, index) => {
                            if (targetId > 0) {
                                const targetComponent = components.find(c => c.n === targetId);
                                if (targetComponent) {
                                    renderConnection(component, targetComponent, index === 0, canvasId);
                                }
                            }
                        });
                    });
                    
                    // Render components
                    components.forEach(component => {
                        renderComponent(component, canvasId);
                    });
                }
                
                function renderComponent(component, canvasId) {
                    const canvas = document.getElementById(canvasId);
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.classList.add('component-node');
                    group.setAttribute('data-component-id', component.n);
                    group.setAttribute('data-section', component.section);
                    
                    const color = getComponentColor(component.t);
                    const iconSize = 30;
                    const textOffset = iconSize + 10;
                    
                    // Component icon
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', component.x);
                    rect.setAttribute('y', component.y);
                    rect.setAttribute('width', iconSize);
                    rect.setAttribute('height', iconSize);
                    rect.setAttribute('fill', color);
                    rect.classList.add('component-rect');
                    
                    // Component type text (inside icon)
                    const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    typeText.setAttribute('x', component.x + iconSize/2);
                    typeText.setAttribute('y', component.y + iconSize/2);
                    typeText.classList.add('component-icon-text');
                    typeText.textContent = component.t.substring(0, 2);
                    
                    // Component number and comment
                    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    labelText.setAttribute('x', component.x + textOffset);
                    labelText.setAttribute('y', component.y + iconSize/2 + 2);
                    labelText.classList.add('component-label');
                    
                    const commentText = component.c || 'No comment';
                    labelText.textContent = \`\${component.n}: \${commentText}\`;
                    
                    // Watchpoint indicator
                    if (component.wp) {
                        const watchpoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        watchpoint.setAttribute('cx', component.x + iconSize - 4);
                        watchpoint.setAttribute('cy', component.y + 4);
                        watchpoint.setAttribute('r', 3);
                        watchpoint.classList.add('watchpoint-indicator');
                        group.appendChild(watchpoint);
                    }
                    
                    group.appendChild(rect);
                    group.appendChild(typeText);
                    group.appendChild(labelText);
                    
                    // Add drag and drop event handlers
                    group.addEventListener('mousedown', (e) => {
                        if (e.button === 0) { // Left mouse button
                            startDrag(e, component, group);
                        }
                    });
                    
                    // Add click and double-click handlers
                    group.addEventListener('click', (e) => {
                        if (!isDragging) {
                            e.stopPropagation();
                            
                            // Remove selected class from all components
                            document.querySelectorAll('.component-node').forEach(node => {
                                node.classList.remove('selected');
                            });
                            
                            // Add selected class to this component
                            group.classList.add('selected');
                            
                            showComponentDetails(component);
                        }
                    });
                    
                    group.addEventListener('dblclick', (e) => {
                        if (!isDragging) {
                            e.stopPropagation();
                            showComponentEditor(component);
                        }
                    });
                    
                    canvas.appendChild(group);
                }
                
                function startDrag(e, component, groupElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    isDragging = true;
                    dragComponent = component;
                    
                    // Get the SVG canvas for coordinate transformation
                    const canvas = document.getElementById(component.section + 'Canvas');
                    const rect = canvas.getBoundingClientRect();
                    
                    // Calculate offset from mouse to component position
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    dragOffset.x = mouseX - component.x;
                    dragOffset.y = mouseY - component.y;
                    dragStartPos.x = component.x;
                    dragStartPos.y = component.y;
                    
                    // Add visual feedback
                    groupElement.classList.add('dragging');
                    
                    // Remove selected class from all components during drag
                    document.querySelectorAll('.component-node').forEach(node => {
                        if (node !== groupElement) {
                            node.classList.remove('selected');
                        }
                    });
                    
                    // Add global mouse handlers
                    document.addEventListener('mousemove', handleDrag);
                    document.addEventListener('mouseup', endDrag);
                    
                    // Hide details panel during drag
                    document.getElementById('componentDetails').style.display = 'none';
                }
                
                function handleDrag(e) {
                    if (!isDragging || !dragComponent) return;
                    
                    e.preventDefault();
                    
                    const canvas = document.getElementById(dragComponent.section + 'Canvas');
                    const rect = canvas.getBoundingClientRect();
                    
                    // Calculate new position
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    let newX = mouseX - dragOffset.x;
                    let newY = mouseY - dragOffset.y;
                    
                    // Snap to grid with different X and Y spacing
                    const snapped = snapToGrid(newX, newY);
                    newX = snapped.x;
                    newY = snapped.y;
                    
                    // Ensure component stays within canvas bounds
                    const iconSize = 30;
                    const canvasWidth = parseInt(canvas.getAttribute('width'));
                    const canvasHeight = parseInt(canvas.getAttribute('height'));
                    
                    newX = Math.max(0, Math.min(newX, canvasWidth - iconSize));
                    newY = Math.max(0, Math.min(newY, canvasHeight - iconSize));
                    
                    // Update component position
                    dragComponent.x = newX;
                    dragComponent.y = newY;
                    
                    // Re-render the section to update visuals
                    const components = dragComponent.section === 'preproc' ? preprocComponents : postprocComponents;
                    renderComponentSection(components, dragComponent.section + 'Canvas');
                }
                
                function endDrag(e) {
                    if (!isDragging || !dragComponent) return;
                    
                    e.preventDefault();
                    
                    // Check if component actually moved
                    const moved = dragComponent.x !== dragStartPos.x || dragComponent.y !== dragStartPos.y;
                    
                    if (moved) {
                        // Send update to extension
                        vscode.postMessage({
                            command: 'updateComponent',
                            component: dragComponent
                        });
                    }
                    
                    // Clean up
                    document.removeEventListener('mousemove', handleDrag);
                    document.removeEventListener('mouseup', endDrag);
                    
                    // Remove visual feedback
                    const groupElement = document.querySelector(\`[data-component-id="\${dragComponent.n}"][data-section="\${dragComponent.section}"]\`);
                    if (groupElement) {
                        groupElement.classList.remove('dragging');
                    }
                    
                    isDragging = false;
                    dragComponent = null;
                    dragOffset = { x: 0, y: 0 };
                    dragStartPos = { x: 0, y: 0 };
                }
                
                function renderConnection(fromComponent, toComponent, isPrimary, canvasId) {
                    const canvas = document.getElementById(canvasId);
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    
                    const iconSize = 32;
                    const handleOffset = 20;
                    const verticalBuffer = 15; // Distance for clean vertical entry/exit
                    
                    // Check for handlebar case (same X axis and close vertically)
                    const sameXAxis = fromComponent.x === toComponent.x;
                    const verticalDistance = Math.abs(fromComponent.y - toComponent.y);
                    const useHandlebars = sameXAxis && verticalDistance <= 30;
                    
                    let pathData;
                    
                    if (useHandlebars) {
                        // Handlebar routing for vertically aligned close components
                        const startX = fromComponent.x;
                        const startY = fromComponent.y + iconSize/2;
                        const endX = toComponent.x;
                        const endY = toComponent.y + iconSize/2;
                        const leftOffset = fromComponent.x - handleOffset;
                        
                        pathData = \`M \${startX} \${startY} L \${leftOffset} \${startY} L \${leftOffset} \${endY} L \${endX} \${endY}\`;
                        
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
                                pathData = \`M \${startX} \${startY} L \${startX} \${endY}\`;
                            } else {
                                // Target above source - go around
                                const loopX = startX - 30; // Go left to avoid overlap
                                pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${loopX} \${exitY} L \${loopX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                            }
                        } else {
                            // Different columns - use waypoints
                            
                            // Check for special case: if component Y distance is 52-56px, use direct horizontal connection
                            const componentVerticalDistance = Math.abs(toComponent.y - fromComponent.y);
                            const isOptimalSpacing = componentVerticalDistance >= 50 && componentVerticalDistance <= 60;
                            
                            
                            if (isOptimalSpacing) {
                                // Direct straight horizontal connection at exit level
                                pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${endX} \${exitY} L \${endX} \${endY}\`;
                            } else if (endY > exitY) {
                                // Target is below exit level - standard routing
                                pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${midX} \${exitY} L \${midX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                            } else {
                                // Target is above exit level - use horizontal routing at exit level
                                pathData = \`M \${startX} \${startY} L \${startX} \${exitY} L \${midX} \${exitY} L \${midX} \${entryY} L \${endX} \${entryY} L \${endX} \${endY}\`;
                            }
                        }
                    }
                    
                    line.setAttribute('d', pathData);
                    line.classList.add('connection-line');
                    line.classList.add(isPrimary ? 'primary-connection' : 'secondary-connection');
                    line.setAttribute('marker-end', 
                        isPrimary ? \`url(#arrowhead-\${canvasId})\` : \`url(#arrowhead-secondary-\${canvasId})\`);
                    
                    canvas.appendChild(line);
                }
                
                function showComponentDetails(component) {
                    const detailsPanel = document.getElementById('componentDetails');
                    const detailsContent = document.getElementById('detailsContent');
                    
                    let html = \`
                        <div class="detail-row">
                            <span class="detail-label">Section:</span>
                            <span class="detail-value">\${component.section.toUpperCase()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">\${component.n}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">\${component.t}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Position:</span>
                            <span class="detail-value">(\${component.x}, \${component.y})</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Comment:</span>
                            <span class="detail-value">\${component.c || 'None'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Watchpoint:</span>
                            <span class="detail-value">\${component.wp ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Connections:</span>
                            <span class="detail-value">\${component.j.filter(j => j > 0).join(', ') || 'None'}</span>
                        </div>
                    \`;
                    
                    if (component.values) {
                        html += '<div class="detail-row"><span class="detail-label">Values:</span></div>';
                        if (component.values.conditions) {
                            html += \`<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">\${component.values.conditions[0]}</div>\`;
                        }
                        if (component.values.query) {
                            html += \`<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Query: \${component.values.query.substring(0, 50)}...</div>\`;
                        }
                        if (component.values.params && component.values.params.length > 0) {
                            html += '<div style="margin-left: 15px; font-size: 11px; color: var(--vscode-descriptionForeground);">Parameters:</div>';
                            component.values.params.forEach(param => {
                                html += \`<div style="margin-left: 25px; font-size: 10px; color: var(--vscode-descriptionForeground);">\${param.name} (\${param.type})</div>\`;
                            });
                        }
                    }
                    
                    html += '<div style="margin-top: 10px;"><small>Double-click component to edit</small></div>';
                    
                    detailsContent.innerHTML = html;
                    detailsPanel.style.display = 'block';
                }
                
                function showComponentEditor(component) {
                    // Create modal editor
                    const modal = document.createElement('div');
                    modal.className = 'component-editor-modal';
                    modal.innerHTML = \`
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Edit Component #\${component.n} (\${component.t}) - \${component.section.toUpperCase()}</h3>
                                <button class="close-btn" onclick="closeComponentEditor()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label>Comment:</label>
                                    <input type="text" id="editComment" value="\${component.c || ''}" />
                                </div>
                                
                                <div class="form-group">
                                    <label>Watchpoint:</label>
                                    <input type="checkbox" id="editWatchpoint" \${component.wp ? 'checked' : ''} />
                                </div>
                                
                                \${component.values && component.values.conditions ? \`
                                    <div class="form-group">
                                        <label>Condition:</label>
                                        <textarea id="editCondition" rows="3">\${component.values.conditions[0] || ''}</textarea>
                                    </div>
                                \` : ''}
                                
                                \${component.values && component.values.query ? \`
                                    <div class="form-group">
                                        <label>SQL Query:</label>
                                        <textarea id="editQuery" rows="5">\${component.values.query || ''}</textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Parameters:</label>
                                        <div id="parametersContainer">
                                            \${component.values.params ? component.values.params.map((param, index) => \`
                                                <div class="parameter-row">
                                                    <input type="text" placeholder="Name" value="\${param.name}" data-param-index="\${index}" data-param-field="name" />
                                                    <select data-param-index="\${index}" data-param-field="type">
                                                        <option value="STRING" \${param.type === 'STRING' ? 'selected' : ''}>STRING</option>
                                                        <option value="INTEGER" \${param.type === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
                                                        <option value="BOOLEAN" \${param.type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                                                        <option value="DECIMAL" \${param.type === 'DECIMAL' ? 'selected' : ''}>DECIMAL</option>
                                                    </select>
                                                    <input type="text" placeholder="Value" value="\${param.value}" data-param-index="\${index}" data-param-field="value" />
                                                    <button onclick="removeParameter(\${index})">Remove</button>
                                                </div>
                                            \`).join('') : ''}
                                        </div>
                                        <button onclick="addParameter()">Add Parameter</button>
                                    </div>
                                \` : ''}
                            </div>
                            <div class="modal-footer">
                                <button onclick="saveComponentChanges(\${component.n})">Save Changes</button>
                                <button onclick="closeComponentEditor()">Cancel</button>
                            </div>
                        </div>
                    \`;
                    
                    document.body.appendChild(modal);
                    
                    // Store current component for editing
                    window.currentEditingComponent = component;
                }
                
                function closeComponentEditor() {
                    const modal = document.querySelector('.component-editor-modal');
                    if (modal) {
                        modal.remove();
                    }
                    window.currentEditingComponent = null;
                }
                
                function addParameter() {
                    const container = document.getElementById('parametersContainer');
                    const paramCount = container.children.length;
                    const paramRow = document.createElement('div');
                    paramRow.className = 'parameter-row';
                    paramRow.innerHTML = \`
                        <input type="text" placeholder="Name" data-param-index="\${paramCount}" data-param-field="name" />
                        <select data-param-index="\${paramCount}" data-param-field="type">
                            <option value="STRING">STRING</option>
                            <option value="INTEGER">INTEGER</option>
                            <option value="BOOLEAN">BOOLEAN</option>
                            <option value="DECIMAL">DECIMAL</option>
                        </select>
                        <input type="text" placeholder="Value" data-param-index="\${paramCount}" data-param-field="value" />
                        <button onclick="removeParameter(\${paramCount})">Remove</button>
                    \`;
                    container.appendChild(paramRow);
                }
                
                function removeParameter(index) {
                    const container = document.getElementById('parametersContainer');
                    const rows = container.querySelectorAll('.parameter-row');
                    if (rows[index]) {
                        rows[index].remove();
                    }
                }
                
                function saveComponentChanges(componentId) {
                    const component = window.currentEditingComponent;
                    if (!component) return;
                    
                    // Gather form data
                    const updatedComponent = {
                        ...component,
                        c: document.getElementById('editComment').value,
                        wp: document.getElementById('editWatchpoint').checked
                    };
                    
                    // Update condition if exists
                    const conditionInput = document.getElementById('editCondition');
                    if (conditionInput && updatedComponent.values) {
                        updatedComponent.values.conditions = [conditionInput.value];
                    }
                    
                    // Update query if exists
                    const queryInput = document.getElementById('editQuery');
                    if (queryInput && updatedComponent.values) {
                        updatedComponent.values.query = queryInput.value;
                    }
                    
                    // Update parameters if they exist
                    const paramInputs = document.querySelectorAll('#parametersContainer .parameter-row');
                    if (paramInputs.length > 0 && updatedComponent.values) {
                        updatedComponent.values.params = Array.from(paramInputs).map(row => {
                            const nameInput = row.querySelector('[data-param-field="name"]');
                            const typeSelect = row.querySelector('[data-param-field="type"]');
                            const valueInput = row.querySelector('[data-param-field="value"]');
                            
                            return {
                                name: nameInput.value,
                                type: typeSelect.value,
                                value: valueInput.value
                            };
                        });
                    }
                    
                    // Send update to extension
                    vscode.postMessage({
                        command: 'updateComponent',
                        component: updatedComponent
                    });
                    
                    closeComponentEditor();
                }
                
                function zoomIn() {
                    currentZoom *= 1.2;
                    updateZoom();
                }
                
                function zoomOut() {
                    currentZoom /= 1.2;
                    updateZoom();
                }
                
                function resetZoom() {
                    currentZoom = 1;
                    updateZoom();
                }
                
                function updateZoom() {
                    const canvases = document.querySelectorAll('.component-canvas');
                    canvases.forEach(canvas => {
                        canvas.style.transform = \`scale(\${currentZoom})\`;
                        canvas.style.transformOrigin = '0 0';
                    });
                }
                
                // Prevent default drag behavior on canvas
                document.addEventListener('DOMContentLoaded', function() {
                    const canvases = document.querySelectorAll('.component-canvas');
                    canvases.forEach(canvas => {
                        canvas.addEventListener('dragstart', (e) => e.preventDefault());
                        canvas.addEventListener('selectstart', (e) => e.preventDefault());
                    });
                });
                
                // Close details panel when clicking outside
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.component-details') && !e.target.closest('.component-node')) {
                        document.getElementById('componentDetails').style.display = 'none';
                        
                        // Remove selected class from all components when clicking outside
                        document.querySelectorAll('.component-node').forEach(node => {
                            node.classList.remove('selected');
                        });
                    }
                });
            </script>
        `;
    }

    public updateWebview(components: VrmComponent[]): void {
        this.webview.postMessage({
            type: 'updateComponents',
            components: components
        });
    }
}