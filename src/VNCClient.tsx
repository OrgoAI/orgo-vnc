'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import RFB from '@novnc/novnc/lib/rfb';
import type { ComputerDisplayProps } from './types';

interface ExtendedRFB extends InstanceType<typeof RFB> {
  _sock?: { _websocket?: WebSocket };
}

export function VNCClient({
  hostname,
  password,
  readOnly = false,
  background = '#000',
  className,
  style,
  scaleViewport = true,
  clipViewport = true,
  resizeSession = true,
  showDotCursor = true,
  compressionLevel = 2,
  qualityLevel = 6,
  onConnect,
  onDisconnect,
  onError,
  onClipboard,
  onReady,
}: ComputerDisplayProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const rfbRef = useRef<ExtendedRFB | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const callbackRefs = useRef({ onConnect, onDisconnect, onError, onClipboard });
  callbackRefs.current = { onConnect, onDisconnect, onError, onClipboard };

  useEffect(() => {
    if (!container || !hostname) return;

    let rfb: ExtendedRFB;
    try {
      rfb = new RFB(container, `wss://${hostname}/websockify`, {
        credentials: { username: 'user', password, target: hostname },
        shared: true,
      }) as ExtendedRFB;
    } catch (err) {
      callbackRefs.current.onError?.(err instanceof Error ? err.message : 'Connection failed');
      return;
    }

    rfb.viewOnly = readOnly;
    rfb.scaleViewport = scaleViewport;
    rfb.clipViewport = clipViewport;
    rfb.resizeSession = resizeSession;
    rfb.background = background;
    rfb.compressionLevel = compressionLevel;
    rfb.qualityLevel = qualityLevel;
    rfb.showDotCursor = showDotCursor;
    rfb.focusOnClick = true;
    rfbRef.current = rfb;

    const onRfbConnect = () => {
      setIsConnected(true);
      callbackRefs.current.onConnect?.();
    };

    const onRfbDisconnect = (e: Event) => {
      setIsConnected(false);
      callbackRefs.current.onDisconnect?.((e as CustomEvent<{ clean: boolean }>).detail?.clean ?? true);
    };

    const onRfbClipboard = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (text) {
        callbackRefs.current.onClipboard?.(text);
        navigator.clipboard?.writeText(text).catch(() => {});
      }
    };

    const onRfbSecurityFailure = (e: Event) => {
      const detail = (e as CustomEvent<{ reason?: string; status?: number }>).detail;
      const reason = detail?.reason || `Code ${detail?.status || 'unknown'}`;
      if (!reason.includes('Resize is administratively prohibited')) {
        callbackRefs.current.onError?.(`Security failure: ${reason}`);
      }
    };

    const onRfbCredentialsRequired = () => {
      callbackRefs.current.onError?.('Credentials required');
    };

    rfb.addEventListener('connect', onRfbConnect as EventListener);
    rfb.addEventListener('disconnect', onRfbDisconnect as EventListener);
    rfb.addEventListener('clipboard', onRfbClipboard as EventListener);
    rfb.addEventListener('securityfailure', onRfbSecurityFailure as EventListener);
    rfb.addEventListener('credentialsrequired', onRfbCredentialsRequired as EventListener);

    return () => {
      rfb.removeEventListener('connect', onRfbConnect as EventListener);
      rfb.removeEventListener('disconnect', onRfbDisconnect as EventListener);
      rfb.removeEventListener('clipboard', onRfbClipboard as EventListener);
      rfb.removeEventListener('securityfailure', onRfbSecurityFailure as EventListener);
      rfb.removeEventListener('credentialsrequired', onRfbCredentialsRequired as EventListener);
      try { rfb._sock?._websocket?.close(1000); rfb.disconnect(); } catch {}
      rfbRef.current = null;
    };
  }, [container, hostname, password, readOnly, background, scaleViewport, clipViewport, resizeSession, showDotCursor, compressionLevel, qualityLevel]);

  const disconnect = useCallback(() => {
    try { rfbRef.current?._sock?._websocket?.close(1000); rfbRef.current?.disconnect(); } catch {}
    rfbRef.current = null;
  }, []);

  const sendClipboard = useCallback((text: string) => {
    if (!rfbRef.current || !isConnected || !text) return false;
    try { rfbRef.current.clipboardPasteFrom(text); return true; } catch { return false; }
  }, [isConnected]);

  const pasteFromClipboard = useCallback(async () => {
    if (!rfbRef.current || !isConnected) return false;
    try {
      const text = await navigator.clipboard.readText();
      if (text) { rfbRef.current.clipboardPasteFrom(text); return true; }
    } catch {}
    return false;
  }, [isConnected]);

  useEffect(() => {
    onReady?.({ reconnect: disconnect, disconnect, sendClipboard, pasteFromClipboard, isConnected });
  }, [isConnected, onReady, disconnect, sendClipboard, pasteFromClipboard]);

  return (
    <div
      ref={setContainer}
      className={className}
      style={{ width: '100%', height: '100%', background, ...style }}
    />
  );
}