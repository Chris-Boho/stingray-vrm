// Fixed HtmlGenerator.ts with proper Monaco detection
import { getEditorStyles } from './styles/EditorStyles';
import { getComponentStyles } from './styles/ComponentStyles';
import { getModalStyles } from './styles/ModalStyles';
import { getEditorScripts } from './EditorScripts';
import { getPaletteStyles } from './styles/PaletteStyles';

export class HtmlGenerator {
    public generateVisualEditorHtml(): string {
        return  /*html*/`
            <div class="visual-editor">
                <div class="editor-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" onclick="zoomIn()">🔍+ Zoom In</button>
                        <button class="toolbar-btn" onclick="zoomOut()">🔍- Zoom Out</button>
                        <button class="toolbar-btn" onclick="resetZoom()">↻ Reset Zoom</button>
                    </div>
                    <div class="toolbar-center">
                        <!-- Monaco status only shows on error -->
                        <div class="monaco-status" style="display: none;">
                            <span id="monacoStatus"></span>
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <button class="info-btn" onclick="toggleKeyboardShortcuts()" title="Show/Hide Keyboard Shortcuts">
                            <span class="info-icon">ℹ️</span>
                            <span class="info-text">Shortcuts</span>
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
                        <div class="component-palette" id="componentPalette">
                            <div class="palette-header">
                                <h3>Component Palette</h3>
                                <div class="palette-toggle" onclick="togglePalette()">
                                    <span>⋮⋮</span>
                                </div>
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
                        
                        <div class="component-palette" id="componentPalettePostproc">
                            <div class="palette-header">
                                <h3>Component Palette</h3>
                                <div class="palette-toggle" onclick="togglePalette()">
                                    <span>⋮⋮</span>
                                </div>
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
                
                <!-- Enhanced keyboard shortcuts with Monaco Editor shortcuts -->
                <div class="keyboard-shortcuts" id="keyboardShortcuts" style="display: none;">
                    <div class="shortcuts-header">
                        <h4>🚀 Enhanced VRM Editor Shortcuts</h4>
                        <button class="close-shortcuts" onclick="toggleKeyboardShortcuts()">×</button>
                    </div>
                    <div class="shortcuts-content">
                        <div class="shortcut-section">
                            <h5>📝 Component Selection</h5>
                            <div><kbd>Ctrl+Click</kbd> Multi-select components</div>
                            <div><kbd>Click+Drag</kbd> Box select area</div>
                            <div><kbd>Ctrl+A</kbd> Select all components</div>
                            <div><kbd>Delete</kbd> Delete selected components</div>
                            <div><kbd>Esc</kbd> Clear selection</div>
                        </div>
                        <div class="shortcut-section">
                            <h5>🔗 Component Connections</h5>
                            <div><kbd>Shift+Click</kbd> Set primary connection</div>
                            <div><kbd>Shift+Right-click</kbd> Set secondary connection</div>
                            <div><kbd>Shift+Click empty</kbd> Clear primary connection</div>
                            <div><kbd>Shift+Right-click empty</kbd> Clear secondary connection</div>
                            <div><kbd>Right-click component</kbd> Remove all connections</div>
                        </div>
                        <div class="shortcut-section">
                            <h5>⚡ Monaco Code Editing</h5>
                            <div><kbd>F11</kbd> Toggle fullscreen editor</div>
                            <div><kbd>Ctrl+/</kbd> Toggle line comment</div>
                            <div><kbd>Ctrl+D</kbd> Find next occurrence</div>
                            <div><kbd>Ctrl+F</kbd> Find in editor</div>
                            <div><kbd>Ctrl+H</kbd> Find and replace</div>
                            <div><kbd>Ctrl+G</kbd> Go to line</div>
                            <div><kbd>Alt+↑/↓</kbd> Move line up/down</div>
                            <div><kbd>Shift+Alt+↑/↓</kbd> Copy line up/down</div>
                        </div>
                        <div class="shortcut-section">
                            <h5>🎨 Editor Navigation</h5>
                            <div><kbd>Ctrl+Zoom</kbd> Zoom in/out canvas</div>
                            <div><kbd>Double-click</kbd> Edit component with Monaco</div>
                            <div><kbd>Tab</kbd> Switch between sections</div>
                            <div><kbd>Ctrl+S</kbd> Save changes</div>
                        </div>
                    </div>
                </div>
                
                <!-- Monaco Editor Loading Indicator (Hidden by default) -->
                <div id="monacoLoadingIndicator" style="display: none;" class="monaco-loading">
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">
                            <p><strong>🔄 Loading Monaco Editor...</strong></p>
                            <p>Preparing VS Code-like editing experience</p>
                            <div class="loading-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill"></div>
                                </div>
                                <small>Loading language support and themes...</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monaco Error Fallback Notice (Hidden by default) -->
                <div id="monacoErrorNotice" style="display: none;" class="monaco-error-notice">
                    <div class="error-content">
                        <span class="error-icon">⚠️</span>
                        <div class="error-text">
                            <strong>Monaco Editor Unavailable</strong>
                            <p>Using enhanced textareas with syntax highlighting</p>
                        </div>
                        <button onclick="closeErrorNotice()" class="close-error">×</button>
                    </div>
                </div>
            </div>
    
            <style>
                ${getEditorStyles()}
                ${getComponentStyles()}
                ${getModalStyles()}
                ${getPaletteStyles()}
                
                /* Enhanced Monaco-specific toolbar styles */
                .editor-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-panel-background) 100%);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .toolbar-left, .toolbar-center, .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .toolbar-center {
                    flex: 1;
                    justify-content: center;
                }
                
                .monaco-status {
                    background-color: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1px solid var(--vscode-panel-border);
                    transition: all 0.3s ease;
                }
                
                .monaco-status.loaded {
                    background-color: var(--vscode-terminal-ansiGreen);
                    color: var(--vscode-terminal-background);
                }
                
                .monaco-status.error {
                    background-color: var(--vscode-errorForeground);
                    color: var(--vscode-editor-background);
                }
                
                .monaco-status.initializing {
                    background-color: var(--vscode-terminal-ansiBlue);
                    color: var(--vscode-terminal-background);
                }
                
                .toolbar-btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: 1px solid var(--vscode-button-border);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .toolbar-btn:hover {
                    background: var(--vscode-button-hoverBackground);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                
                .info-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-button-border);
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .info-btn:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                    border-color: var(--vscode-focusBorder);
                    transform: translateY(-1px);
                }
                
                .info-icon {
                    font-size: 16px;
                }
                
                .info-text {
                    font-size: 12px;
                }
                
                /* Enhanced keyboard shortcuts panel */
                .keyboard-shortcuts {
                    position: fixed;
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-panel-background) 100%);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                    z-index: 1000;
                    min-width: 420px;
                    max-width: 500px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .shortcuts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    background: var(--vscode-panel-background);
                    border-radius: 12px 12px 0 0;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                
                .shortcuts-header h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                }
                
                .close-shortcuts {
                    background: none;
                    border: none;
                    color: var(--vscode-foreground);
                    cursor: pointer;
                    font-size: 20px;
                    padding: 4px;
                    margin: 0;
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .close-shortcuts:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }
                
                .shortcuts-content {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .shortcut-section {
                    border-left: 3px solid var(--vscode-focusBorder);
                    padding-left: 16px;
                }
                
                .shortcut-section h5 {
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--vscode-foreground);
                    text-transform: none;
                    letter-spacing: 0;
                }
                
                .shortcut-section div {
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: var(--vscode-foreground);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px 0;
                }
                
                .shortcut-section kbd {
                    background-color: var(--vscode-keybindingLabel-background);
                    color: var(--vscode-keybindingLabel-foreground);
                    border: 1px solid var(--vscode-keybindingLabel-border);
                    border-radius: 4px;
                    padding: 3px 8px;
                    font-size: 10px;
                    font-family: var(--vscode-editor-font-family);
                    font-weight: 500;
                    white-space: nowrap;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                
                /* Enhanced Monaco loading styles */
                .monaco-loading {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    backdrop-filter: blur(4px);
                }
                
                .loading-content {
                    background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-panel-background) 100%);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 40px;
                    text-align: center;
                    color: var(--vscode-foreground);
                    min-width: 320px;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.4);
                }
                
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--vscode-panel-border);
                    border-top: 3px solid var(--vscode-focusBorder);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                .loading-text p {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                }
                
                .loading-text p:last-child {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 20px;
                }
                
                .loading-progress {
                    margin-top: 20px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background-color: var(--vscode-panel-border);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--vscode-focusBorder), var(--vscode-terminal-ansiBlue));
                    width: 0%;
                    animation: progressFill 3s ease-in-out infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes progressFill {
                    0%, 100% { width: 0%; }
                    50% { width: 100%; }
                }
                
                /* Monaco error notice */
                .monaco-error-notice {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: var(--vscode-inputValidation-warningBackground);
                    border: 1px solid var(--vscode-inputValidation-warningBorder);
                    border-radius: 8px;
                    padding: 12px 16px;
                    z-index: 1500;
                    max-width: 400px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    animation: slideInRight 0.3s ease-out;
                }
                
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .error-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .error-text {
                    flex: 1;
                }
                
                .error-text strong {
                    display: block;
                    color: var(--vscode-inputValidation-warningForeground);
                    font-size: 13px;
                    margin-bottom: 4px;
                }
                
                .error-text p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .close-error {
                    background: none;
                    border: none;
                    color: var(--vscode-inputValidation-warningForeground);
                    cursor: pointer;
                    font-size: 16px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                    flex-shrink: 0;
                }
                
                .close-error:hover {
                    background-color: rgba(0,0,0,0.1);
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                /* Palette toggle enhancement */
                .palette-toggle {
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                    user-select: none;
                }
                
                .palette-toggle:hover {
                    background-color: var(--vscode-toolbar-hoverBackground);
                }
                
                .palette-toggle span {
                    font-size: 14px;
                    color: var(--vscode-foreground);
                    font-weight: bold;
                    transform: rotate(90deg);
                    display: inline-block;
                }
            </style>
    
            <script>
                ${getEditorScripts()}
                
                // FIXED: Simplified Monaco status tracking - only show errors
                let monacoCheckAttempts = 0;
                const MAX_CHECK_ATTEMPTS = 75; // 15 seconds at 200ms intervals
                
                // Update Monaco status indicator - only show errors
                function updateMonacoStatus(status, message) {
                    const statusEl = document.getElementById('monacoStatus');
                    const statusContainer = document.querySelector('.monaco-status');
                    
                    if (statusEl && statusContainer) {
                        if (status === 'error') {
                            statusEl.textContent = message;
                            statusContainer.className = 'monaco-status error';
                            statusContainer.style.display = 'block';
                        } else {
                            // Hide status for success/loading states
                            statusContainer.style.display = 'none';
                        }
                    }
                }
                
                // FIXED: Simplified Monaco monitoring - fail silently unless real error
                function startMonacoMonitoring() {
                    console.log('🔍 Starting Monaco availability monitoring...');
                    
                    // Hide status initially
                    const statusContainer = document.querySelector('.monaco-status');
                    if (statusContainer) {
                        statusContainer.style.display = 'none';
                    }
                    
                    const checkInterval = setInterval(() => {
                        monacoCheckAttempts++;
                        
                        // Check if Monaco or ComponentEditor is available
                        if (window.monaco || 
                            (window.componentEditor && typeof window.componentEditor.createMonacoEditor === 'function')) {
                            clearInterval(checkInterval);
                            console.log('✅ Monaco Editor available');
                            return;
                        }
                        
                        // Only show error if we've really exceeded attempts and nothing works
                        if (monacoCheckAttempts >= MAX_CHECK_ATTEMPTS) {
                            clearInterval(checkInterval);
                            
                            // Final check - if ComponentEditor exists at all, assume it works
                            if (window.componentEditor) {
                                console.log('🔧 ComponentEditor available, Monaco will load on demand');
                                return;
                            }
                            
                            // Only show error if nothing is available
                            console.warn('⚠️ Monaco Editor failed to initialize');
                            updateMonacoStatus('error', '⚠️ Enhanced editing unavailable');
                            
                            // Auto-hide error after 8 seconds
                            setTimeout(() => {
                                const statusContainer = document.querySelector('.monaco-status');
                                if (statusContainer) {
                                    statusContainer.style.display = 'none';
                                }
                            }, 8000);
                        }
                    }, 200);
                }
                
                // Enhanced shortcuts positioning
                function toggleKeyboardShortcuts() {
                    const shortcuts = document.getElementById('keyboardShortcuts');
                    const infoBtn = document.querySelector('.info-btn');
                    
                    if (shortcuts.style.display === 'none') {
                        shortcuts.style.display = 'block';
                        
                        // Calculate optimal position
                        const rect = infoBtn.getBoundingClientRect();
                        const panelWidth = 500;
                        const panelHeight = 600;
                        const gap = 12;
                        
                        let left = rect.right + gap;
                        let top = rect.top;
                        
                        // Adjust if panel would overflow
                        if (left + panelWidth > window.innerWidth) {
                            left = rect.left - panelWidth - gap;
                        }
                        
                        if (top + panelHeight > window.innerHeight) {
                            top = Math.max(10, rect.bottom - panelHeight);
                        }
                        
                        // Ensure panel stays on screen
                        left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));
                        top = Math.max(10, top);
                        
                        shortcuts.style.left = left + 'px';
                        shortcuts.style.top = top + 'px';
                        
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
                
                // FIXED: Simplified Monaco loading management - only show on real errors
                function showMonacoError() {
                    const notice = document.getElementById('monacoErrorNotice');
                    if (notice) {
                        notice.style.display = 'block';
                        updateMonacoStatus('error', '⚠️ Enhanced editing unavailable');
                        
                        // Auto-hide after 8 seconds
                        setTimeout(() => {
                            closeErrorNotice();
                        }, 8000);
                    }
                }
                
                function closeErrorNotice() {
                    const notice = document.getElementById('monacoErrorNotice');
                    if (notice) {
                        notice.style.display = 'none';
                    }
                    // Also hide status bar error
                    const statusContainer = document.querySelector('.monaco-status');
                    if (statusContainer) {
                        statusContainer.style.display = 'none';
                    }
                }
                
                // Remove the test function - not needed with simplified approach
                
                // Palette toggle functionality
                function togglePalette() {
                    const palette = document.querySelector('.component-palette');
                    const toggle = document.querySelector('.palette-toggle span');
                    
                    if (palette && toggle) {
                        const isCollapsed = palette.classList.toggle('collapsed');
                        toggle.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
                    }
                }
                
                // FIXED: Simplified initialization - no visible status unless error
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('🚀 Enhanced VRM Editor with Monaco support initializing...');
                    
                    // Start Monaco monitoring (silent unless error)
                    startMonacoMonitoring();
                    
                    // Initialize other components
                    setTimeout(() => {
                        if (typeof renderComponents === 'function') {
                            console.log('Initializing component rendering...');
                        }
                    }, 100);
                });
                
                // Remove the componentEditorReady listener - not needed with simplified approach
                
                // Global keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    // F11 for fullscreen (when in Monaco editor)
                    if (e.key === 'F11' && document.querySelector('.monaco-editor:focus')) {
                        e.preventDefault();
                        // Monaco will handle fullscreen
                    }
                    
                    // Esc to close shortcuts
                    if (e.key === 'Escape') {
                        const shortcuts = document.getElementById('keyboardShortcuts');
                        if (shortcuts.style.display === 'block') {
                            shortcuts.style.display = 'none';
                        }
                    }
                });
                
                // FIXED: Override console methods temporarily to catch Monaco logs
                const originalConsoleLog = console.log;
                const originalConsoleError = console.error;
                
                console.log = function(...args) {
                    originalConsoleLog.apply(console, args);
                    
                    // Check for Monaco-related logs
                    const message = args.join(' ');
                    if (message.includes('Monaco') && message.includes('loaded')) {
                        updateMonacoStatus('loaded', '✅ Monaco Ready');
                    }
                };
                
                console.error = function(...args) {
                    originalConsoleError.apply(console, args);
                    
                    // Check for Monaco-related errors
                    const message = args.join(' ');
                    if (message.includes('Monaco') || message.includes('monaco')) {
                        console.warn('Monaco-related error detected, but editor may still work');
                    }
                };
                
                // Restore console methods after 10 seconds
                setTimeout(() => {
                    console.log = originalConsoleLog;
                    console.error = originalConsoleError;
                }, 10000);
            </script>
        `;
    }

