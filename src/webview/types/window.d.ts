declare global {
  interface Window {
    __webviewUri?: string;
    acquireVsCodeApi: <T = unknown>() => {
      postMessage: (message: any) => void;
      getState: () => T | undefined;
      setState: (state: T) => void;
    };
  }
}

export {};