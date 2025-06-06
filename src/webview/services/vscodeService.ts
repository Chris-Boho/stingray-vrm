import type { 
  ExtensionMessage, 
  WebviewMessage, 
  ReadyMessage, 
  SaveMessage, 
  ErrorMessage, 
  LogMessage 
} from '../../shared/messages';

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
    if (!this.handlers.has(type)) return;
    
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
}

export const vscodeService = new VscodeService();