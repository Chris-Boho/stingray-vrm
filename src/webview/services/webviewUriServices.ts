// src/webview/services/webviewUriService.ts

class WebviewUriService {
  private static instance: WebviewUriService;
  private baseUri: string = '';

  private constructor() {
    // Check if we're in a VS Code webview context
    if (typeof window !== 'undefined' && window.__webviewUri) {
      this.baseUri = window.__webviewUri;
    }
  }

  public static getInstance(): WebviewUriService {
    if (!WebviewUriService.instance) {
      WebviewUriService.instance = new WebviewUriService();
    }
    return WebviewUriService.instance;
  }

  public getBaseUri(): string {
    return this.baseUri;
  }

  public resolveAssetUri(assetPath: string): string {
    // If it's already a full URI, return as-is
    if (assetPath.startsWith('http') || assetPath.startsWith('data:')) {
      return assetPath;
    }
    
    // Otherwise, prepend the base URI
    return this.baseUri ? `${this.baseUri}/${assetPath}` : assetPath;
  }
}

export const webviewUriService = WebviewUriService.getInstance();