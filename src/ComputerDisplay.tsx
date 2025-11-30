'use client';

import { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
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
  const [Client, setClient] = useState<React.ComponentType<any> | null>(null);
  const [clientRef, setClientRef] = useState<ComputerDisplayRef | null>(null);

  useEffect(() => {
    import('./VNCClient.js').then(mod => setClient(() => mod.VNCClient));
  }, []);

  useImperativeHandle(ref, () => ({
    reconnect: () => clientRef?.reconnect(),
    disconnect: () => clientRef?.disconnect(),
    sendClipboard: (text: string) => clientRef?.sendClipboard(text) ?? false,
    pasteFromClipboard: () => clientRef?.pasteFromClipboard() ?? Promise.resolve(false),
    isConnected: clientRef?.isConnected ?? false,
  }), [clientRef]);

  if (!Client) {
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
    <Client
      ref={setClientRef}
      instanceId={instanceId}
      password={password}
      readOnly={readOnly}
      background={background}
      className={className}
      style={style}
      scaleViewport={scaleViewport}
      clipViewport={clipViewport}
      resizeSession={resizeSession}
      showDotCursor={showDotCursor}
      compressionLevel={compressionLevel}
      qualityLevel={qualityLevel}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onError={onError}
      onClipboard={onClipboard}
    />
  );
});

ComputerDisplay.displayName = 'ComputerDisplay';