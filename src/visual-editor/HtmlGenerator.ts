import { getEditorStyles } from './styles/EditorStyles';
import { getComponentStyles } from './styles/ComponentStyles';
import { getModalStyles } from './styles/ModalStyles';
import { getEditorScripts } from './EditorScripts';
import { getPaletteStyles } from './styles/PaletteStyles';

export class HtmlGenerator {
    public generateVisualEditorHtml(): string {
        return  /*html*/ `
            <div class="visual-editor">
                <div class="editor-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" onclick="zoomIn()">Zoom In</button>
                        <button class="toolbar-btn" onclick="zoomOut()">Zoom Out</button>
                        <button class="toolbar-btn" onclick="resetZoom()">Reset Zoom</button>
                    </div>
                    <div class="toolbar-right">
                        <button class="info-btn" onclick="toggleKeyboardShortcuts()" title="Show/Hide Keyboard Shortcuts">
                            <span class="info-icon">ℹ️</span>
                        </button>
                    </div>
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
                        <!--<div class="section-header">
                            <h3>Preprocessing Components</h3>
                            <p>Components that run before the main processing logic</p>
                        </div>-->
                        
                        <!-- Component Palette Toolbar placed here -->
                        <div class="component-palette" id="componentPalette">
                            <div class="palette-header">
                                <h3>Component Palette</h3>
                            </div>
                            <div class="palette-content">
                                <!-- Palette content will be populated by JavaScript -->
                            </div>
                            <div class="palette-footer">
                                <div class="palette-instructions">
                                    <small>Drag components to canvas or use right-click menu</small>
                                </div>
                            </div>
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
                        
                        <!-- Component Palette Toolbar for postproc section too -->
                        <div class="component-palette" id="componentPalettePostproc">
                            <div class="palette-header">
                                <h3>Component Palette</h3>
                            </div>
                            <div class="palette-content">
                                <!-- Palette content will be populated by JavaScript -->
                            </div>
                            <div class="palette-footer">
                                <div class="palette-instructions">
                                    <small>Drag components to canvas or use right-click menu</small>
                                </div>
                            </div>
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
                
                <!-- FIXED: Hidden keyboard shortcuts that can be toggled -->
                <div class="keyboard-shortcuts" id="keyboardShortcuts" style="display: none;">
                    <div class="shortcuts-header">
                        <h4>Keyboard Shortcuts</h4>
                        <button class="close-shortcuts" onclick="toggleKeyboardShortcuts()">×</button>
                    </div>
                    <div class="shortcuts-content">
                        <div class="shortcut-section">
                            <h5>Selection</h5>
                            <div><kbd>Ctrl+Click</kbd> - Multi-select</div>
                            <div><kbd>Click+Drag</kbd> - Box select</div>
                            <div><kbd>Ctrl+A</kbd> - Select all</div>
                            <div><kbd>Delete</kbd> - Delete selected</div>
                            <div><kbd>Esc</kbd> - Clear selection</div>
                        </div>
                        <div class="shortcut-section">
                            <h5>Connections</h5>
                            <div><kbd>Shift+Click</kbd> - Set primary connection</div>
                            <div><kbd>Shift+Right-click</kbd> - Set secondary connection</div>
                            <div><kbd>Shift+Click empty</kbd> - Clear primary connection</div>
                            <div><kbd>Shift+Right-click empty</kbd> - Clear secondary connection</div>
                            <div><kbd>Right-click</kbd> - Remove connections</div>
                        </div>
                    </div>
                </div>
            </div>
    
            <style>
                ${getEditorStyles()}
                ${getComponentStyles()}
                ${getModalStyles()}
                ${getPaletteStyles()}
                
                /* FIXED: Additional styles for toolbar and info button */
                .editor-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                
                .toolbar-left {
                    display: flex;
                    gap: 10px;
                }
                
                .toolbar-right {
                    display: flex;
                    gap: 10px;
                    position: relative; /* FIXED: Make this a positioning context */
                }
                
                .info-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-button-border);
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    position: relative; /* FIXED: For dropdown positioning */
                }
                
                .info-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                    border-color: var(--vscode-focusBorder);
                }
                
                .info-icon {
                    font-size: 16px;
                }
                
                /* FIXED: Position shortcuts panel as overlay next to info icon */
                .keyboard-shortcuts {
                    position: fixed; /* FIXED: Back to fixed positioning for precise placement */
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    z-index: 1000;
                    min-width: 280px;
                    max-width: 320px;
                    /* Position will be set dynamically by JavaScript */
                }
                
                .shortcuts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    background-color: var(--vscode-panel-background);
                    border-radius: 8px 8px 0 0;
                }
                
                .shortcuts-header h4 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }
                
                .close-shortcuts {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    margin: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                }
                
                .close-shortcuts:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }
                
                .shortcuts-content {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .shortcut-section h5 {
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--vscode-descriptionForeground);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .shortcut-section div {
                    margin-bottom: 6px;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .shortcut-section kbd {
                    background-color: var(--vscode-keybindingLabel-background);
                    color: var(--vscode-keybindingLabel-foreground);
                    border: 1px solid var(--vscode-keybindingLabel-border);
                    border-radius: 3px;
                    padding: 2px 6px;
                    font-size: 10px;
                    font-family: var(--vscode-editor-font-family);
                    font-weight: 500;
                    white-space: nowrap;
                }
            </style>
    
            <script>
                ${getEditorScripts()}
                
                // FIXED: Position shortcuts panel precisely next to the info icon
                function toggleKeyboardShortcuts() {
                    const shortcuts = document.getElementById('keyboardShortcuts');
                    const infoBtn = document.querySelector('.info-btn');
                    
                    if (shortcuts.style.display === 'none') {
                        shortcuts.style.display = 'block';
                        
                        // FIXED: Get exact button position on screen
                        const rect = infoBtn.getBoundingClientRect();
                        const panelWidth = 300; // Approximate panel width
                        const panelHeight = 400; // Approximate panel height
                        const gap = 8; // Gap between button and panel
                        
                        // Calculate position - prefer right side of button
                        let left = rect.right + gap;
                        let top = rect.top;
                        
                        // Check if panel would go off right edge of screen
                        if (left + panelWidth > window.innerWidth) {
                            // Position to left of button instead
                            left = rect.left - panelWidth - gap;
                        }
                        
                        // Check if panel would go off bottom of screen
                        if (top + panelHeight > window.innerHeight) {
                            // Position above button
                            top = rect.bottom - panelHeight;
                        }
                        
                        // Ensure panel doesn't go off left edge
                        if (left < 10) {
                            left = 10;
                        }
                        
                        // Ensure panel doesn't go off top edge
                        if (top < 10) {
                            top = 10;
                        }
                        
                        // Apply calculated position
                        shortcuts.style.left = left + 'px';
                        shortcuts.style.top = top + 'px';
                        shortcuts.style.right = 'auto';
                        shortcuts.style.bottom = 'auto';
                        
                    } else {
                        shortcuts.style.display = 'none';
                    }
                }
                
                // Close shortcuts when clicking outside
                document.addEventListener('click', function(e) {
                    const shortcuts = document.getElementById('keyboardShortcuts');
                    const infoBtn = document.querySelector('.info-btn');
                    
                    if (shortcuts.style.display === 'block' && 
                        !shortcuts.contains(e.target) && 
                        !infoBtn.contains(e.target)) {
                        shortcuts.style.display = 'none';
                    }
                });
            </script>
        `;
    }

    public generateMainWebviewHtml(webview: any, allComponents: any[]): string {
        return  /*html*/ `<!DOCTYPE html>
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