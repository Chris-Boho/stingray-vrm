import * as vscode from 'vscode';
import { VrmEditorProvider } from './VrmEditorProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('VRM Editor extension is now active');

    // Register the custom editor provider
    const provider = new VrmEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
        'vrmEditor.editor',
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
            supportsMultipleEditorsPerDocument: false,
        }
    );

    // Register the "Open with VRM Editor" command
    const openEditorCommand = vscode.commands.registerCommand(
        'vrmEditor.openEditor',
        (uri: vscode.Uri) => {
            vscode.commands.executeCommand('vscode.openWith', uri, 'vrmEditor.editor');
        }
    );

    // Add to context subscriptions for proper cleanup
    context.subscriptions.push(
        providerRegistration,
        openEditorCommand
    );

    console.log('VRM Editor provider registered successfully');
}

export function deactivate() {
    console.log('VRM Editor extension is deactivated');
}