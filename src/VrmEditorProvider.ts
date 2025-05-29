import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { VrmDocument } from './VrmDocument';
import { VrmParser } from './VrmParser';
import { VrmVisualEditor } from './VrmVisualEditor';

export class VrmEditorProvider implements vscode.CustomTextEditorProvider {
    private static readonly viewType = 'vrmEditor.vrm';
    private activeDocument: VrmDocument | undefined;
    private tempFiles: Map<string, { htmlPath?: string; jsPath?: string; watchers: vscode.FileSystemWatcher[] }> = new Map();
    private visualEditor: VrmVisualEditor | undefined;
    
    // Add batching mechanism
    private pendingUpdates: Map<number, any> = new Map();
    private updateTimeout: NodeJS.Timeout | undefined;
    private readonly UPDATE_DEBOUNCE_MS = 100;

    constructor(private readonly context: vscode.ExtensionContext) {
        // Note: Removed cleanup on extension deactivate to preserve temp files
        // Temp files are only cleaned up when individual VRM files are closed
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        console.log('VRM Editor resolveCustomTextEditor called for:', document.uri.toString());
        
        // Create VRM document wrapper
        this.activeDocument = new VrmDocument(document);

        // Initialize visual editor
        this.visualEditor = new VrmVisualEditor(webviewPanel.webview);

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
                    case 'updateComponent':
                        this.updateComponent(message.component);
                        break;
                    case 'updateComponents':
                        this.updateComponents(message.components);
                        break;
                    case 'addComponent':
                        this.addComponent(message.component);
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

        // Clean up temp files when webview is disposed (in resolveCustomTextEditor method)
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            
            // Enhanced cleanup - this ensures cleanup happens when VRM tab is closed
            this.closeVrmEditorsAndCleanup(document.uri.fsPath).catch(error => {
                console.error('Error during VRM cleanup:', error);
            });
        });

        this.updateWebview(webviewPanel.webview);
    }

    private addComponent(newComponent: any): void {
        if (!this.activeDocument) {
            console.error('No active document for adding component');
            return;
        }

        console.log(`Adding new component ${newComponent.n} (${newComponent.t}) to ${newComponent.section}`);

        try {
            // Get current VRM content
            let currentContent = this.activeDocument.getDocument().getText();
            
            // Generate XML for the new component using the existing method
            const componentXml = this.generateComponentXml(newComponent);
            
            // Add component to the appropriate section
            currentContent = this.addComponentToSection(currentContent, componentXml, newComponent.section);
            
            // Apply changes
            this.applyEditWithRetry(currentContent);
            
            console.log(`Successfully added component ${newComponent.n}`);
            
        } catch (error) {
            console.error('Error adding component:', error);
            vscode.window.showErrorMessage(`Failed to add component: ${error}`);
        }
    }

    private addComponentToSection(xmlContent: string, componentXml: string, section: 'preproc' | 'postproc'): string {
        const sectionRegex = new RegExp(`(<${section}>)(.*?)(<\/${section}>)`, 's');
        const match = xmlContent.match(sectionRegex);
        
        if (match) {
            const [fullMatch, openTag, sectionContent, closeTag] = match;
            
            // Add the new component before the closing tag
            const updatedSectionContent = sectionContent.trim() + '\n        ' + componentXml + '\n    ';
            const updatedSection = openTag + updatedSectionContent + closeTag;
            
            return xmlContent.replace(fullMatch, updatedSection);
        } else {
            // Section doesn't exist, create it
            const newSection = `    <${section}>\n        ${componentXml}\n    </${section}>`;
            
            // Find a good place to insert the section (before </vrm> or after existing sections)
            const vrmCloseMatch = xmlContent.match(/(\s*)<\/vrm>/);
            if (vrmCloseMatch) {
                const indentation = vrmCloseMatch[1] || '';
                return xmlContent.replace('</vrm>', `${newSection}\n${indentation}</vrm>`);
            } else {
                // Fallback: append at the end
                return xmlContent + '\n' + newSection;
            }
        }
    }

    private updateComponents(updatedComponents: any[]): void {
        if (!this.activeDocument) {
            console.error('No active document for batch component update');
            return;
        }
        
        console.log(`Received batch update for ${updatedComponents.length} components`);
        
        // Add all components to pending updates (this will overwrite any existing pending updates for the same components)
        updatedComponents.forEach(component => {
            this.pendingUpdates.set(component.n, component);
        });
        
        // Clear existing timeout and set a new one
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.processPendingUpdates();
        }, this.UPDATE_DEBOUNCE_MS);
    }
    
    private async processPendingUpdates(): Promise<void> {
        if (!this.activeDocument || this.pendingUpdates.size === 0) {
            return;
        }
        
        const componentsToUpdate = Array.from(this.pendingUpdates.values());
        this.pendingUpdates.clear();
        
        console.log(`Processing ${componentsToUpdate.length} pending component updates`);
        
        try {
            // Get current VRM content
            let currentContent = this.activeDocument.getDocument().getText();
            
            // Update each component in the XML sequentially
            for (const updatedComponent of componentsToUpdate) {
                console.log(`Updating component ${updatedComponent.n} to (${updatedComponent.x}, ${updatedComponent.y})`);
                currentContent = this.updateComponentInXml(currentContent, updatedComponent);
            }
            
            // Apply all changes in a single edit with retry logic
            await this.applyEditWithRetry(currentContent);
            
        } catch (error) {
            console.error('Error in batch component update:', error);
            vscode.window.showErrorMessage(`Failed to update components: ${error}`);
        }
    }
    
    private async applyEditWithRetry(newContent: string, maxRetries: number = 3): Promise<void> {
        if (!this.activeDocument) {
            throw new Error('No active document');
        }
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Applying edit attempt ${attempt}/${maxRetries}`);
                
                // Create fresh document reference each time
                const currentDocument = this.activeDocument.getDocument();
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    currentDocument.positionAt(0),
                    currentDocument.positionAt(currentDocument.getText().length)
                );
                
                edit.replace(currentDocument.uri, fullRange, newContent);
                
                const success = await vscode.workspace.applyEdit(edit);
                
                if (success) {
                    console.log(`Successfully applied edit on attempt ${attempt}`);
                    return;
                } else {
                    throw new Error('Workspace edit returned false');
                }
                
            } catch (error) {
                console.warn(`Edit attempt ${attempt} failed:`, error);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed to apply edit after ${maxRetries} attempts: ${error}`);
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 50 * attempt));
                
                // Refresh the document reference
                this.activeDocument = new VrmDocument(this.activeDocument.getDocument());
            }
        }
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
        return `${vrmName}.vrm.${extension}`;
    }

    private cleanupTempFiles(vrmPath: string): void {
        const tempInfo = this.tempFiles.get(vrmPath);
        if (!tempInfo) {return;}

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

    private async closeVrmEditorsAndCleanup(vrmPath: string): Promise<void> {
        const tempInfo = this.tempFiles.get(vrmPath);
        console.log("tab closed");
        // Close any open HTML/JS editors for this VRM file
        const editorsToClose: vscode.TextEditor[] = [];
        
        // Get the VRM filename without extension for pattern matching
        const vrmFileName = path.basename(vrmPath, '.vrm');
        const tempDir = this.getTempDirectory();
        
        // Find editors that match this VRM file's temp files
        for (const editor of vscode.window.visibleTextEditors) {
            const editorPath = editor.document.uri.fsPath;
            const editorFileName = path.basename(editorPath);
            console.log("editors filenames: ", editorFileName);
            
            // Check if this editor is editing a temp file for this VRM
            if (editorFileName === `${vrmFileName}.vrm.html` || 
                editorFileName === `${vrmFileName}.vrm.js`) {
                editorsToClose.push(editor);
            }
        }

        // Close the editors
        for (const editor of editorsToClose) {
            await vscode.window.showTextDocument(editor.document);
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }

        // Clean up temp files using both tracked info AND directory scan
        await this.cleanupTempFilesForVrm(vrmPath, vrmFileName, tempDir);
        
        // Remove from tracking map
        if (tempInfo) {
            // Dispose watchers
            tempInfo.watchers.forEach(watcher => watcher.dispose());
            this.tempFiles.delete(vrmPath);
        }
    }

    private async cleanupTempFilesForVrm(vrmPath: string, vrmFileName: string, tempDir: string): Promise<void> {
        try {
            // Method 1: Clean up tracked files
            const tempInfo = this.tempFiles.get(vrmPath);
            if (tempInfo) {
                if (tempInfo.htmlPath && fs.existsSync(tempInfo.htmlPath)) {
                    fs.unlinkSync(tempInfo.htmlPath);
                    console.log(`Cleaned up tracked HTML file: ${tempInfo.htmlPath}`);
                }
                if (tempInfo.jsPath && fs.existsSync(tempInfo.jsPath)) {
                    fs.unlinkSync(tempInfo.jsPath);
                    console.log(`Cleaned up tracked JS file: ${tempInfo.jsPath}`);
                }
            }

            // Method 2: Scan temp directory for any remaining files matching this VRM
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                
                for (const file of files) {
                    // Check if file matches pattern: filename.vrm.html or filename.vrm.js
                    if (file === `${vrmFileName}.vrm.html` || file === `${vrmFileName}.vrm.js`) {
                        const filePath = path.join(tempDir, file);
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`Cleaned up orphaned temp file: ${filePath}`);
                        } catch (error) {
                            console.warn(`Could not delete temp file ${filePath}:`, error);
                        }
                    }
                }
            }

        } catch (error) {
            console.warn('Error during temp file cleanup:', error);
        }
    }

    // Also add a method to clean up ALL temp files when extension deactivates (optional)
    private cleanupAllTempFiles(): void {
        try {
            // Clean up tracked files first
            for (const vrmPath of this.tempFiles.keys()) {
                const vrmFileName = path.basename(vrmPath, '.vrm');
                const tempDir = this.getTempDirectory();
                this.cleanupTempFilesForVrm(vrmPath, vrmFileName, tempDir);
            }
            
            // Clear the tracking map
            this.tempFiles.clear();
            
            // Optional: Remove entire temp directory if empty
            const tempDir = this.getTempDirectory();
            if (fs.existsSync(tempDir)) {
                const files = fs.readdirSync(tempDir);
                if (files.length === 0) {
                    fs.rmdirSync(tempDir);
                    console.log('Removed empty temp directory');
                }
            }
            
        } catch (error) {
            console.warn('Error during full cleanup:', error);
        }
    }

    // Add this method to VrmEditorProvider class for manual cleanup if needed
    public async forceCleanupForVrm(vrmPath: string): Promise<void> {
        const vrmFileName = path.basename(vrmPath, '.vrm');
        const tempDir = this.getTempDirectory();
        await this.cleanupTempFilesForVrm(vrmPath, vrmFileName, tempDir);
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

            // Check if file already exists and is open in an editor
            const existingEditor = vscode.window.visibleTextEditors.find(
                editor => editor.document.uri.fsPath === htmlFilePath
            );

            if (existingEditor) {
                // File is already open, just focus on it
                await vscode.window.showTextDocument(existingEditor.document, { preview: false });
                return;
            }

            // Get or create temp file info
            let tempInfo = this.tempFiles.get(vrmPath);
            if (!tempInfo) {
                tempInfo = { watchers: [] };
                this.tempFiles.set(vrmPath, tempInfo);
            }

            // Always replace temp file with current VRM content
            let doc: vscode.TextDocument;
            const htmlContent = this.activeDocument.getHtmlContent();
            fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
            doc = await vscode.workspace.openTextDocument(htmlFilePath);

            tempInfo.htmlPath = htmlFilePath;
            await vscode.window.showTextDocument(doc, { preview: false });

            // Set up file watcher if not already watching
            const existingWatcher = tempInfo.watchers.find(w => (w as any)._pattern === htmlFilePath);
            if (!existingWatcher) {
                const watcher = vscode.workspace.createFileSystemWatcher(htmlFilePath);
                tempInfo.watchers.push(watcher);

                // Auto-save functionality (if enabled)
                const autoSaveEnabled = vscode.workspace.getConfiguration('vrmEditor').get<boolean>('autoSave', false);
                const autoSaveDelay = vscode.workspace.getConfiguration('vrmEditor').get<number>('autoSaveDelay', 500);
                let saveTimeout: NodeJS.Timeout | undefined;

                // Track if we're currently saving to prevent reentrancy
                let isSaving = false;

                // Function to handle saving changes
                const handleSave = async () => {
                    if (isSaving) return;
                    isSaving = true;
                    try {
                        const updatedContent = fs.readFileSync(htmlFilePath, 'utf8');
                        this.activeDocument?.updateHtmlContent(updatedContent);
                        await this.activeDocument?.getDocument().save();
                    } catch (error) {
                        console.error('Error saving HTML changes:', error);
                    } finally {
                        isSaving = false;
                    }
                };

                // Update the file watcher to use the new save handler
                watcher.onDidChange(async () => {
                    try {
                        if (autoSaveEnabled) {
                            // Clear existing timeout
                            if (saveTimeout) {
                                clearTimeout(saveTimeout);
                            }

                            // Set new timeout
                            saveTimeout = setTimeout(async () => {
                                await handleSave();
                            }, autoSaveDelay);
                        }
                    } catch (error) {
                        console.error('Error syncing HTML changes:', error);
                    }
                });

                // Update the save subscription to use the new save handler
                const saveSubscription = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
                    if (savedDoc.uri.fsPath === htmlFilePath) {
                        await handleSave();
                        vscode.window.showInformationMessage('HTML changes saved to VRM file');
                    }
                });

                // Track if the editor is currently visible
                let isEditorVisible = true;

                // Handle tab visibility changes
                const visibleEditorsChange = vscode.window.onDidChangeVisibleTextEditors(editors => {
                    const wasVisible = isEditorVisible;
                    isEditorVisible = editors.some(e => e.document.uri.fsPath === htmlFilePath);
                    
                    // If the editor became visible again, ensure we're watching
                    if (isEditorVisible && !wasVisible) {
                        console.log('HTML editor became visible again');
                    }
                    // If the editor was closed, clean up
                    else if (!isEditorVisible && wasVisible) {
                        console.log('HTML editor is no longer visible');
                    }
                });

                // Clean up when the editor is actually closed, not just when it's hidden
                const closeSubscription = vscode.workspace.onDidCloseTextDocument(doc => {
                    if (doc.uri.fsPath === htmlFilePath) {
                        console.log('HTML editor was closed');
                        if (saveTimeout) {
                            clearTimeout(saveTimeout);
                        }
                        watcher.dispose();
                        saveSubscription.dispose();
                        visibleEditorsChange.dispose();
                        closeSubscription.dispose();
                        // Remove from watchers array
                        const index = tempInfo!.watchers.indexOf(watcher);
                        if (index > -1) {
                            tempInfo!.watchers.splice(index, 1);
                        }
                    }
                });

                this.context.subscriptions.push(watcher, saveSubscription, visibleEditorsChange, closeSubscription);
            }

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

            // Check if file already exists and is open in an editor
            const existingEditor = vscode.window.visibleTextEditors.find(
                editor => editor.document.uri.fsPath === jsFilePath
            );

            if (existingEditor) {
                // File is already open, just focus on it
                await vscode.window.showTextDocument(existingEditor.document, { preview: false });
                return;
            }

            // Get or create temp file info
            let tempInfo = this.tempFiles.get(vrmPath);
            if (!tempInfo) {
                tempInfo = { watchers: [] };
                this.tempFiles.set(vrmPath, tempInfo);
            }

            // Always replace temp file with current VRM content
            let doc: vscode.TextDocument;
            const jsContent = this.activeDocument.getJsContent();
            fs.writeFileSync(jsFilePath, jsContent, 'utf8');
            doc = await vscode.workspace.openTextDocument(jsFilePath);

            tempInfo.jsPath = jsFilePath;
            await vscode.window.showTextDocument(doc, { preview: false });

            // Set up file watcher if not already watching
            const existingWatcher = tempInfo.watchers.find(w => (w as any)._pattern === jsFilePath);
            if (!existingWatcher) {
                const watcher = vscode.workspace.createFileSystemWatcher(jsFilePath);
                tempInfo.watchers.push(watcher);

                // Auto-save functionality (if enabled)
                const autoSaveEnabled = vscode.workspace.getConfiguration('vrmEditor').get<boolean>('autoSave', false);
                const autoSaveDelay = vscode.workspace.getConfiguration('vrmEditor').get<number>('autoSaveDelay', 500);
                let saveTimeout: NodeJS.Timeout | undefined;

                // Track if we're currently saving to prevent reentrancy
                let isSaving = false;

                // Function to handle saving changes
                const handleSave = async () => {
                    if (isSaving) return;
                    isSaving = true;
                    try {
                        const updatedContent = fs.readFileSync(jsFilePath, 'utf8');
                        this.activeDocument?.updateJsContent(updatedContent);
                        await this.activeDocument?.getDocument().save();
                    } catch (error) {
                        console.error('Error saving JavaScript changes:', error);
                    } finally {
                        isSaving = false;
                    }
                };

                // Update the file watcher to use the new save handler
                watcher.onDidChange(async () => {
                    try {
                        if (autoSaveEnabled) {
                            // Clear existing timeout
                            if (saveTimeout) {
                                clearTimeout(saveTimeout);
                            }

                            // Set new timeout
                            saveTimeout = setTimeout(async () => {
                                await handleSave();
                            }, autoSaveDelay);
                        }
                    } catch (error) {
                        console.error('Error syncing JavaScript changes:', error);
                    }
                });

                // Update the save subscription to use the new save handler
                const saveSubscription = vscode.workspace.onDidSaveTextDocument(async (savedDoc) => {
                    if (savedDoc.uri.fsPath === jsFilePath) {
                        await handleSave();
                        vscode.window.showInformationMessage('JavaScript changes saved to VRM file');
                    }
                });

                // Track if the editor is currently visible
                let isEditorVisible = true;

                // Handle tab visibility changes
                const visibleEditorsChange = vscode.window.onDidChangeVisibleTextEditors(editors => {
                    const wasVisible = isEditorVisible;
                    isEditorVisible = editors.some(e => e.document.uri.fsPath === jsFilePath);
                    
                    // If the editor became visible again, ensure we're watching
                    if (isEditorVisible && !wasVisible) {
                        console.log('JavaScript editor became visible again');
                    }
                    // If the editor was closed, clean up
                    else if (!isEditorVisible && wasVisible) {
                        console.log('JavaScript editor is no longer visible');
                    }
                });

                // Clean up when the editor is actually closed, not just when it's hidden
                const closeSubscription = vscode.workspace.onDidCloseTextDocument(doc => {
                    if (doc.uri.fsPath === jsFilePath) {
                        console.log('JavaScript editor was closed');
                        if (saveTimeout) {
                            clearTimeout(saveTimeout);
                        }
                        watcher.dispose();
                        saveSubscription.dispose();
                        visibleEditorsChange.dispose();
                        closeSubscription.dispose();
                        // Remove from watchers array
                        const index = tempInfo!.watchers.indexOf(watcher);
                        if (index > -1) {
                            tempInfo!.watchers.splice(index, 1);
                        }
                    }
                });

                this.context.subscriptions.push(watcher, saveSubscription, visibleEditorsChange, closeSubscription);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open JavaScript editor: ${error}`);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Parse components from VRM file with section information
        const vrmContent = this.activeDocument?.getDocument().getText() || '';
        
        // Parse both sections separately to maintain section identity
        const preprocMatch = vrmContent.match(/<preproc>([\s\S]*?)<\/preproc>/);
        const postprocMatch = vrmContent.match(/<postproc>([\s\S]*?)<\/postproc>/);
        
        let allComponents: any[] = [];
        
        if (this.visualEditor) {
            if (preprocMatch) {
                const preprocComponents = this.visualEditor.parseComponentSection(preprocMatch[1], 'preproc');
                allComponents = allComponents.concat(preprocComponents);
            }
            
            if (postprocMatch) {
                const postprocComponents = this.visualEditor.parseComponentSection(postprocMatch[1], 'postproc');
                allComponents = allComponents.concat(postprocComponents);
            }
        }
        
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
                ${this.visualEditor?.generateVisualEditorHtml() || ''}
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
    
    private updateComponent(updatedComponent: any): void {
        if (!this.activeDocument) {
            console.error('No active document for component update');
            return;
        }
        
        console.log(`Received single update for component ${updatedComponent.n}`);
        
        // Add to pending updates
        this.pendingUpdates.set(updatedComponent.n, updatedComponent);
        
        // Clear existing timeout and set a new one
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.processPendingUpdates();
        }, this.UPDATE_DEBOUNCE_MS);
    }
    
    private updateComponentInXml(xmlContent: string, updatedComponent: any): string {
        // Find the component in both preproc and postproc sections
        const preprocMatch = xmlContent.match(/<preproc>([\s\S]*?)<\/preproc>/);
        const postprocMatch = xmlContent.match(/<postproc>([\s\S]*?)<\/postproc>/);
        
        let updatedXml = xmlContent;
        
        if (preprocMatch && updatedComponent.section === 'preproc') {
            const updatedPreproc = this.updateComponentInSection(preprocMatch[1], updatedComponent);
            updatedXml = updatedXml.replace(preprocMatch[1], updatedPreproc);
        }
        
        if (postprocMatch && updatedComponent.section === 'postproc') {
            const updatedPostproc = this.updateComponentInSection(postprocMatch[1], updatedComponent);
            updatedXml = updatedXml.replace(postprocMatch[1], updatedPostproc);
        }
        
        return updatedXml;
    }
    
    private updateComponentInSection(sectionContent: string, updatedComponent: any): string {
        // Find the specific component by ID
        const componentRegex = new RegExp(`<c>\\s*<n>${updatedComponent.n}</n>[\\s\\S]*?</c>`, 'g');
        
        return sectionContent.replace(componentRegex, (match) => {
            // Generate updated component XML
            return this.generateComponentXml(updatedComponent);
        });
    }
    
    private generateComponentXml(component: any): string {
        let xml = `<c>
            <n>${component.n}</n>
            <t>${component.t}</t>`;
        
        // Add values section if it exists
        if (component.values) {
            xml += '\n        <values>';
            
            // Handle different component types with enhanced XML generation
            xml += this.generateValuesXmlByType(component);
            
            xml += '\n        </values>';
        }
        
        // Add connections
        if (component.j && component.j.length > 0) {
            component.j.forEach((jump: number) => {
                if (jump > 0) {
                    xml += `\n        <j>${jump}</j>`;
                } else {
                    xml += '\n        <j />';
                }
            });
        } else {
            // Default empty connections
            xml += '\n        <j />';
            xml += '\n        <j />';
        }
        
        // Add position and metadata
        xml += `\n        <x>${component.x}</x>`;
        xml += `\n        <y>${component.y}</y>`;
        
        // Comment
        if (component.c) {
            xml += `\n        <c>${component.c}</c>`;
        } else {
            xml += '\n        <c />';
        }
        
        // Watchpoint
        if (component.wp === null) {
            xml += '\n        <wp />';
        } else {
            xml += `\n        <wp>${component.wp ? '1' : '0'}</wp>`;
        }
        
        xml += '\n    </c>';
        
        return xml;
    }
    
    private generateValuesXmlByType(component: any): string {
        if (!component.values) return '';
        
        switch (component.t) {
            case 'CSF':
                return this.generateCsfValuesXml(component.values);
            case 'SQLTRN':
                return this.generateSqlTrnValuesXml(component.values);
            case 'MATH':
                return this.generateMathValuesXml(component.values);
            case 'TEMPLATE':
                return this.generateTemplateValuesXml(component.values);
            case 'INSERTUPDATEQUERY':
            case 'SELECTQUERY':
                return this.generateQueryValuesXml(component.values);
            case 'SCRIPT':
                return this.generateScriptValuesXml(component.values);
            case 'ERROR':
                return this.generateErrorValuesXml(component.values);
            case 'IF':
                return this.generateIfValuesXml(component.values);
            case 'SET':
                return this.generateSetValuesXml(component.values);
            case 'EXTERNAL':
                return this.generateExternalValuesXml(component.values);
            default:
                return this.generateLegacyValuesXml(component.values);
        }
    }
    
    private generateCsfValuesXml(values: any): string {
        let xml = '';
        xml += `\n            <n>${values.functionName || ''}</n>`;
        if (values.returnValue) {
            xml += `\n            <v><![CDATA[${values.returnValue}]]></v>`;
        } else {
            xml += '\n            <v />';
        }
        
        if (values.functionParams) {
            values.functionParams.forEach((param: any) => {
                xml += `\n            <n>${param.label || ''}</n>`;
                if (param.value) {
                    xml += `\n            <v><![CDATA[${param.value}]]></v>`;
                } else {
                    xml += '\n            <v />';
                }
            });
        }
        return xml;
    }
    
    private generateSqlTrnValuesXml(values: any): string {
        let xml = '';
        if (values.transactionName) {
            xml += `\n            <n>${values.transactionName}</n>`;
        } else {
            xml += '\n            <n />';
        }
        if (values.transactionType) {
            xml += `\n            <t>${values.transactionType}</t>`;
        } else {
            xml += '\n            <t />';
        }
        return xml;
    }
    
    private generateMathValuesXml(values: any): string {
        let xml = '';
        xml += `\n            <n>${values.mathName || ''}</n>`;
        xml += `\n            <f>${values.mathFormat || ''}</f>`;
        xml += `\n            <v>${values.mathParam || ''}</v>`;
        return xml;
    }
    
    private generateTemplateValuesXml(values: any): string {
        let xml = '';
        xml += `\n            <n>${values.templateName || ''}</n>`;
        xml += `\n            <t>${values.templateTarget || ''}</t>`;
        return xml;
    }
    
    private generateQueryValuesXml(values: any): string {
        let xml = '';
        if (values.query) {
            xml += `\n            <query><![CDATA[${values.query}]]></query>`;
        } else {
            xml += '\n            <query />';
        }
        
        if (values.params) {
            values.params.forEach((param: any) => {
                xml += '\n            <param>';
                xml += `\n                <n>${param.name}</n>`;
                xml += `\n                <t>${param.type}</t>`;
                xml += `\n                <v><![CDATA[${param.value}]]></v>`;
                xml += '\n            </param>';
            });
        }
        return xml;
    }
    
    private generateScriptValuesXml(values: any): string {
        let xml = '';
        if (values.script) {
            xml += `\n            <v><![CDATA[${values.script}]]></v>`;
        } else {
            xml += '\n            <v />';
        }
        xml += `\n            <lng>${values.language || ''}</lng>`;
        return xml;
    }
    
    private generateErrorValuesXml(values: any): string {
        if (values.errorMessage) {
            return `\n            <v><![CDATA[${values.errorMessage}]]></v>`;
        } else {
            return '\n            <v />';
        }
    }
    
    private generateIfValuesXml(values: any): string {
        if (values.condition) {
            return `\n            <v><![CDATA[${values.condition}]]></v>`;
        } else {
            return '\n            <v><![CDATA[]]></v>';
        }
    }
    
    private generateSetValuesXml(values: any): string {
        let xml = '';
        if (values.variables) {
            values.variables.forEach((variable: any) => {
                if (variable.name) {
                    xml += `\n            <n><![CDATA[${variable.name}]]></n>`;
                } else {
                    xml += '\n            <n />';
                }
                if (variable.value) {
                    xml += `\n            <v><![CDATA[${variable.value}]]></v>`;
                } else {
                    xml += '\n            <v />';
                }
            });
        }
        return xml;
    }
    
    private generateExternalValuesXml(values: any): string {
        if (values.externalValue) {
            return `\n            <v>${values.externalValue}</v>`;
        } else {
            return '\n            <v />';
        }
    }
    
    private generateLegacyValuesXml(values: any): string {
        let xml = '';
        
        // Legacy conditions
        if (values.conditions) {
            values.conditions.forEach((condition: string) => {
                xml += `\n            <v><![CDATA[${condition}]]></v>`;
            });
        }
        
        // Legacy query
        if (values.query) {
            xml += `\n            <query><![CDATA[${values.query}]]></query>`;
        }
        
        // Legacy parameters
        if (values.params) {
            values.params.forEach((param: any) => {
                xml += '\n            <param>';
                xml += `\n                <n>${param.name}</n>`;
                xml += `\n                <t>${param.type}</t>`;
                xml += `\n                <v><![CDATA[${param.value}]]></v>`;
                xml += '\n            </param>';
            });
        }
        
        return xml;
    }
    
    private updateWebview(webview: vscode.Webview): void {
        // Parse components and update visual editor
        if (this.activeDocument && this.visualEditor) {
            const vrmContent = this.activeDocument.getDocument().getText();
            const components = this.visualEditor.parseComponents(vrmContent);
            
            // Send update message to the webview
            webview.postMessage({
                type: 'updateComponents',
                components: components
            });
            
            // Also update the visual editor's internal state
            this.visualEditor.updateWebview(components);
        }
    }
}