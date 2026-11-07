# Sandbox guidance

This is OvertChat's optional code execution image. The app sends Python code
and the chat's files to `POST /run`; the server runs them once and returns
output and the files written to `outputs/`. It is stateless: nothing survives
a run, and the image holds no credentials.

## Isolation invariants

- The container is the outer boundary. Keep it without volumes, secrets or
  internet access, on a network shared only with the app, with a read-only root
  filesystem and only the capabilities `runner.c` needs (SETUID, SETGID, CHOWN,
  DAC_OVERRIDE, FOWNER, KILL).
- Every run uses its own user from a pool, so concurrent runs cannot read each
  other's files or signal each other's processes. The run directory is `0700`,
  and the launcher sets `umask 077`.
- `runner.c` applies limits as root, drops groups and the root identity, sets
  `no_new_privs`, then installs seccomp before `exec`. The filter must keep
  denying non-`AF_UNIX` sockets, namespace creation, tracing and kernel
  administration. Run code must never reach the app over the network.
- After a run the server kills every process of that user and removes its
  files, including in `/tmp` and `/dev/shm`. Run the container with an init
  process (Compose `init: true`) so detached processes are reaped. Output collection reads only
  regular files owned by the run's user and never follows links.
- Never log code, file contents or program output.

## Layout seen by run code

The working directory contains `uploads/` (read-only inputs), `outputs/`
(returned files) and `tmp/`. `/mnt/data` is a symlink to `/proc/self/cwd`, so
`/mnt/data/uploads/...` works in every run without mount namespaces.
`plt.show()` saves figures to `outputs/` through `lib/overtchat_matplotlib.py`.
Every run gets an injected `matplotlibrc` in `MPLCONFIGDIR` that puts Noto
Sans CJK SC (covers CJK, Latin and digits in one face; matplotlib reads TTC
files since 3.10) first in the sans-serif list, and the backend module
repeats this after pyplot import in case the file is ever removed, so charts
render Chinese without the run code touching fonts. Droid Sans Fallback
(TTF, CJK-only) is registered as a fallback; reportlab needs a TTF to embed,
which is why PDFs use DejaVu + Droid wrapping instead of Noto.
Skills under `skills/*/SKILL.md` are listed by `GET /healthz`.
Guides under `guides/` are deliberately not listed there: a failed run ends
its stderr with a hint pointing at `guides/lessons.md`, the protocol by which
run code keeps a per-conversation `lessons.md` (read the uploads copy, append
a line, save under the same name to replace it), so the self-correction
mechanism costs nothing until a run actually fails.

## Changes

Pin Python packages exactly in `requirements-*.txt` and update
`THIRD_PARTY_NOTICES.md` with new components. Validate with an image build and
the tests in `test_server.py`, run inside the container with the production
capabilities. See `docs/development.md#code-sandbox-validation`.
