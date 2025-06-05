import type { 
    ExtensionMessage,
    SaveMessage,
    ReadyMessage,
    LogMessage,
    ErrorMessage 
  } from '../../shared/messages';
  
  // VS Code API interface (available in webview context)
  declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    setState: (state: any) => void;
    getState: () => any;
  };
  
  class VsCodeService {
    private vscode: ReturnType<typeof acquireVsCodeApi>;
    private messageHandlers: Map<string, (message: ExtensionMessage) => void> = new Map();
  
    constructor() {
      this.vscode = acquireVsCodeApi();
      this.setupMessageListener();
    }
  
    private setupMessageListener(): void {
      window.addEventListener('message', (event) => {
        const message: ExtensionMessage = event.data;
        
        // Handle the message based on type
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        } else {
          console.warn('No handler for message type:', message.type);
        }
      });
    }
  
    // Register message handlers
    public onMessage(type: string, handler: (message: ExtensionMessage) => void): void {
      this.messageHandlers.set(type, handler);
    }
  
    // Remove message handler
    public offMessage(type: string): void {
      this.messageHandlers.delete(type);
    }
  
    // Send messages to extension
    public sendReady(): void {
      const message: ReadyMessage = {
        type: 'ready',
        timestamp: Date.now()
      };
      this.vscode.postMessage(message);
    }
  
    public sendSave(content: string): void {
      const message: SaveMessage = {
        type: 'save',
        content,
        timestamp: Date.now()
      };
      this.vscode.postMessage(message);
    }
  
    public sendLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
      const logMessage: LogMessage = {
        type: 'log',
        level,
        message,
        data,
        timestamp: Date.now()
      };
      this.vscode.postMessage(logMessage);
    }
  
    public sendError(error: string, stack?: string): void {
      const errorMessage: ErrorMessage = {
        type: 'error',
        error,
        stack,
        timestamp: Date.now()
      };
      this.vscode.postMessage(errorMessage);
    }
  
    // State management
    public setState(state: any): void {
      this.vscode.setState(state);
    }
  
    public getState(): any {
      return this.vscode.getState();
    }
  }
  
  // Export singleton instance
  export const vscodeService = new VsCodeService();