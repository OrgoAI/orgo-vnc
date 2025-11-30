import { useState, useEffect, useRef, useCallback } from 'react';
import RFB from '@novnc/novnc/lib/rfb';
import type { UseVNCConfig, UseVNCReturn } from './types';

interface ExtendedRFB extends RFB {
  _eventListeners?: Record<string, EventListener[]>;
  _sock?: { _websocket?: WebSocket };
}

export function useVNC({
  url,
  credentials,
  background = '#1E1E1E',
  viewOnly = false,
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
}: UseVNCConfig): UseVNCReturn {
  const vncRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isDisconnecting = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const connecting = useRef(false);

  const disconnect = useCallback(() => {
    if (isDisconnecting.current) return;
    isDisconnecting.current = true;

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    if (rfbRef.current) {
      const rfb = rfbRef.current as ExtendedRFB;
      rfbRef.current = null;

      try {
        const events = ['connect', 'disconnect', 'credentialsrequired', 'securityfailure', 'clipboard'];
        events.forEach(event => {
          const listeners = rfb._eventListeners?.[event];
          if (Array.isArray(listeners)) {
            [...listeners].forEach(listener => {
              try { rfb.removeEventListener(event, listener); } catch {}
            });
          }
        });
      } catch {}

      try {
        const ws = rfb._sock?._websocket;
        if (ws?.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Normal closure');
        }
      } catch {}

      try { rfb.disconnect(); } catch {}
    }

    isDisconnecting.current = false;
  }, []);

  const connect = useCallback(() => {
    if (!vncRef.current || !url || !isMounted.current || connecting.current || isDisconnecting.current) return;

    connecting.current = true;

    setTimeout(() => {
      if (!isMounted.current || !vncRef.current) {
        connecting.current = false;
        return;
      }

      try {
        const rfb = new RFB(vncRef.current, url, {
          credentials: {
            username: credentials?.username || '',
            password: credentials?.password || '',
            target: credentials?.target || '',
          },
          shared: true,
        });

        rfb.viewOnly = viewOnly;
        rfb.scaleViewport = scaleViewport;
        rfb.clipViewport = clipViewport;
        rfb.resizeSession = resizeSession;
        rfb.background = background;
        rfb.compressionLevel = compressionLevel;
        rfb.qualityLevel = qualityLevel;
        rfb.showDotCursor = showDotCursor;
        rfb.focusOnClick = true;

        rfb.addEventListener('connect', (() => {
          if (!isMounted.current) {
            try { rfb.disconnect(); } catch {}
            connecting.current = false;
            return;
          }
          setIsConnected(true);
          setError(null);
          retryCount.current = 0;
          connecting.current = false;
          onConnect?.();
        }) as EventListener);

        rfb.addEventListener('clipboard', ((e: Event) => {
          const detail = (e as CustomEvent<{ text: string }>).detail;
          if (!isMounted.current || !detail?.text) return;
          onClipboard?.(detail.text);
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(detail.text).catch(() => {});
          }
        }) as EventListener);

        rfb.addEventListener('disconnect', ((e: Event) => {
          const detail = (e as CustomEvent<{ clean: boolean }>).detail;
          if (!isMounted.current) {
            connecting.current = false;
            return;
          }

          setIsConnected(false);
          onDisconnect?.(detail?.clean ?? true);

          if (detail?.clean === false && isMounted.current && retryCount.current < 5) {
            const delay = Math.min(1000 * Math.pow(1.5, retryCount.current) + Math.random() * 300, 8000);
            retryTimer.current = setTimeout(() => {
              if (isMounted.current && !isDisconnecting.current) {
                retryCount.current++;
                connecting.current = false;
                if (rfbRef.current) disconnect();
                setTimeout(() => isMounted.current && connect(), 100);
              } else {
                connecting.current = false;
              }
            }, delay);
            setError(`Reconnecting... (${retryCount.current + 1}/5)`);
          } else if (detail?.clean === false) {
            setError('Connection lost');
            onError?.('Connection lost');
            connecting.current = false;
          } else {
            connecting.current = false;
          }
        }) as EventListener);

        rfb.addEventListener('securityfailure', ((e: Event) => {
          const detail = (e as CustomEvent<{ reason?: string; status?: number }>).detail;
          if (!isMounted.current) {
            connecting.current = false;
            return;
          }
          const reason = detail?.reason || `Code ${detail?.status || 'unknown'}`;
          if (!reason.includes('Resize is administratively prohibited')) {
            setError(`Security failure: ${reason}`);
            onError?.(`Security failure: ${reason}`);
          }
          connecting.current = false;
        }) as EventListener);

        rfb.addEventListener('credentialsrequired', (() => {
          if (!isMounted.current) {
            connecting.current = false;
            return;
          }
          setError('Credentials required');
          onError?.('Credentials required');
          connecting.current = false;
        }) as EventListener);

        rfbRef.current = rfb;

        setTimeout(() => {
          if (rfbRef.current && vncRef.current) {
            window.dispatchEvent(new Event('resize'));
            const canvas = vncRef.current.querySelector('canvas');
            if (canvas) {
              canvas.style.width = '100%';
              canvas.style.height = '100%';
            }
          }
        }, 500);
      } catch (err) {
        if (!isMounted.current) {
          connecting.current = false;
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Connection error: ${message}`);
        onError?.(message);
        connecting.current = false;

        if (retryCount.current < 3 && isMounted.current) {
          retryTimer.current = setTimeout(() => {
            if (isMounted.current && !isDisconnecting.current) {
              retryCount.current++;
              connect();
            }
          }, 2000 * Math.pow(1.3, retryCount.current));
        }
      }
    }, isDisconnecting.current ? 200 : 50);
  }, [url, credentials, background, viewOnly, scaleViewport, clipViewport, resizeSession, showDotCursor, compressionLevel, qualityLevel, onConnect, onDisconnect, onError, onClipboard, disconnect]);

  useEffect(() => {
    isMounted.current = true;
    disconnect();
    const timer = setTimeout(() => url && isMounted.current && connect(), 100);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (rfbRef.current) {
        try {
          const rfb = rfbRef.current as ExtendedRFB;
          rfb._sock?._websocket?.close(1000, 'Normal closure');
          rfbRef.current.disconnect();
        } catch {}
        rfbRef.current = null;
      }
      isDisconnecting.current = false;
      connecting.current = false;
    };
  }, [url, credentials, connect, disconnect]);

  const reconnect = useCallback(() => {
    if (isDisconnecting.current || connecting.current) return;
    retryCount.current = 0;
    setError(null);
    disconnect();
    setTimeout(() => isMounted.current && connect(), 200);
  }, [connect, disconnect]);

  const sendClipboard = useCallback((text: string) => {
    if (rfbRef.current && isConnected && text) {
      try {
        rfbRef.current.clipboardPasteFrom(text);
        return true;
      } catch {}
    }
    return false;
  }, [isConnected]);

  const pasteFromClipboard = useCallback(async () => {
    if (rfbRef.current && isConnected) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          rfbRef.current.clipboardPasteFrom(text);
          return true;
        }
      } catch {}
    }
    return false;
  }, [isConnected]);

  return { vncRef, isConnected, error, reconnect, disconnect, sendClipboard, pasteFromClipboard };
}