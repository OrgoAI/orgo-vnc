declare module '@novnc/novnc/lib/rfb' {
    interface RFBCredentials {
      username?: string;
      password?: string;
      target?: string;
    }
  
    interface RFBOptions {
      credentials?: RFBCredentials;
      shared?: boolean;
      repeaterID?: string;
      wsProtocols?: string[];
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
      capabilities: { power: boolean };
  
      disconnect(): void;
      sendCredentials(credentials: RFBCredentials): void;
      sendKey(keysym: number, code: string | null, down?: boolean): void;
      sendCtrlAltDel(): void;
      focus(): void;
      blur(): void;
      machineShutdown(): void;
      machineReboot(): void;
      machineReset(): void;
      clipboardPasteFrom(text: string): void;
    }
  
    export default RFB;
  }