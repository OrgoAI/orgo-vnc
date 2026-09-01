/**
 * The connection URL, in its own module on purpose.
 *
 * `ComputerDisplay` loads the noVNC client with a dynamic import so the package
 * can be imported during server rendering, where `window` does not exist and
 * noVNC throws at module scope. Anything the package exports from its entry
 * point must therefore avoid importing `VNCClient`, or that protection is lost
 * and `require('orgo-vnc')` crashes on the server.
 */

const DEFAULT_HOST = 'www.orgo.ai';

/**
 * Build the WebSocket URL for a computer's screen.
 *
 * Every Orgo computer is reached same-origin under one host, addressed by its
 * `instance_id`. There are no per-computer hostnames: the VNC proxy lives
 * inside the Orgo app itself.
 *
 * @param host       Proxy host. Defaults to `www.orgo.ai`.
 * @param instanceId The computer's `instance_id`.
 * @param password   The per-computer VNC password.
 */
export function buildWsUrl(host: string, instanceId: string, password: string): string {
  const h = host || DEFAULT_HOST;
  const scheme = h.startsWith('localhost') || h.startsWith('127.0.0.1') ? 'ws' : 'wss';
  return `${scheme}://${h}/desktops/${encodeURIComponent(instanceId)}/ws/websockify?token=${encodeURIComponent(password)}`;
}

export { DEFAULT_HOST };
