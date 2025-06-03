// Base message interface
export interface BaseMessage {
    type: string;
    timestamp?: number;
  }
  
  // Messages sent from Extension to Webview
  export interface ExtensionToWebviewMessage extends BaseMessage {
    type: 'update' | 'theme-changed' | 'settings-changed';
  }
  
  export interface UpdateMessage extends ExtensionToWebviewMessage {
    type: 'update';
    content: string;
    uri: string;
  }
  
  export interface ThemeChangedMessage extends ExtensionToWebviewMessage {
    type: 'theme-changed';
    theme: 'light' | 'dark' | 'high-contrast';
  }
  
  export interface SettingsChangedMessage extends ExtensionToWebviewMessage {
    type: 'settings-changed';
    settings: VrmEditorSettings;
  }
  
  // Messages sent from Webview to Extension
  export interface WebviewToExtensionMessage extends BaseMessage {
    type: 'ready' | 'save' | 'error' | 'log';
  }
  
  export interface ReadyMessage extends WebviewToExtensionMessage {
    type: 'ready';
  }
  
  export interface SaveMessage extends WebviewToExtensionMessage {
    type: 'save';
    content: string;
  }
  
  export interface ErrorMessage extends WebviewToExtensionMessage {
    type: 'error';
    error: string;
    stack?: string;
  }
  
  export interface LogMessage extends WebviewToExtensionMessage {
    type: 'log';
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data?: any;
  }
  
  // Settings interface
  export interface VrmEditorSettings {
    autoSave: boolean;
    autoSaveDelay: number;
    gridSize: {
      x: number;
      y: number;
    };
    theme?: {
      componentColors?: Record<string, string>;
      gridVisible?: boolean;
    };
  }
  
  // Union types for type safety
  export type ExtensionMessage = UpdateMessage | ThemeChangedMessage | SettingsChangedMessage;
  export type WebviewMessage = ReadyMessage | SaveMessage | ErrorMessage | LogMessage;
  
  // Message handler types
  export type ExtensionMessageHandler = (message: WebviewMessage) => void;
  export type WebviewMessageHandler = (message: ExtensionMessage) => void;