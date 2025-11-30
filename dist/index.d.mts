import * as react from 'react';

interface ComputerDisplayProps {
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
interface ComputerDisplayRef {
    reconnect: () => void;
    disconnect: () => void;
    sendClipboard: (text: string) => boolean;
    pasteFromClipboard: () => Promise<boolean>;
    isConnected: boolean;
}
interface UseVNCConfig {
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
interface UseVNCReturn {
    vncRef: React.RefObject<HTMLDivElement | null>;
    isConnected: boolean;
    error: string | null;
    reconnect: () => void;
    disconnect: () => void;
    sendClipboard: (text: string) => boolean;
    pasteFromClipboard: () => Promise<boolean>;
}

declare const ComputerDisplay: react.ForwardRefExoticComponent<ComputerDisplayProps & react.RefAttributes<ComputerDisplayRef>>;

declare function useVNC({ url, credentials, background, viewOnly, scaleViewport, clipViewport, resizeSession, showDotCursor, compressionLevel, qualityLevel, onConnect, onDisconnect, onError, onClipboard, }: UseVNCConfig): UseVNCReturn;

export { ComputerDisplay, type ComputerDisplayProps, type ComputerDisplayRef, type UseVNCConfig, type UseVNCReturn, useVNC };
