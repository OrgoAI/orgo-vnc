'use client';

import { useState, useEffect } from 'react';
import type { ComputerDisplayProps } from './types';

export function ComputerDisplay(props: ComputerDisplayProps) {
  const [Client, setClient] = useState<React.ComponentType<ComputerDisplayProps> | null>(null);

  useEffect(() => {
    import('./VNCClient').then((mod) => {
      setClient(() => mod.VNCClient);
    });
  }, []);

  if (!Client) {
    return (
      <div
        className={props.className}
        style={{
          width: '100%',
          height: '100%',
          background: props.background || '#000',
          ...props.style,
        }}
      />
    );
  }

  return <Client {...props} />;
}