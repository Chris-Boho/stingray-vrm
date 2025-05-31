// VSCodeApiHandler.ts - Centralized VS Code API management
import { VrmComponent, VsCodeApi, CustomWindow } from './types';

// Only declare window if we're in a browser environment
declare const window: CustomWindow | undefined;

export class VSCodeApiHandler {
  private static instance: VSCodeApiHandler | null = null;
  private vscode: VsCodeApi | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Only initialize VS Code API if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.initializeVSCodeApi();
    } else {
      console.log('Running in Node.js environment - VS Code API initialization skipped');
      this.isInitialized = true;
    }
  }

  // Singleton pattern to ensure only one instance
  public static getInstance(): VSCodeApiHandler {
    if (!VSCodeApiHandler.instance) {
      VSCodeApiHandler.instance = new VSCodeApiHandler();
    }
    return VSCodeApiHandler.instance;
  }

  private initializeVSCodeApi(): void {
    if (this.isInitialized) {
      console.log('✅ VS Code API already initialized');
      return;
    }

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Running in Node.js environment - VS Code API not available');
        this.vscode = null;
        this.isInitialized = true;
        return;
      }

      // Try to get existing VS Code API
      if (window.vscode) {
        this.vscode = window.vscode;
        console.log('✅ VS Code API found on window object');
      }
      // Try to acquire new VS Code API
      else if (window.acquireVsCodeApi) {
        this.vscode = window.acquireVsCodeApi();
        window.vscode = this.vscode; // Store for future use
        console.log('✅ VS Code API acquired successfully');
      }
      // No VS Code API available
      else {
        console.warn('⚠️ VS Code API not available - running outside VS Code');
        this.vscode = null;
      }

      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize VS Code API:', error);
      if (typeof window !== 'undefined') {
        this.vscode = window.vscode || null; // Fallback to existing instance
      }
      this.isInitialized = true;
    }
  }

  // Check if VS Code API is available
  public isAvailable(): boolean {
    return this.vscode !== null && typeof this.vscode.postMessage === 'function';
  }

  // Send a message to VS Code extension
  public postMessage(message: any): boolean {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cannot send message - VS Code API not available:', message);
      return false;
    }

    try {
      this.vscode!.postMessage(message);
      console.log('📤 Message sent to VS Code:', message.command);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message to VS Code:', error);
      return false;
    }
  }

  // =================================================================
  // COMPONENT OPERATIONS - These will properly mark document as dirty
  // =================================================================

  public updateComponent(component: VrmComponent): boolean {
    console.log(`📤 Sending component update for #${component.n} (${component.t})`);

    return this.postMessage({
      command: 'updateComponent',
      component: component
    });
  }

  public addComponent(component: VrmComponent): boolean {
    console.log(`📤 Sending component addition for #${component.n} (${component.t})`);

    return this.postMessage({
      command: 'addComponent',
      component: component
    });
  }

  public deleteComponent(component: VrmComponent): boolean {
    console.log(`📤 Sending component deletion for #${component.n} (${component.t})`);

    return this.postMessage({
      command: 'deleteComponent',
      component: component
    });
  }

  // =================================================================
  // EDITOR OPERATIONS
  // =================================================================

  public openHtmlEditor(): boolean {
    console.log('📤 Opening HTML editor');

    return this.postMessage({
      command: 'openHtml'
    });
  }

  public openJsEditor(): boolean {
    console.log('📤 Opening JavaScript editor');

    return this.postMessage({
      command: 'openJs'
    });
  }

  public openCodeEditor(content: string, language: string, filename: string, componentId?: number, componentType?: string): boolean {
    console.log(`📤 Opening code editor for component ${componentId} (${componentType})`);

    return this.postMessage({
      command: 'openCodeEditor',
      content: content,
      language: language,
      filename: filename,
      componentId: componentId,
      componentType: componentType
    });
  }

  // =================================================================
  // STATE MANAGEMENT
  // =================================================================

  public getState(): any {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cannot get state - VS Code API not available');
      return null;
    }

    try {
      return this.vscode!.getState();
    } catch (error) {
      console.error('❌ Failed to get VS Code state:', error);
      return null;
    }
  }

  public setState(state: any): boolean {
    if (!this.isAvailable()) {
      console.warn('⚠️ Cannot set state - VS Code API not available');
      return false;
    }

    try {
      this.vscode!.setState(state);
      return true;
    } catch (error) {
      console.error('❌ Failed to set VS Code state:', error);
      return false;
    }
  }

  // =================================================================
  // UTILITY METHODS
  // =================================================================

  public showNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): boolean {
    console.log(`📤 Showing ${type} notification: ${message}`);

    return this.postMessage({
      command: 'showNotification',
      message: message,
      type: type
    });
  }

  public refreshWebview(): boolean {
    console.log('📤 Requesting webview refresh');

    return this.postMessage({
      command: 'refreshWebview'
    });
  }

  // =================================================================
  // DEBUGGING METHODS
  // =================================================================

  public getDebugInfo(): object {
    return {
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable(),
      hasVscode: !!this.vscode,
      hasWindow: typeof window !== 'undefined',
      hasAcquireApi: typeof window !== 'undefined' && !!window?.acquireVsCodeApi,
      windowVscode: typeof window !== 'undefined' && !!window?.vscode
    };
  }

  public logDebugInfo(): void {
    console.log('🔍 VS Code API Debug Info:', this.getDebugInfo());
  }

  // =================================================================
  // STATIC INJECTION METHOD
  // =================================================================

  public static inject(): string {
    return `
            // Create global VS Code API handler instance
            window.vsCodeApiHandler = new (${VSCodeApiHandler.toString()})();
            
            // Make the handler globally accessible
            window.vscodeApi = window.vsCodeApiHandler;
            
            // Create convenience methods for common operations
            window.updateComponent = (component) => {
                return window.vsCodeApiHandler.updateComponent(component);
            };
            
            window.addComponent = (component) => {
                return window.vsCodeApiHandler.addComponent(component);
            };
            
            window.deleteComponent = (component) => {
                return window.vsCodeApiHandler.deleteComponent(component);
            };
            
            window.openHtmlEditor = () => {
                return window.vsCodeApiHandler.openHtmlEditor();
            };
            
            window.openJsEditor = () => {
                return window.vsCodeApiHandler.openJsEditor();
            };
            
            window.openCodeEditor = (content, language, filename, componentId, componentType) => {
                return window.vsCodeApiHandler.openCodeEditor(content, language, filename, componentId, componentType);
            };
            
            // Log initialization
            console.log('✅ VS Code API Handler injected and initialized');
            window.vsCodeApiHandler.logDebugInfo();
        `;
  }
}