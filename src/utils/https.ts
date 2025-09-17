/**
 * HTTPS utilities for ensuring secure connections in production
 */

export class HttpsUtils {
  /**
   * Ensures the URL is HTTPS in production environments
   */
  static ensureHttps(url: string): string {
    if (!url) return url;
    
    // In development, allow HTTP for localhost
    if (import.meta.env.DEV && url.includes('localhost')) {
      return url;
    }
    
    // In production, enforce HTTPS
    if (import.meta.env.PROD && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  }
  
  /**
   * Gets the appropriate API base URL with HTTPS enforcement
   */
  static getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    
    if (envUrl) {
      return this.ensureHttps(envUrl);
    }
    
    // Default fallback - use HTTP for local development
    return import.meta.env.DEV ? 'http://localhost:4000' : 'https://localhost:4000';
  }
  
  /**
   * Checks if the current page is served over HTTPS
   */
  static isHttpsConnection(): boolean {
    return window.location.protocol === 'https:';
  }
  
  /**
   * Redirects to HTTPS if not already using it (production only)
   */
  static enforceHttps(): void {
    if (import.meta.env.PROD && !this.isHttpsConnection()) {
      const httpsUrl = window.location.href.replace('http://', 'https://');
      window.location.replace(httpsUrl);
    }
  }
  
  /**
   * Creates CSP-compliant URLs for external resources
   */
  static createSecureResourceUrl(url: string): string {
    if (!url.startsWith('http')) {
      return url; // Relative URLs are fine
    }
    
    return this.ensureHttps(url);
  }
}

// Auto-enforce HTTPS on page load in production
if (import.meta.env.PROD) {
  HttpsUtils.enforceHttps();
}
