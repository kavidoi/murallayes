Purpose
- `.shared-state/` is a local, ephemeral coordination area so multiple terminals/agents can see activity and avoid duplicate servers.
- It is not for long-term storage or data hoarding.

What’s inside
- `sessions/`, `todos/`, `memories/`: lightweight coordination artifacts.
- `logs/`: transient runtime logs.
- `events/`: small JSON event records written frequently.

Retention and rotation
- Logs: retain 14 days.
- Events: retain 7 days.
- Older events are archived by day into `.shared-state/archives/events-YYYY-MM-DD.tar.gz` and originals removed.
- A soft cap of 500 MB is enforced on `.shared-state/`; the oldest archives/logs/events are pruned (skipping today) until under cap.

Cleanup script
- Run `bash scripts/cleanup-shared-state.sh` to prune/compact.
- Options:
  - `--days-logs N` (default 14)
  - `--days-events N` (default 7)
  - `--cap SIZE` (e.g., 500M, 1G)
  - `--root PATH` (override repo root if needed)
  - `--dry-run` (show actions without deleting)

Git hygiene
- `.shared-state/` is ignored via `.gitignore`; do not commit its contents.

Notes
- The system aims to keep just-enough signal for active collaboration while staying small and fast.

Auto Cleanup
- Cron (Linux/macOS): add a daily job, e.g., 02:15 every day
  - Edit crontab: `crontab -e`
  - Add:
    - `15 2 * * * bash /Users/kavi/Sharedcodingprojects/Muralla-4.0/scripts/cleanup-shared-state.sh --cap 500M --days-logs 14 --days-events 7`
- Launchd (macOS per-user): `~/Library/LaunchAgents/com.muralla.sharedstate.cleanup.plist`
  - Example plist content:
    - `<?xml version="1.0" encoding="UTF-8"?>`
    - `<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`
    - `<plist version="1.0">`
    - `  <dict>`
    - `    <key>Label</key><string>com.muralla.sharedstate.cleanup</string>`
    - `    <key>ProgramArguments</key>`
    - `    <array>`
    - `      <string>/bin/bash</string>`
    - `      <string>/Users/kavi/Sharedcodingprojects/Muralla-4.0/scripts/cleanup-shared-state.sh</string>`
    - `      <string>--cap</string><string>500M</string>`
    - `      <string>--days-logs</string><string>14</string>`
    - `      <string>--days-events</string><string>7</string>`
    - `    </array>`
    - `    <key>StartCalendarInterval</key>`
    - `    <dict>`
    - `      <key>Hour</key><integer>2</integer>`
    - `      <key>Minute</key><integer>15</integer>`
    - `    </dict>`
    - `    <key>StandardOutPath</key><string>/tmp/muralla-sharedstate-cleanup.out</string>`
    - `    <key>StandardErrorPath</key><string>/tmp/muralla-sharedstate-cleanup.err</string>`
    - `    <key>RunAtLoad</key><true/>`
    - `  </dict>`
    - `</plist>`
  - Load it: `launchctl load ~/Library/LaunchAgents/com.muralla.sharedstate.cleanup.plist`
  - Verify: `launchctl list | rg sharedstate`

Sessions Heartbeat
- Purpose: let other terminals/agents see who is active and avoid duplicate servers.
- Start a heartbeat in the background:
  - `nohup bash scripts/heartbeat.sh --agent codex-cli --interval 20 >/dev/null 2>&1 &`
- One-shot update (no background loop):
  - `bash scripts/heartbeat.sh --agent codex-cli --one-shot`
- Files are written to `.shared-state/sessions/<agent>-<host>-tty<TTY>-pid<PID>.json` with `last_seen` and status.

Server Locking
- Goal: prevent duplicate dev servers by coordinating via `.shared-state/servers/<name>.json`.
- Script: `scripts/server-lock.sh`
  - `status [name]` shows locks; `cleanup` removes stale locks.
  - `claim <name> <port>` exits 0 if free; 1 if taken.
  - `start <name> <port> -- <cmd...>` acquires lock, runs `cmd`, updates `last_seen`, and releases on exit.
- Backend example:
  - `bash scripts/dev-backend.sh` (wraps: `server-lock.sh start backend 4000 -- pnpm --filter muralla-backend dev`)
  - If a backend is already running, it prints who owns it and exits.
