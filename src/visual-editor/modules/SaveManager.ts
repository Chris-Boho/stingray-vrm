import * as vscode from 'vscode';
import { DocumentState } from './DocumentState';
import { ComponentXmlGenerator } from '../ComponentXmlGenerator';
import { VrmDocument } from '../../VrmDocument';
import { VrmComponent } from '../../types';
import type { VrmEditorProvider } from '../../VrmEditorProvider';

export class SaveManager {
  private static instance: SaveManager;
  private documentState: DocumentState;
  private xmlGenerator: ComponentXmlGenerator;
  private vrmEditorProvider: VrmEditorProvider | null = null;

  private constructor() {
    this.documentState = DocumentState.getInstance();
    this.xmlGenerator = new ComponentXmlGenerator();
  }

  public static getInstance(vrmEditorProvider?: VrmEditorProvider): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    
    if (vrmEditorProvider) {
      SaveManager.instance.vrmEditorProvider = vrmEditorProvider;
    }
    
    return SaveManager.instance;
  }

  /**
   * Updates a single component in the document
   */
  public async updateComponent(document: vscode.TextDocument, component: VrmComponent, webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      // Update component in DocumentState
      this.documentState.updateComponent(component);

      // Save the document to persist changes
      await this.saveDocument(document);

      // Notify webview of the update
      webviewPanel.webview.postMessage({
        command: 'componentUpdated',
        component
      });
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  /**
   * Updates multiple components in the document
   */
  public async updateMultipleComponents(document: vscode.TextDocument, components: VrmComponent[], webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      // Update each component in DocumentState
      components.forEach(component => {
        this.documentState.updateComponent(component);
      });

      // Save the document to persist changes
      await this.saveDocument(document);

      // Notify webview of the updates
      webviewPanel.webview.postMessage({
        command: 'componentsUpdated',
        components
      });
    } catch (error) {
      console.error('Error updating multiple components:', error);
      throw error;
    }
  }

  /**
   * Adds a new component to the document
   */
  public async addComponent(document: vscode.TextDocument, component: VrmComponent, webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      // Add component to DocumentState
      this.documentState.addComponent(component);

      // Save the document to persist changes
      await this.saveDocument(document);

      // Notify webview of the new component
      webviewPanel.webview.postMessage({
        command: 'componentAdded',
        component
      });
    } catch (error) {
      console.error('Error adding component:', error);
      throw error;
    }
  }

  /**
   * Deletes a component from the document
   */
  public async deleteComponent(document: vscode.TextDocument, component: VrmComponent, webviewPanel: vscode.WebviewPanel): Promise<void> {
    try {
      // Delete component from DocumentState
      this.documentState.deleteComponent(component);

      // Save the document to persist changes
      await this.saveDocument(document);

      // Notify webview of the deletion
      webviewPanel.webview.postMessage({
        command: 'componentDeleted',
        component
      });
    } catch (error) {
      console.error('Error deleting component:', error);
      throw error;
    }
  }

  /**
   * Updates the HTML content in the document
   */
  public async updateHtmlContent(document: vscode.TextDocument, content: string): Promise<void> {
    try {
      // Update HTML content in DocumentState
      this.documentState.updateHtmlContent(content);

      // Save the document to persist changes
      await this.saveDocument(document);
    } catch (error) {
      console.error('Error updating HTML content:', error);
      throw error;
    }
  }

  /**
   * Updates the JavaScript content in the document
   */
  public async updateJsContent(document: vscode.TextDocument, content: string): Promise<void> {
    try {
      // Update JS content in DocumentState
      this.documentState.updateJsContent(content);

      // Save the document to persist changes
      await this.saveDocument(document);
    } catch (error) {
      console.error('Error updating JavaScript content:', error);
      throw error;
    }
  }

  /**
   * Saves all dirty state to the document
   */
  private async cleanupComponentTempFiles(componentIds: (number | string)[]): Promise<void> {
    if (!this.vrmEditorProvider) return;
    
    for (const componentId of componentIds) {
      if (componentId) {
        try {
          // Use type assertion to access private method
          await (this.vrmEditorProvider as any).cleanupComponentTempFile(
            this.vrmEditorProvider.getDocumentPath(),
            componentId
          );
        } catch (error) {
          console.error(`Error cleaning up temp files for component ${componentId}:`, error);
        }
      }
    }
  }

  private getDocumentPath(): string {
    // This is a helper method that should be called on the VrmEditorProvider instance
    // It will be overridden by the actual implementation
    return '';
  }

  private async saveDocument(document: vscode.TextDocument): Promise<void> {
    try {
      let currentContent = document.getText();
      let hasChanges = false;

      // First handle component changes
      const dirtyComponents = this.documentState.getDirtyComponents();
      if (dirtyComponents.length > 0) {
        // Separate new and existing components
        const newComponents = dirtyComponents.filter(component => !component.n);
        const existingComponents = dirtyComponents.filter(component => component.n);

        // Handle new components first
        if (newComponents.length > 0) {
          console.log(`SaveManager: Inserting ${newComponents.length} new components`);
          for (const component of newComponents) {
            const sectionTag = component.section === 'preproc' ? 'preproc' : 'postproc';
            const sectionEndTag = `</${sectionTag}>`;
            const endIndex = currentContent.indexOf(sectionEndTag);
            if (endIndex === -1) {
              throw new Error(`Could not find ${sectionEndTag} tag in document`);
            }

            // Insert the new component before the closing tag with proper indentation
            const componentXml = this.xmlGenerator.generateComponentXml(component);
            const beforeEndTag = currentContent.substring(0, endIndex);
            const afterEndTag = currentContent.substring(endIndex);
            currentContent = beforeEndTag + '\t\t' + componentXml + '\n\t\t' + afterEndTag;
          }
          hasChanges = true;
        }

        // Then handle updates to existing components
        if (existingComponents.length > 0) {
          console.log(`SaveManager: Updating ${existingComponents.length} existing components`);
          for (const component of existingComponents) {
            currentContent = this.xmlGenerator.updateComponentInXml(currentContent, component);
          }
          hasChanges = true;
        }
      }

      // Handle HTML and JS changes separately to avoid conflicts
      const vrmDocument = new VrmDocument(document);
      let updatedContent = currentContent;

      // Save HTML if dirty
      if (this.documentState.isHtmlContentDirty()) {
        console.log('SaveManager: Saving HTML content');
        try {
          updatedContent = await vrmDocument.updateHtmlContent(this.documentState.getHtmlContent());
          hasChanges = true;
        } catch (error) {
          console.error('Error saving HTML content:', error);
          throw new Error(`Failed to save HTML content: ${error}`);
        }
      }

      // Save JS if dirty
      if (this.documentState.isJsContentDirty()) {
        console.log('SaveManager: Saving JavaScript content');
        try {
          updatedContent = await vrmDocument.updateJsContent(this.documentState.getJsContent());
          hasChanges = true;
        } catch (error) {
          console.error('Error saving JavaScript content:', error);
          throw new Error(`Failed to save JavaScript content: ${error}`);
        }
      }

      // Only apply workspace edit if we have changes
      if (hasChanges) {
        await this.applyWorkspaceEdit(document, updatedContent);
        
        // Clean up temp files for all modified components
        const dirtyComponents = this.documentState.getDirtyComponents();
        const componentIds = dirtyComponents.map(c => c.n).filter(Boolean);
        if (componentIds.length > 0) {
          await this.cleanupComponentTempFiles(componentIds);
        }
        
        this.documentState.clearDirtyState();
        console.log('SaveManager: ✅ Document saved successfully');
      } else {
        console.log('SaveManager: No changes to save');
      }

    } catch (error) {
      console.error('SaveManager: Error saving document:', error);
      throw error;
    }
  }

  /**
   * Applies a workspace edit to the document
   */
  private async applyWorkspaceEdit(
    document: vscode.TextDocument,
    newContent: string
  ): Promise<void> {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );

    edit.replace(document.uri, fullRange, newContent);
    const success = await vscode.workspace.applyEdit(edit);

    if (!success) {
      throw new Error('Failed to apply workspace edit');
    }
  }

  /**
   * Checks if the document has unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return this.documentState.hasDirtyState();
  }
} 