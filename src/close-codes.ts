/**
 * WebSocket close codes returned by the Orgo proxy, and what to do about each.
 *
 * These exist because a failed embed is otherwise INVISIBLE. The proxy accepts
 * the upgrade (HTTP 101) and closes the socket a moment later, so noVNC never
 * throws and the page just shows black. A previous version of this package
 * pointed at a URL that had not existed for months and nobody could tell,
 * because every failure looked identical to a slow network.
 *
 * Codes are read from the proxy's own `safeClose` calls. Anything outside the
 * 4000-4599 range is a standard WebSocket code and not ours.
 */

export interface CloseCodeInfo {
  /** What actually happened, in one line. */
  reason: string;
  /** The thing to change. Empty when there is nothing the caller can do. */
  fix: string;
  /** Whether reconnecting with the same inputs could ever succeed. */
  retryable: boolean;
}

const CODES: Record<number, CloseCodeInfo> = {
  4000: {
    reason: 'The proxy did not recognise the connection path.',
    fix: 'Use wss://<host>/desktops/<instanceId>/ws/websockify.',
    retryable: false,
  },
  4001: {
    reason: 'Authentication was rejected.',
    fix:
      'Pass the per-computer VNC password as ?token=. An account API key (sk_...) ' +
      'is refused when it arrives from a browser. Passwords rotate on restart, so ' +
      'fetch a fresh one rather than hardcoding it.',
    retryable: false,
  },
  4003: {
    reason: 'The computer is not running.',
    fix: 'Start it, then reconnect once its status is running.',
    retryable: true,
  },
  4004: {
    reason: 'No such computer.',
    fix: 'Check instanceId. It is the instance_id field, not the computer UUID.',
    retryable: false,
  },
  4006: {
    reason: 'The credential is valid but scoped to a different workspace.',
    fix: 'Use a key for this computer\'s workspace, or an account-wide key.',
    retryable: false,
  },
  4007: {
    reason: 'Multi-factor authentication is required for this session.',
    fix: 'Complete the MFA challenge, then reconnect.',
    retryable: true,
  },
  4008: {
    reason: 'Closed after 30 minutes with no input.',
    fix: 'Expected for an idle viewer. Reconnect on user activity.',
    retryable: true,
  },
  4010: {
    reason: 'WebRTC is disabled for this computer.',
    fix: 'Use the websockify path instead.',
    retryable: false,
  },
  4011: {
    reason: 'This grant allows viewing the screen only.',
    fix: 'Connect to /ws/websockify. Terminal and audio are not available.',
    retryable: false,
  },
  4500: {
    reason: 'The proxy hit an internal error.',
    fix: '',
    retryable: true,
  },
  4502: {
    reason: 'The proxy could not reach the computer.',
    fix: 'Usually transient while a computer is starting or moving hosts.',
    retryable: true,
  },
};

/** Closed cleanly by us, or by the page navigating away. */
const NORMAL = 1000;

/** Look up a close code. Returns null for a normal close or an unknown code. */
export function describeCloseCode(code: number): CloseCodeInfo | null {
  if (code === NORMAL) return null;
  return CODES[code] ?? null;
}

/** A single-line message suitable for onError. */
export function closeCodeMessage(code: number): string | null {
  const info = describeCloseCode(code);
  if (!info) return null;
  return info.fix ? `${info.reason} ${info.fix} (close ${code})` : `${info.reason} (close ${code})`;
}

export const IDLE_TIMEOUT_CLOSE_CODE = 4008;
