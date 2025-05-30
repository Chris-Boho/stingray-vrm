import * as vscode from 'vscode';
import { VrmParser } from './VrmParser';

export class VrmDocument {
    private parser: VrmParser;

    constructor(private document: vscode.TextDocument) {
        this.parser = new VrmParser(document.getText());
    }

    get uri(): vscode.Uri {
        return this.document.uri;
    }

    public getDocument(): vscode.TextDocument {
        return this.document;
    }

    public getHtmlContent(): string {
        return this.parser.extractHtml();
    }

    public getJsContent(): string {
        return this.parser.extractJavaScript();
    }

    public updateHtmlContent(newHtml: string): string {
        const updatedContent = this.parser.updateHtml(newHtml);
        this.applyEdit(updatedContent);
        return updatedContent;
    }

    public updateJsContent(newJs: string): string {
        const updatedContent = this.parser.updateJavaScript(newJs);
        this.applyEdit(updatedContent);
        return updatedContent;
    }

    private applyEdit(newContent: string): void {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            this.document.positionAt(0),
            this.document.positionAt(this.document.getText().length)
        );
        edit.replace(this.document.uri, fullRange, newContent);
        vscode.workspace.applyEdit(edit);
    }
}