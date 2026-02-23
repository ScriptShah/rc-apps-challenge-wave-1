# scriptshah Rocket.Chat challenge app

This app supports the challenge flow:

- `/scriptshah on` and `/scriptshah off` toggle mention handling.
- While ON, mentions of `@scriptshah` are captured and the sender receives an ephemeral reply.
- Optional setting **External Logger** (`external_logger_url`) switches reply mode to an external API call.

## External logger behavior

When `external_logger_url` is set, the app sends:

```json
{
  "userid": "<sender-id>",
  "message": "<full-message-text>"
}
```

Expected response:

```json
{
  "id": "123",
  "result": "Thanks from external logger"
}
```

Ephemeral reply will be formatted as:

`<result> (<id>)`

## Quick test checklist

1. Run `/scriptshah on`.
2. Mention `@scriptshah` from another user and confirm ephemeral reply.
3. Set **External Logger** URL in app settings.
4. Mention again and confirm reply is based on API `result` and `id`.
5. Run `/scriptshah off` and confirm no reply is sent.

## What screenshots to send for challenge review

Share 2-3 screenshots that prove behavior instead of code:

1. **App Setting Screenshot**
   - Open **Administration → Apps → Installed Apps → scriptshah → Settings**.
   - Show the `External Logger` (`external_logger_url`) field with a URL filled in.

2. **Default Mode Screenshot (URL empty)**
   - Leave `external_logger_url` empty.
   - Run `/scriptshah on`, mention `@scriptshah` from another user.
   - Capture the ephemeral message: `Thank you for mentioning me, <username>`.

3. **API Mode Screenshot (URL set)**
   - Set `external_logger_url` to a test endpoint (for example webhook.site or a mock API that returns `{ "result": "...", "id": "..." }`).
   - Mention `@scriptshah` again.
   - Capture the ephemeral message that shows: `<result> (<id>)`.

Optional extra screenshot (if needed): run `/scriptshah off` and show that mentioning `@scriptshah` no longer triggers a reply.
