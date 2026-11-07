# Conversation lessons

Some failures repeat inside one conversation because the environment (fonts,
paths, library APIs, tool limits) surprises the code. When that happens, keep
a lessons.md inside the conversation so retries and later tasks apply the fix
instead of repeating it.

## When to write
- A run failed for an environment reason and the same failure has now hit this
  conversation twice, or the fix took real trial and error worth keeping.
- Not for plain typos or logic bugs in your own code, and not for user facts.

## How to write
1. Read the conversation's current copy if it exists:
   `print(open("/mnt/data/uploads/lessons.md").read())`.
2. Append one line: `- <failure fingerprint>: <verified fix>`. The fingerprint
   is a short stable phrase, for example "reportlab cannot embed Noto TTC".
3. Write the full updated text to `outputs/lessons.md`; the same name replaces
   the conversation copy. This file is internal: do not link it in the reply.

## How to apply
- Before retrying a failed task in this conversation, read lessons.md and
  follow the recorded fixes instead of repeating the failed approach.
