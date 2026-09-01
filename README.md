# orgo-vnc

Embed an [Orgo](https://orgo.ai) cloud computer in your React app.

```bash
npm install orgo-vnc @novnc/novnc
```

```tsx
import { ComputerDisplay } from 'orgo-vnc';

<ComputerDisplay
  instanceId={instanceId}
  password={password}
  onError={(message) => console.error(message)}
  style={{ width: 1280, height: 720 }}
/>
```

## Getting the two values

`instanceId` is the computer's instance id, not its UUID. `POST /computers`
returns it as `instance_id`. `GET /computers/{id}` returns the same value under
the older name `fly_instance_id`.

`password` comes from `GET /computers/{id}/vnc-password`. It rotates whenever
the computer restarts, so fetch it fresh rather than hardcoding it.

Fetch it on your server, never in the browser:

```ts
// app/api/desktop/route.ts
export async function GET() {
  const res = await fetch(
    `https://www.orgo.ai/api/computers/${process.env.ORGO_COMPUTER_ID}/vnc-password`,
    { headers: { Authorization: `Bearer ${process.env.ORGO_API_KEY}` } },
  );
  const { password } = await res.json();
  // Only the per-computer password crosses to the browser. Never the API key.
  return Response.json({ instanceId: process.env.ORGO_INSTANCE_ID, password });
}
```

> **The VNC password is root on that computer.** The same value opens a terminal
> and the command API, not just the screen. Anyone who can read it from your page
> can run commands on the machine. Point embeds at disposable computers.

An account API key (`sk_...`) is rejected when it arrives from a browser. Use
the per-computer password.

## Embedding from your own domain

There is no origin allowlist on this path and nothing to register. The
per-computer password is the credential, and it is what decides whether a
connection is allowed.

## Always handle onError

A rejected connection is otherwise invisible. The proxy accepts the WebSocket
upgrade and then closes it, so noVNC raises nothing and the component renders
black. `onError` receives a decoded reason for every close the proxy sends.

```tsx
<ComputerDisplay
  instanceId={instanceId}
  password={password}
  onError={(message) => console.error(message)}
  onClose={(code, info) => {
    if (info?.retryable) scheduleReconnect();
  }}
/>
```

| Close | Meaning | What to do |
| --- | --- | --- |
| `4001` | Authentication rejected | Use the per-computer password, not an `sk_` key. It may have rotated. |
| `4003` | Computer is not running | Start it, reconnect when its status is `running`. |
| `4004` | No such computer | Check `instanceId`. It is `instance_id`, not the UUID. |
| `4006` | Credential scoped to another workspace | Use a key for this computer's workspace. |
| `4008` | Idle for 30 minutes | Expected. Reconnect on user activity. |
| `4500` | Proxy error | Retry. |
| `4502` | Proxy could not reach the computer | Usually transient while starting or moving hosts. |

`describeCloseCode(code)` and `closeCodeMessage(code)` are exported if you want
to render these yourself.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `instanceId` | `string` | required | The computer's `instance_id`. |
| `password` | `string` | required | From `GET /computers/{id}/vnc-password`. |
| `host` | `string` | `www.orgo.ai` | Only for self-hosted or staging. |
| `readOnly` | `boolean` | `false` | Render the screen without sending input. |
| `scaleViewport` | `boolean` | `true` | Scale the remote screen to fit. |
| `clipViewport` | `boolean` | `true` | Clip rather than letterbox. |
| `resizeSession` | `boolean` | `true` | Ask the computer to match the container size. |
| `cursorVisible` | `boolean` | `true` | Set `false` to hide the OS cursor while an agent drives. |
| `showDotCursor` | `boolean` | `true` | Draw a dot when the remote cursor is hidden. |
| `compressionLevel` | `number` | `2` | 0 to 9. |
| `qualityLevel` | `number` | `6` | 0 to 9. |
| `background` | `string` | `#000` | Fill behind the screen. |
| `onConnect` | `() => void` | | Connected and painting. |
| `onDisconnect` | `(clean: boolean) => void` | | Session ended. |
| `onError` | `(message: string) => void` | | Decoded failure reason. Handle this. |
| `onClose` | `(code: number, info) => void` | | Raw close code plus its decoded meaning. |
| `onClipboard` | `(text: string) => void` | | The computer copied something. |
| `onReady` | `(handle) => void` | | Imperative handle, see below. |

## Imperative handle

```tsx
const [handle, setHandle] = useState<ComputerDisplayHandle | null>(null);

<ComputerDisplay instanceId={instanceId} password={password} onReady={setHandle} />;

handle?.sendClipboard('text to paste into the computer');
await handle?.pasteFromClipboard();
handle?.disconnect();
```

## Without React

The component is a convenience wrapper. Any websockify-compatible client works
against the same URL:

```js
import RFB from '@novnc/novnc/lib/rfb';

const rfb = new RFB(
  container,
  `wss://www.orgo.ai/desktops/${instanceId}/ws/websockify?token=${encodeURIComponent(password)}`,
  { credentials: { password } },
);
rfb.addEventListener('credentialsrequired', () => rfb.sendCredentials({ password }));
```

`buildWsUrl(host, instanceId, password)` is exported if you want the URL without
building it by hand.

## Upgrading from 0.2.x

0.2.x connected to `wss://{hostname}/websockify`, from when every computer had
its own hostname. That is no longer how Orgo works, so 0.2.x cannot connect to
any current computer.

Replace the `hostname` prop with `instanceId`:

```diff
- <ComputerDisplay hostname={hostname} password={password} />
+ <ComputerDisplay instanceId={instanceId} password={password} onError={console.error} />
```

`hostname` is now ignored and logs a warning. Add `onError` while you are there:
its absence is why the 0.2.x breakage was invisible.

## License

MIT
