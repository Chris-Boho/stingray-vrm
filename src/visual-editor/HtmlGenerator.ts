import { getEditorStyles } from './styles/EditorStyles';
import { getComponentStyles } from './styles/ComponentStyles';
import { getModalStyles } from './styles/ModalStyles';
import { getEditorScripts } from './EditorScripts';

export class HtmlGenerator {
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
                
                <div class="keyboard-shortcuts" id="keyboardShortcuts">
                    <h4>Keyboard Shortcuts</h4>
                    <div><kbd>Ctrl+Click</kbd> - Multi-select</div>
                    <div><kbd>Click+Drag</kbd> - Box select</div>
                    <div><kbd>Ctrl+A</kbd> - Select all</div>
                    <div><kbd>Delete</kbd> - Delete selected</div>
                    <div><kbd>Esc</kbd> - Clear selection</div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--vscode-panel-border);">
                        <strong>Connections:</strong>
                    </div>
                    <div><kbd>Shift+Click</kbd> - Set primary connection</div>
                    <div><kbd>Shift+Right-click</kbd> - Set secondary connection</div>
                    <div><kbd>Shift+Click empty</kbd> - Clear primary connection</div>
                    <div><kbd>Shift+Right-click empty</kbd> - Clear secondary connection</div>
                    <div><kbd>Right-click</kbd> - Remove connections</div>
                </div>
            </div>

            <style>
                ${getEditorStyles()}
                ${getComponentStyles()}
                ${getModalStyles()}
                
                /* Component Palette Sidebar Styles */
                .component-palette {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 280px;
                    height: 100vh;
                    background-color: var(--vscode-sideBar-background);
                    border-right: 1px solid var(--vscode-sideBar-border);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-sideBar-foreground);
                    transition: transform 0.3s ease;
                    overflow: hidden;
                }

                .component-palette.collapsed {
                    transform: translateX(-240px);
                }

                .palette-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background-color: var(--vscode-sideBarSectionHeader-background);
                    border-bottom: 1px solid var(--vscode-sideBar-border);
                    min-height: 40px;
                }

                .palette-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--vscode-sideBarSectionHeader-foreground);
                }

                .palette-toggle {
                    background: none;
                    border: none;
                    color: var(--vscode-sideBarSectionHeader-foreground);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 2px;
                    font-size: 12px;
                    min-width: 20px;
                    text-align: center;
                }

                .palette-toggle:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }

                .palette-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .palette-category {
                    margin-bottom: 16px;
                }

                .category-header {
                    padding: 8px 16px 4px 16px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: var(--vscode-descriptionForeground);
                    letter-spacing: 0.5px;
                }

                .category-components {
                    padding: 0 8px;
                }

                .palette-component {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 2px 0;
                    border-radius: 4px;
                    cursor: pointer;
                    user-select: none;
                    transition: background-color 0.2s ease;
                    border: 1px solid transparent;
                    position: relative;
                }

                .palette-component:hover {
                    background-color: var(--vscode-list-hoverBackground);
                    border-color: var(--vscode-list-hoverBackground);
                }

                .palette-component:active {
                    background-color: var(--vscode-list-activeSelectionBackground);
                    color: var(--vscode-list-activeSelectionForeground);
                }

                .palette-component[draggable="true"] {
                    cursor: grab;
                }

                .palette-component[draggable="true"]:active {
                    cursor: grabbing;
                }

                .component-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    margin-right: 12px;
                    background-color: var(--vscode-button-background);
                    border-radius: 3px;
                    flex-shrink: 0;
                }

                .component-name {
                    font-size: 13px;
                    line-height: 1.2;
                    flex: 1;
                    min-width: 0;
                }

                .palette-footer {
                    padding: 12px 16px;
                    border-top: 1px solid var(--vscode-sideBar-border);
                    background-color: var(--vscode-sideBar-background);
                }

                .palette-instructions {
                    color: var(--vscode-descriptionForeground);
                    font-size: 11px;
                    line-height: 1.4;
                }

                /* Drag Ghost */
                .palette-ghost {
                    display: flex;
                    align-items: center;
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-focusBorder);
                    border-radius: 4px;
                    padding: 6px 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    font-family: var(--vscode-font-family);
                    font-size: 12px;
                    color: var(--vscode-foreground);
                    max-width: 200px;
                }

                .ghost-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    margin-right: 8px;
                    background-color: var(--vscode-button-background);
                    border-radius: 2px;
                }

                .ghost-name {
                    font-size: 11px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Canvas Drop Zones */
                .component-canvas {
                    transition: background-color 0.2s ease;
                }

                .component-canvas.drag-over {
                    background-color: var(--vscode-editor-hoverHighlightBackground);
                }

                /* Adjust main content when palette is open */
                .visual-editor {
                    margin-left: 280px;
                    transition: margin-left 0.3s ease;
                }

                .component-palette.collapsed + .visual-editor,
                .visual-editor.palette-collapsed {
                    margin-left: 40px;
                }

                /* Custom scrollbar for palette */
                .palette-content::-webkit-scrollbar {
                    width: 8px;
                }

                .palette-content::-webkit-scrollbar-track {
                    background: var(--vscode-scrollbarSlider-background);
                }

                .palette-content::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-background);
                    border-radius: 4px;
                }

                .palette-content::-webkit-scrollbar-thumb:hover {
                    background: var(--vscode-scrollbarSlider-hoverBackground);
                }

                /* Responsive adjustments */
                @media (max-width: 1024px) {
                    .component-palette {
                        width: 240px;
                    }
                    
                    .visual-editor {
                        margin-left: 240px;
                    }
                    
                    .component-palette.collapsed + .visual-editor,
                    .visual-editor.palette-collapsed {
                        margin-left: 30px;
                    }
                }

                @media (max-width: 768px) {
                    .component-palette {
                        width: 200px;
                    }
                    
                    .visual-editor {
                        margin-left: 200px;
                    }
                    
                    .component-palette.collapsed + .visual-editor,
                    .visual-editor.palette-collapsed {
                        margin-left: 20px;
                    }
                    
                    .palette-component {
                        padding: 6px 8px;
                    }
                    
                    .component-icon {
                        width: 20px;
                        height: 20px;
                        margin-right: 8px;
                    }
                    
                    .component-name {
                        font-size: 12px;
                    }
                }

                /* Animation for component insertion */
                @keyframes componentInserted {
                    0% {
                        transform: scale(1.2);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .component-node.newly-inserted {
                    animation: componentInserted 0.5s ease-out;
                }

                /* Enhanced drag feedback */
                .palette-component.dragging {
                    opacity: 0.5;
                    transform: rotate(2deg);
                }

                /* Better visual feedback for categories */
                .palette-category:not(:last-child) {
                    border-bottom: 1px solid var(--vscode-widget-border);
                    padding-bottom: 8px;
                }
            </style>

            <script>
                ${getEditorScripts()}
            </script>
        `;
    }

    public generateMainWebviewHtml(webview: any, allComponents: any[]): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VRM Editor</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    margin: 0;
                }
                .header {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .content {
                    max-width: 1200px;
                }
                h1 {
                    margin: 0 0 20px 0;
                    font-size: 24px;
                    font-weight: 600;
                }
            </style>
        </head>
        <body>
            <h1>VRM File Editor</h1>
            
            <div class="header">
                <button class="button" onclick="openHtml()">Open HTML Editor</button>
                <button class="button" onclick="openJs()">Open JavaScript Editor</button>
            </div>
            
            <div class="content">
                ${this.generateVisualEditorHtml()}
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function openHtml() {
                    vscode.postMessage({ command: 'openHtml' });
                }
                
                function openJs() {
                    vscode.postMessage({ command: 'openJs' });
                }
                
                // Initialize the visual editor with components (including section info)
                window.addEventListener('DOMContentLoaded', function() {
                    const components = ${JSON.stringify(allComponents)};
                    if (typeof renderComponents === 'function') {
                        renderComponents(components);
                    }
                });
                
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'updateComponents':
                            if (typeof renderComponents === 'function') {
                                renderComponents(message.components);
                            }
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}