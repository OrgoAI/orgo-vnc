'use client';

import { useMemo, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { useVNC } from './useVNC';
import type { ComputerDisplayProps, ComputerDisplayRef } from './types';

export const ComputerDisplay = forwardRef<ComputerDisplayRef, ComputerDisplayProps>(({
  instanceId,
  password,
  readOnly = false,
  background = '#1E1E1E',
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
}, ref) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const url = useMemo(() => mounted ? `wss://${instanceId}.orgo.dev/websockify` : '', [instanceId, mounted]);

  const credentials = useMemo(() => ({
    username: 'user',
    password,
    target: `${instanceId}.orgo.dev`,
  }), [instanceId, password]);

  const {
    vncRef,
    isConnected,
    reconnect,
    disconnect,
    sendClipboard,
    pasteFromClipboard,
  } = useVNC({
    url,
    credentials,
    background,
    viewOnly: readOnly,
    scaleViewport,
    clipViewport,
    resizeSession,
    showDotCursor,
    compressionLevel,
    qualityLevel,
    onConnect,
    onDisconnect,
    onError,
    onClipboard,
  });

  useImperativeHandle(ref, () => ({
    reconnect,
    disconnect,
    sendClipboard,
    pasteFromClipboard,
    isConnected,
  }), [reconnect, disconnect, sendClipboard, pasteFromClipboard, isConnected]);

  if (!mounted) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          background,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={vncRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background,
        pointerEvents: readOnly ? 'none' : 'auto',
        cursor: readOnly ? 'default' : 'none',
        opacity: isConnected ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        ...style,
      }}
    />
  );
});

ComputerDisplay.displayName = 'ComputerDisplay';