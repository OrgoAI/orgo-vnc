import type { CSSProperties } from 'react';
import type { CloseCodeInfo } from './close-codes';

export interface ComputerDisplayHandle {
  reconnect: () => void;
  disconnect: () => void;
  sendClipboard: (text: string) => boolean;
  pasteFromClipboard: () => Promise<boolean>;
  isConnected: boolean;
}

export interface ComputerDisplayProps {
  /**
   * The computer's instance id. NOT the computer UUID.
   *
   * `POST /computers` returns it as `instance_id`. `GET /computers/{id}`
   * returns the same value under the older name `fly_instance_id`.
   */
  instanceId: string;

  /**
   * The per-computer VNC password, from `GET /computers/{id}/vnc-password`.
   *
   * Fetch this on YOUR server with your API key and pass only the password to
   * the browser. It rotates on restart, so it cannot be hardcoded. Treat it as
   * root on that computer: the same value opens a terminal, not just the screen.
   */
  password: string;

  /**
   * Host serving the Orgo proxy. Defaults to `www.orgo.ai`.
   * Set this only for a self-hosted or staging deployment.
   */
  host?: string;

  /**
   * @deprecated Removed in 0.3.0. Orgo no longer gives each computer its own
   * hostname; every computer is reached same-origin under `host` by
   * `instanceId`. Passing this has no effect beyond a console warning.
   */
  hostname?: string;

  readOnly?: boolean;
  background?: string;
  className?: string;
  style?: CSSProperties;
  scaleViewport?: boolean;
  clipViewport?: boolean;
  resizeSession?: boolean;
  showDotCursor?: boolean;

  /**
   * Hide the real desktop cursor. Useful while an AI agent is driving the
   * computer and you want only your overlaid cursor visible. The computer still
   * receives clicks at the same position, you just do not render the OS cursor
   * shape. Set back to true when control returns to the human. Defaults to true.
   */
  cursorVisible?: boolean;

  compressionLevel?: number;
  qualityLevel?: number;

  onConnect?: () => void;
  onDisconnect?: (clean: boolean) => void;

  /**
   * Called with a human-readable message on any failure, including the ones
   * noVNC cannot see. The proxy closes the socket after accepting the upgrade,
   * so without this a rejected connection renders as an unexplained black
   * screen. Log it during development at minimum.
   */
  onError?: (error: string) => void;

  /**
   * Called when the proxy closes the connection, with the decoded reason.
   * `info` is null for a normal close or a code this package does not know.
   * Use it to distinguish an idle timeout (retryable) from a bad password.
   */
  onClose?: (code: number, info: CloseCodeInfo | null) => void;

  onClipboard?: (text: string) => void;
  onReady?: (handle: ComputerDisplayHandle) => void;
}
