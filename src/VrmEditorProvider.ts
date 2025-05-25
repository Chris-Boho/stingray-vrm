import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { VrmDocument } from './VrmDocument';
import { VrmParser } from './VrmParser';

export class VrmEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'vrmEditor.vrm';
    private activeDocument: VrmDocument | undefined;
    private tempFiles: Map<string, { htmlPath?: string; jsPath?: string; watchers: vscode.FileSystemWatcher[] }> = new Map();

    constructor(private readonly context: vscode.ExtensionContext) {
        // Clean up temp files when extension deactivates
        this.context.subscriptions.push({
            dispose: () => this.cleanupAllTempFiles()
        });
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log('VRM Editor resolveCustomTextEditor called for:', document.uri.toString());
        
        // Create VRM document wrapper
        this.activeDocument = new VrmDocument(document);

        // Setup webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        // Handle messages from webview
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openHtml':
                        this.openHtmlEditor();
                        break;
                    case 'openJs':
                        this.openJsEditor();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Update webview when document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.activeDocument = new VrmDocument(e.document);
                this.updateWebview(webviewPanel.webview);
            }
        });

        // Clean up temp files when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            this.cleanupTempFiles(document.uri.fsPath);
        });

        this.updateWebview(webviewPanel.webview);
    }

    private getTempDirectory(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('VRM Editor requires an open workspace folder');
        }
        
        const tempDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'vrm-editor');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            this.ensureGitIgnore(workspaceFolders[0].uri.fsPath);
        }
        
        return tempDir;
    }

    private ensureGitIgnore(workspaceRoot: string): void {
        const gitignorePath = path.join(workspaceRoot, '.gitignore');
        const vrmIgnoreEntry = '.vscode/vrm-editor/';
        
        try {
            let gitignoreContent = '';
            if (fs.existsSync(gitignorePath)) {
                gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            }
            
            if (!gitignoreContent.includes(vrmIgnoreEntry)) {
                const newContent = gitignoreContent + (gitignoreContent.endsWith('\n') ? '' : '\n') + vrmIgnoreEntry + '\n';
                fs.writeFileSync(gitignorePath, newContent);
            }
        } catch (error) {
            console.warn('Could not update .gitignore:', error);
        }
    }

    private generateTempFileName(vrmPath: string, extension: string): string {
        const vrmName = path.basename(vrmPath, '.vrm');
        const timestamp = Date.now();
        return `${vrmName}.${timestamp}.${extension}`;
    }

    private cleanupTempFiles(vrmPath: string): void {
        const tempInfo = this.tempFiles.get(vrmPath);
        if (!tempInfo) return;

        // Dispose watchers
        tempInfo.watchers.forEach(watcher => watcher.dispose());

        // Delete temp files
        try {
            if (tempInfo.htmlPath && fs.existsSync(tempInfo.htmlPath)) {
                fs.unlinkSync(tempInfo.htmlPath);
            }
            if (tempInfo.jsPath && fs.existsSync(tempInfo.jsPath)) {
                fs.unlinkSync(tempInfo.jsPath);
            }
        } catch (error) {
            console.warn('Error cleaning up temp files:', error);
        }

        this.tempFiles.delete(vrmPath);
    }

    private cleanupAllTempFiles(): void {
        for (const vrmPath of this.tempFiles.keys()) {
            this.cleanupTempFiles(vrmPath);
        }
    }

    public async openHtmlEditor(): Promise<void> {
        if (!this.activeDocument) {
            vscode.window.showErrorMessage('No VRM document is currently active');
            return;
        }

        try {
            const vrmPath = this.activeDocument.uri.fsPath;
            const tempDir = this.getTempDirectory();
            const htmlFileName = this.generateTempFileName(vrmPath, 'html');
            const htmlFilePath = path.join(tempDir, htmlFileName);

            // Get or create temp file info
            let tempInfo = this.tempFiles.get(vrmPath);
            if (!tempInfo) {
                tempInfo = { watchers: [] };
                this.tempFiles.set(vrmPath, tempInfo);
            }

            // Clean up existing HTML file if it exists
            if (tempInfo.htmlPath && fs.existsSync(tempInfo.htmlPath)) {
                fs.unlinkSync(tempInfo.htmlPath);
            }

            // Write HTML content to temp file
            const htmlContent = this.activeDocument.getHtmlContent();
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
            tempInfo.htmlPath = htmlFilePath;

            // Open the temp file
            const doc = await vscode.workspace.openTextDocument(htmlFilePath);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

            // Watch for changes to sync back to VRM
            const watcher = vscode.workspace.createFileSystemWatcher(htmlFilePath);
            tempInfo.watchers.push(watcher);

            watcher.onDidChange(async () => {
                try {
                    const updatedContent = fs.readFileSync(htmlFilePath, 'utf8');
                    this.activeDocument?.updateHtmlContent(updatedContent);
                    await this.activeDocument?.getDocument().save();
                } catch (error) {
                    console.error('Error syncing HTML changes:', error);
                }
            });

            // Clean up when editor is closed
            const visibleEditorsChange = vscode.window.onDidChangeVisibleTextEditors(editors => {
                if (!editors.some(e => e.document.uri.fsPath === htmlFilePath)) {
                    watcher.dispose();
                    visibleEditorsChange.dispose();
                    // Remove from watchers array
                    const index = tempInfo!.watchers.indexOf(watcher);
                    if (index > -1) {
                        tempInfo!.watchers.splice(index, 1);
                    }
                }
            });

            this.context.subscriptions.push(watcher, visibleEditorsChange);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open HTML editor: ${error}`);
        }
    }

    public async openJsEditor(): Promise<void> {
        if (!this.activeDocument) {
            vscode.window.showErrorMessage('No VRM document is currently active');
            return;
        }

        try {
            const vrmPath = this.activeDocument.uri.fsPath;
            const tempDir = this.getTempDirectory();
            const jsFileName = this.generateTempFileName(vrmPath, 'js');
            const jsFilePath = path.join(tempDir, jsFileName);

            // Get or create temp file info
            let tempInfo = this.tempFiles.get(vrmPath);
            if (!tempInfo) {
                tempInfo = { watchers: [] };
                this.tempFiles.set(vrmPath, tempInfo);
            }

            // Clean up existing JS file if it exists
            if (tempInfo.jsPath && fs.existsSync(tempInfo.jsPath)) {
                fs.unlinkSync(tempInfo.jsPath);
            }

            // Write JavaScript content to temp file
            const jsContent = this.activeDocument.getJsContent();
            fs.writeFileSync(jsFilePath, jsContent, 'utf8');
            tempInfo.jsPath = jsFilePath;

            // Open the temp file
            const doc = await vscode.workspace.openTextDocument(jsFilePath);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

            // Watch for changes to sync back to VRM
            const watcher = vscode.workspace.createFileSystemWatcher(jsFilePath);
            tempInfo.watchers.push(watcher);

            watcher.onDidChange(async () => {
                try {
                    const updatedContent = fs.readFileSync(jsFilePath, 'utf8');
                    this.activeDocument?.updateJsContent(updatedContent);
                    await this.activeDocument?.getDocument().save();
                } catch (error) {
                    console.error('Error syncing JavaScript changes:', error);
                }
            });

            // Clean up when editor is closed
            const visibleEditorsChange = vscode.window.onDidChangeVisibleTextEditors(editors => {
                if (!editors.some(e => e.document.uri.fsPath === jsFilePath)) {
                    watcher.dispose();
                    visibleEditorsChange.dispose();
                    // Remove from watchers array
                    const index = tempInfo!.watchers.indexOf(watcher);
                    if (index > -1) {
                        tempInfo!.watchers.splice(index, 1);
                    }
                }
            });

            this.context.subscriptions.push(watcher, visibleEditorsChange);

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open JavaScript editor: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
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
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                }
                .button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                }
                .button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .preview {
                    background-color: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-input-border);
                    padding: 10px;
                    border-radius: 4px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    max-height: 200px;
                    overflow-y: auto;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>VRM File Editor</h1>
                
                <div class="section">
                    <h2>HTML Content</h2>
                    <button class="button" onclick="openHtml()">Open HTML Editor</button>
                    <div class="preview" id="htmlPreview"></div>
                </div>
                
                <div class="section">
                    <h2>JavaScript Content</h2>
                    <button class="button" onclick="openJs()">Open JavaScript Editor</button>
                    <div class="preview" id="jsPreview"></div>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function openHtml() {
                    vscode.postMessage({ command: 'openHtml' });
                }
                
                function openJs() {
                    vscode.postMessage({ command: 'openJs' });
                }
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'update':
                            updatePreviews(message.html, message.js);
                            break;
                    }
                });
                
                function updatePreviews(html, js) {
                    document.getElementById('htmlPreview').textContent = html.substring(0, 500) + (html.length > 500 ? '...' : '');
                    document.getElementById('jsPreview').textContent = js.substring(0, 500) + (js.length > 500 ? '...' : '');
                }
            </script>
        </body>
        </html>`;
    }

    private updateWebview(webview: vscode.Webview): void {
        if (!this.activeDocument) return;
        
        webview.postMessage({
            type: 'update',
            html: this.activeDocument.getHtmlContent(),
            js: this.activeDocument.getJsContent()
        });
    }
}