'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import RFB from '@novnc/novnc/lib/rfb';
import type { ComputerDisplayProps } from './types';
import { describeCloseCode, closeCodeMessage } from './close-codes';
import { buildWsUrl, DEFAULT_HOST } from './url';

interface ExtendedRFB extends InstanceType<typeof RFB> {
  _sock?: { _websocket?: WebSocket };
}

export function VNCClient({
  instanceId,
  password,
  host = DEFAULT_HOST,
  hostname,
  readOnly = false,
  background = '#000',
  className,
  style,
  scaleViewport = true,
  clipViewport = true,
  resizeSession = true,
  showDotCursor = true,
  cursorVisible = true,
  compressionLevel = 2,
  qualityLevel = 6,
  onConnect,
  onDisconnect,
  onError,
  onClose,
  onClipboard,
  onReady,
}: ComputerDisplayProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const rfbRef = useRef<ExtendedRFB | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Bumped by reconnect() to re-run the connect effect. Without it `reconnect`
  // could only tear the session down, because the effect's deps are the
  // connection inputs and none of them change on a manual retry.
  const [connectNonce, setConnectNonce] = useState(0);

  const callbackRefs = useRef({ onConnect, onDisconnect, onError, onClose, onClipboard });
  callbackRefs.current = { onConnect, onDisconnect, onError, onClose, onClipboard };

  // Stable per-instance class used to scope the optional cursor-hide rule.
  const hideClassRef = useRef(`orgo-vnc-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (hostname) {
      console.warn(
        '[orgo-vnc] The `hostname` prop was removed in 0.3.0 and is ignored. ' +
          'Orgo no longer gives each computer its own host. Pass `instanceId` instead ' +
          '(the instance_id field from the computers API).',
      );
    }
  }, [hostname]);

  const wsUrl = useMemo(
    () => (instanceId && password ? buildWsUrl(host, instanceId, password) : ''),
    [host, instanceId, password],
  );

  useEffect(() => {
    if (!container || !wsUrl) return;

    let rfb: ExtendedRFB;
    try {
      rfb = new RFB(container, wsUrl, {
        credentials: { username: '', password, target: '' },
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

    // The whole reason this package can be debugged.
    //
    // noVNC's `disconnect` event does not carry the WebSocket close code, and
    // the proxy rejects by ACCEPTING the upgrade and then closing. So every
    // refusal (bad password, stopped computer, unknown id) reaches the page as
    // an ordinary disconnect and renders as black. Reading the raw socket is
    // the only way to recover the code. It exists as soon as the constructor
    // returns.
    const socket = rfb._sock?._websocket;
    const onSocketClose = (e: CloseEvent) => {
      const info = describeCloseCode(e.code);
      callbackRefs.current.onClose?.(e.code, info);
      const message = closeCodeMessage(e.code);
      if (message) callbackRefs.current.onError?.(message);
    };
    socket?.addEventListener('close', onSocketClose as EventListener);

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

    // Reached when the proxy forwards VNC auth rather than terminating it.
    const onRfbCredentialsRequired = () => {
      try {
        rfb.sendCredentials({ password });
      } catch {
        callbackRefs.current.onError?.('The computer asked for a password and it was rejected.');
      }
    };

    rfb.addEventListener('connect', onRfbConnect as EventListener);
    rfb.addEventListener('disconnect', onRfbDisconnect as EventListener);
    rfb.addEventListener('clipboard', onRfbClipboard as EventListener);
    rfb.addEventListener('securityfailure', onRfbSecurityFailure as EventListener);
    rfb.addEventListener('credentialsrequired', onRfbCredentialsRequired as EventListener);

    return () => {
      socket?.removeEventListener('close', onSocketClose as EventListener);
      rfb.removeEventListener('connect', onRfbConnect as EventListener);
      rfb.removeEventListener('disconnect', onRfbDisconnect as EventListener);
      rfb.removeEventListener('clipboard', onRfbClipboard as EventListener);
      rfb.removeEventListener('securityfailure', onRfbSecurityFailure as EventListener);
      rfb.removeEventListener('credentialsrequired', onRfbCredentialsRequired as EventListener);
      try { rfb._sock?._websocket?.close(1000); rfb.disconnect(); } catch {}
      rfbRef.current = null;
    };
  }, [container, wsUrl, connectNonce, password, readOnly, background, scaleViewport, clipViewport, resizeSession, showDotCursor, compressionLevel, qualityLevel]);

  const reconnect = useCallback(() => {
    try { rfbRef.current?._sock?._websocket?.close(1000); rfbRef.current?.disconnect(); } catch {}
    rfbRef.current = null;
    setConnectNonce((n) => n + 1);
  }, []);

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
    onReady?.({ reconnect, disconnect, sendClipboard, pasteFromClipboard, isConnected });
  }, [isConnected, onReady, reconnect, disconnect, sendClipboard, pasteFromClipboard]);

  const hideClass = hideClassRef.current;
  const composedClassName = cursorVisible
    ? className
    : [className, hideClass].filter(Boolean).join(' ');

  return (
    <>
      {/*
        noVNC paints the remote cursor by writing `cursor: url(...) Hx Hy` straight
        onto the <canvas> every time the server pushes a new cursor shape. The only
        way to beat that without forking noVNC is a stylesheet rule with !important,
        scoped to this instance so multiple ComputerDisplay mounts do not collide.
      */}
      {!cursorVisible && (
        <style>{`.${hideClass}, .${hideClass} * { cursor: none !important; }`}</style>
      )}
      <div
        ref={setContainer}
        className={composedClassName}
        style={{ width: '100%', height: '100%', background, ...style }}
      />
    </>
  );
}
