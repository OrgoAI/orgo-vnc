import type { CSSProperties } from 'react';

export interface ComputerDisplayHandle {
  reconnect: () => void;
  disconnect: () => void;
  sendClipboard: (text: string) => boolean;
  pasteFromClipboard: () => Promise<boolean>;
  isConnected: boolean;
}

export interface ComputerDisplayProps {
  hostname: string;
  password: string;
  readOnly?: boolean;
  background?: string;
  className?: string;
  style?: CSSProperties;
  scaleViewport?: boolean;
  clipViewport?: boolean;
  resizeSession?: boolean;
  showDotCursor?: boolean;
  compressionLevel?: number;
  qualityLevel?: number;
  onConnect?: () => void;
  onDisconnect?: (clean: boolean) => void;
  onError?: (error: string) => void;
  onClipboard?: (text: string) => void;
  onReady?: (handle: ComputerDisplayHandle) => void;
}