import { VrmComponent, SectionType } from '../webview/types/vrm';

// Base message interface
export interface BaseMessage {
    type: string;
    timestamp?: number;
  }
  
  // Messages sent from Extension to Webview
  export interface ExtensionToWebviewMessage extends BaseMessage {
    type: 'update' | 'theme-changed' | 'settings-changed' | 'clipboard-status' | 'clipboard-data' | 'paste-error';
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

  export interface ClipboardStatusMessage extends ExtensionToWebviewMessage {
    type: 'clipboard-status';
    hasData: boolean;
    componentCount: number;
    sourceFile?: string;
  }

  export interface ClipboardDataMessage extends ExtensionToWebviewMessage {
    type: 'clipboard-data';
    data: {
      components: VrmComponent[];
      copyOrigin: { x: number; y: number };
      targetPosition: { x: number; y: number };
      section: SectionType;
    };
  }

  export interface PasteErrorMessage extends ExtensionToWebviewMessage {
    type: 'paste-error';
    error: string;
  }
  
  // Messages sent from Webview to Extension
  export interface WebviewToExtensionMessage extends BaseMessage {
    type: 'ready' | 'save' | 'error' | 'log' | 'copy-components' | 'paste-components' | 'get-clipboard-status' | 'clear-clipboard';
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

  export interface CopyComponentsMessage extends WebviewToExtensionMessage {
    type: 'copy-components';
    components: VrmComponent[];
    copyOrigin: { x: number; y: number };
  }

  export interface PasteComponentsMessage extends WebviewToExtensionMessage {
    type: 'paste-components';
    targetPosition: { x: number; y: number };
    section: SectionType;
  }

  export interface GetClipboardStatusMessage extends WebviewToExtensionMessage {
    type: 'get-clipboard-status';
  }

  export interface ClearClipboardMessage extends WebviewToExtensionMessage {
    type: 'clear-clipboard';
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
  export type ExtensionMessage = 
    | UpdateMessage 
    | ThemeChangedMessage 
    | SettingsChangedMessage 
    | ClipboardStatusMessage 
    | ClipboardDataMessage 
    | PasteErrorMessage;

  export type WebviewMessage = 
    | ReadyMessage 
    | SaveMessage 
    | ErrorMessage 
    | LogMessage 
    | CopyComponentsMessage 
    | PasteComponentsMessage 
    | GetClipboardStatusMessage 
    | ClearClipboardMessage;
  
  // Message handler types
  export type ExtensionMessageHandler = (message: WebviewMessage) => void;
  export type WebviewMessageHandler = (message: ExtensionMessage) => void;