# scriptshah Rocket.Chat Challenge App

This app solves the challenge requirements by:

- Providing `/scriptshah on` and `/scriptshah off` slash commands.
- Capturing full messages that mention `@scriptshah` when ON.
- Sending an ephemeral acknowledgment to the user who mentioned `@scriptshah`.
- Exposing an **External Logger** app setting that accepts a URL.
- If **External Logger** is configured, POSTing `{ userid, message }` to the endpoint and showing `result (id)` from the response.

## Commands

- `/scriptshah on` → Enables mention capture + responses.
- `/scriptshah off` → Disables mention capture + responses.

## App Setting

In Rocket.Chat app settings:

- **External Logger** (`external_logger_url`) - optional URL
  - Empty: app uses default ephemeral message.
  - Set: app calls this endpoint via POST and uses the returned payload.

Expected JSON response format:

```json
{
  "id": "123",
  "result": "Thanks from external logger"
}
```

## Local Development

```bash
npm install
npx tsc --noEmit
```

## Deploy to Rocket.Chat

```bash
rc-apps deploy
```

Then test both modes:

1. Run `/scriptshah on`.
2. Mention `@scriptshah` from another user.
3. Verify ephemeral message appears.
4. Set **External Logger** URL in app settings.
5. Mention `@scriptshah` again and verify response uses `result (id)`.
6. Run `/scriptshah off` and confirm mentions no longer trigger response.
