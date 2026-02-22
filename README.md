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
