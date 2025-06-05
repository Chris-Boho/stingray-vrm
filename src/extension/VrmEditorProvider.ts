import * as vscode from 'vscode';
import * as path from 'path';

export class VrmEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new VrmEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            VrmEditorProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'vrmEditor.editor';

    constructor(private readonly context: vscode.ExtensionContext) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        console.log('VRM Editor: Resolving custom text editor for:', document.uri.toString());
        
        // Setup initial webview options
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        // Set the HTML content for the webview
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        console.log('VRM Editor: HTML content set for webview');

        // Update webview when document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview(webviewPanel.webview, document);
            }
        });

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            message => {
                console.log('VRM Editor: Received message from webview:', message);
                this.handleWebviewMessage(document, message);
            },
            undefined,
            this.context.subscriptions
        );

        // Clean up subscriptions when webview is disposed
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Send initial document content to webview
        console.log('VRM Editor: Sending initial content to webview');
        this.updateWebview(webviewPanel.webview, document);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        // Get the webview build directory (now in out/webview)
        const webviewUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')
        );
        
        // Use a nonce for security
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; img-src ${webview.cspSource} https: data:;">
                <title>VRM Editor</title>
                <link rel="stylesheet" href="${webviewUri}/main.css">
                
                <style>
                    html, body, #root {
                        height: 100%;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                        font-family: var(--vscode-font-family);
                        font-size: var(--vscode-font-size);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                </style>
            </head>
            <body>
                <div id="root">Loading VRM Editor...</div>
                <script nonce="${nonce}">
                    console.log('VRM Editor webview script loading...');
                    console.log('Base URI:', '${webviewUri}');
                </script>
                <script nonce="${nonce}" src="${webviewUri}/main.js"></script>
            </body>
            </html>`;
    }

    private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
        const message = {
            type: 'update',
            content: document.getText(),
            uri: document.uri.toString()
        };
        console.log('VRM Editor: Posting message to webview:', message);
        webview.postMessage(message);
    }

    private handleWebviewMessage(document: vscode.TextDocument, message: any): void {
        switch (message.type) {
            case 'save':
                this.saveDocument(document, message.content);
                break;
            
            case 'ready':
                // Webview is ready - we'll send initial content in resolveCustomTextEditor
                console.log('Webview ready for document:', document.uri.toString());
                break;
                
            default:
                console.log('Unknown message type:', message.type);
                break;
        }
    }

    private async saveDocument(document: vscode.TextDocument, content: string): Promise<void> {
        const workspaceEdit = new vscode.WorkspaceEdit();
        
        // Replace entire document content
        workspaceEdit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            content
        );

        await vscode.workspace.applyEdit(workspaceEdit);
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}