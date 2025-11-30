export interface ComputerDisplayProps {
  instanceId: string;
  password: string;
  readOnly?: boolean;
  background?: string;
  className?: string;
  style?: React.CSSProperties;
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
}

export interface ComputerDisplayRef {
  reconnect: () => void;
  disconnect: () => void;
  sendClipboard: (text: string) => boolean;
  pasteFromClipboard: () => Promise<boolean>;
  isConnected: boolean;
}

export interface UseVNCConfig {
  url: string;
  credentials?: {
    username: string;
    password: string;
    target: string;
  };
  background?: string;
  viewOnly?: boolean;
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
}

export interface UseVNCReturn {
  vncRef: React.RefObject<HTMLDivElement | null>;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
  sendClipboard: (text: string) => boolean;
  pasteFromClipboard: () => Promise<boolean>;
}