    public generateMainWebviewHtml(webview: any, allComponents: any[]): string {
        return  /*html*/`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Enhanced VRM Editor with Monaco</title>
            
            <!-- Preload Monaco Editor for better performance -->
            <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
            <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css"></noscript>
            
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .header {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, var(--vscode-panel-background) 0%, var(--vscode-editor-background) 100%);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                }
                
                .button {
                    background: linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-hoverBackground) 100%);
                    color: var(--vscode-button-foreground);
                    border: 1px solid var(--vscode-button-border);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-decoration: none;
                    position: relative;
                    overflow: hidden;
                }
                
                .button::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    transition: width 0.3s, height 0.3s;
                }
                
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    border-color: var(--vscode-focusBorder);
                }
                
                .button:hover::before {
                    width: 300px;
                    height: 300px;
                }
                
                .button:active {
                    transform: translateY(0);
                }
                
                .content {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                h1 {
                    margin: 0 0 20px 0;
                    font-size: 28px;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--vscode-foreground), var(--vscode-focusBorder));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .features-banner {
                    background: linear-gradient(135deg, var(--vscode-panel-background) 0%, var(--vscode-editor-background) 100%);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                
                .features-banner h2 {
                    margin: 0 0 15px 0;
                    color: var(--vscode-foreground);
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .features-list {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    flex-wrap: wrap;
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }
                
                .features-list li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: var(--vscode-descriptionForeground);
                }
                
                .feature-icon {
                    font-size: 16px;
                }
                
                .monaco-indicator {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1px solid var(--vscode-panel-border);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                    z-index: 100;
                    transition: all 0.3s ease;
                }
                
                .monaco-indicator.loaded {
                    background: var(--vscode-terminal-ansiGreen);
                    color: var(--vscode-terminal-background);
                }
                
                .monaco-indicator.error {
                    background: var(--vscode-errorForeground);
                    color: var(--vscode-editor-background);
                }
                
                .monaco-indicator.initializing {
                    background: var(--vscode-terminal-ansiBlue);
                    color: var(--vscode-terminal-background);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                @media (max-width: 768px) {
                    .header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .features-list {
                        flex-direction: column;
                        align-items: center;
                        gap: 15px;
                    }
                    
                    .monaco-indicator {
                        bottom: 10px;
                        right: 10px;
                        font-size: 11px;
                        padding: 6px 12px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <button class="button" onclick="openHtml()">
                    <span>📝</span>
                    <span>Open HTML Editor</span>
                </button>
                <button class="button" onclick="openJs()">
                    <span>⚡</span>
                    <span>Open JavaScript Editor</span>
                </button>
                <div style="margin-left: auto; display: flex; align-items: center; gap: 12px;">
                    <!-- Monaco indicator only shows on error -->
                    <div class="monaco-indicator" id="mainMonacoStatus" style="display: none;">
                    </div>
                </div>
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
                
                // FIXED: Simplified Monaco status tracking for main view - only show errors
                function updateMainMonacoStatus(status, message) {
                    const statusEl = document.getElementById('mainMonacoStatus');
                    if (statusEl && status === 'error') {
                        statusEl.textContent = message;
                        statusEl.className = 'monaco-indicator error';
                        statusEl.style.display = 'block';
                        
                        // Auto-hide after 8 seconds
                        setTimeout(() => {
                            statusEl.style.display = 'none';
                        }, 8000);
                    } else if (statusEl && status !== 'error') {
                        // Hide for non-error states
                        statusEl.style.display = 'none';
                    }
                }
                
                // FIXED: Silent Monaco monitoring for main view
                function checkMainMonacoStatus() {
                    // Hide indicator initially
                    const statusEl = document.getElementById('mainMonacoStatus');
                    if (statusEl) {
                        statusEl.style.display = 'none';
                    }
                    
                    let attempts = 0;
                    const maxAttempts = 50; // 15 seconds
                    
                    const checkInterval = setInterval(() => {
                        attempts++;
                        
                        if (window.monaco || (window.componentEditor && typeof window.componentEditor.createMonacoEditor === 'function')) {
                            clearInterval(checkInterval);
                            console.log('✅ Monaco Editor is available and ready for enhanced code editing');
                            return;
                        }
                        
                        // Check for ComponentEditor readiness
                        if (window.componentEditor) {
                            clearInterval(checkInterval);
                            console.log('🔧 ComponentEditor ready');
                            return;
                        }
                        
                        // Only show error if really failed
                        if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.warn('⚠️ Enhanced code editing may not be available');
                            updateMainMonacoStatus('error', '⚠️ Enhanced editing unavailable');
                        }
                    }, 300);
                }
                
                // Initialize the visual editor with components
                window.addEventListener('DOMContentLoaded', function() {
                    console.log('🚀 Enhanced VRM Editor initializing...');
                    
                    const components = ${JSON.stringify(allComponents)};
                    if (typeof renderComponents === 'function') {
                        renderComponents(components);
                    }
                    
                    // Start silent Monaco monitoring
                    checkMainMonacoStatus();
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
                        case 'monacoError':
                            updateMainMonacoStatus('error', '⚠️ Enhanced editing unavailable');
                            break;
                    }
                });
                
                // Global keyboard shortcuts
                document.addEventListener('keydown', function(e) {
                    // Ctrl+Shift+P for command palette (VS Code style)
                    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                        e.preventDefault();
                        console.log('Command palette shortcut triggered');
                    }
                    
                    if (e.ctrlKey && e.key === '\`') {
                        e.preventDefault();
                        const details = document.getElementById('componentDetails');
                        if (details) {
                            details.style.display = details.style.display === 'none' ? 'block' : 'none';
                        }
                    }
                });
                
                // FIXED: Enhanced error handling
                window.addEventListener('error', function(e) {
                    if (e.message.includes('monaco') || e.filename.includes('monaco')) {
                        console.warn('Monaco-related error caught, but functionality may still work:', e.message);
                        // Don't immediately show error status - Monaco might still work
                    }
                });
                
                // Performance monitoring
                if (window.performance && window.performance.mark) {
                    window.performance.mark('vrm-editor-start');
                    
                    window.addEventListener('load', function() {
                        window.performance.mark('vrm-editor-loaded');
                        window.performance.measure('vrm-editor-init', 'vrm-editor-start', 'vrm-editor-loaded');
                        
                        const measure = window.performance.getEntriesByName('vrm-editor-init')[0];
                        if (measure) {
                            console.log(\`VRM Editor initialized in \${measure.duration.toFixed(2)}ms\`);
                        }
                    });
                }
            </script>
        </body>
        </html>`;
    }
}