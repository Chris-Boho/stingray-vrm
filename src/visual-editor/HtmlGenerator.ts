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
                            <p>v11: Components that run before the main processing logic</p>
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
                </div>
            </div>

            <style>
                ${getEditorStyles()}
                ${getComponentStyles()}
                ${getModalStyles()}
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