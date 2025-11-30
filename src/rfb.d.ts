declare module '@novnc/novnc/lib/rfb' {
  interface RFBCredentials {
    username?: string;
    password?: string;
    target?: string;
  }

  interface RFBOptions {
    credentials?: RFBCredentials;
    shared?: boolean;
  }

  class RFB extends EventTarget {
    constructor(target: HTMLElement, url: string, options?: RFBOptions);
    viewOnly: boolean;
    scaleViewport: boolean;
    clipViewport: boolean;
    resizeSession: boolean;
    background: string;
    compressionLevel: number;
    qualityLevel: number;
    showDotCursor: boolean;
    focusOnClick: boolean;
    disconnect(): void;
    clipboardPasteFrom(text: string): void;
  }

  export default RFB;
}