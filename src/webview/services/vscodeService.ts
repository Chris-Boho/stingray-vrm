import type { 
  ExtensionMessage, 
  WebviewMessage, 
  ReadyMessage, 
  SaveMessage, 
  ErrorMessage, 
  LogMessage,
  CopyComponentsMessage,
  PasteComponentsMessage,
  GetClipboardStatusMessage,
  ClearClipboardMessage
} from '../../shared/messages';
import { VrmComponent, SectionType } from '../types/vrm';

// More type-safe VS Code webview API interface
interface VsCodeApi<T = unknown> {
  postMessage: (message: WebviewMessage) => void;
  getState: () => T | undefined;
  setState: (state: T) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi: <T = unknown>() => VsCodeApi<T>;
  }
}

class VscodeService {
  private vscode: VsCodeApi;
  private handlers: Map<string, ((message: ExtensionMessage) => void)[]> = new Map();
  private messageQueue: ExtensionMessage[] = []; // Queue for early messages
  private isReady = false;

  constructor() {
    this.vscode = window.acquireVsCodeApi();
    this.setupMessageListener();
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      const message = event.data as ExtensionMessage;
      
      if (!this.isReady) {
        // Queue messages that arrive before handlers are ready
        console.log('Queueing early message:', message.type);
        this.messageQueue.push(message);
        return;
      }
      
      this.handleMessage(message);
    });
  }

  private handleMessage(message: ExtensionMessage) {
    const handlers = this.handlers.get(message.type) || [];
    
    if (handlers.length === 0) {
      console.warn(`No handler for message type: ${message.type}`);
      return;
    }
    
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error(`Error handling message ${message.type}:`, error);
      }
    });
  }

  private processQueuedMessages() {
    console.log(`Processing ${this.messageQueue.length} queued messages`);
    
    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];
    
    queuedMessages.forEach(message => {
      this.handleMessage(message);
    });
  }

  // Mark service as ready and process queued messages
  public markReady() {
    this.isReady = true;
    this.processQueuedMessages();
  }

  public onMessage(type: string, handler: (message: ExtensionMessage) => void) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  public offMessage(type: string, handler?: (message: ExtensionMessage) => void) {
    if (!this.handlers.has(type)) {
      return;
    }
    
    if (handler) {
      const handlers = this.handlers.get(type)!;
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.handlers.delete(type);
    }
  }

  public sendReady() {
    const message: ReadyMessage = {
      type: 'ready',
      timestamp: Date.now()
    };
    this.vscode.postMessage(message);
  }

  public sendSave(content: string) {
    const message: SaveMessage = {
      type: 'save',
      content,
      timestamp: Date.now()
    };
    this.vscode.postMessage(message);
  }

  public sendError(error: string, stack?: string) {
    const message: ErrorMessage = {
      type: 'error',
      error,
      stack,
      timestamp: Date.now()
    };
    this.vscode.postMessage(message);
  }

  public sendLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) {
    const logMessage: LogMessage = {
      type: 'log',
      level,
      message,
      data,
      timestamp: Date.now()
    };
    this.vscode.postMessage(logMessage);
  }

  // Clipboard-related message senders
  public sendCopyComponents(components: VrmComponent[], copyOrigin: { x: number; y: number }) {
    const message: CopyComponentsMessage = {
      type: 'copy-components',
      components,
      copyOrigin,
      timestamp: Date.now()
    };
    
    console.log(`Sending copy-components message: ${components.length} components`);
    this.vscode.postMessage(message);
  }

  public sendPasteComponents(targetPosition: { x: number; y: number }, section: SectionType) {
    const message: PasteComponentsMessage = {
      type: 'paste-components',
      targetPosition,
      section,
      timestamp: Date.now()
    };
    
    console.log(`Sending paste-components message at (${targetPosition.x}, ${targetPosition.y}) in ${section}`);
    this.vscode.postMessage(message);
  }

  public sendGetClipboardStatus() {
    const message: GetClipboardStatusMessage = {
      type: 'get-clipboard-status',
      timestamp: Date.now()
    };
    
    console.log('Requesting clipboard status from extension');
    this.vscode.postMessage(message);
  }

  public sendClearClipboard() {
    const message: ClearClipboardMessage = {
      type: 'clear-clipboard',
      timestamp: Date.now()
    };
    
    console.log('Sending clear clipboard request');
    this.vscode.postMessage(message);
  }

  // Generic postMessage method for direct message passing
  public postMessage(message: WebviewMessage) {
    console.log('Sending message to extension:', message.type);
    this.vscode.postMessage(message);
  }

  // Clipboard message handler setup helpers
  public setupClipboardHandlers(handlers: {
    onClipboardStatus?: (hasData: boolean, componentCount: number, sourceFile?: string) => void;
    onClipboardData?: (data: any) => void;
    onPasteError?: (error: string) => void;
  }) {
    if (handlers.onClipboardStatus) {
      this.onMessage('clipboard-status', (message) => {
        if (message.type === 'clipboard-status') {
          handlers.onClipboardStatus!(
            message.hasData, 
            message.componentCount, 
            message.sourceFile
          );
        }
      });
    }

    if (handlers.onClipboardData) {
      this.onMessage('clipboard-data', (message) => {
        if (message.type === 'clipboard-data') {
          handlers.onClipboardData!(message.data);
        }
      });
    }

    if (handlers.onPasteError) {
      this.onMessage('paste-error', (message) => {
        if (message.type === 'paste-error') {
          handlers.onPasteError!(message.error);
        }
      });
    }
  }

  // Remove clipboard handlers
  public removeClipboardHandlers() {
    this.offMessage('clipboard-status');
    this.offMessage('clipboard-data');
    this.offMessage('paste-error');
  }

  // Utility method to check if clipboard operations are supported
  public supportsClipboard(): boolean {
    return this.isReady;
  }

  // Get current ready state
  public getReadyState(): boolean {
    return this.isReady;
  }

  // Debug method to list active handlers
  public getActiveHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const vscodeService = new VscodeService();