# Dashboard Data Refresh

## How it Works

The dashboard reads data from JSON files in `data/`:
- `sessions.json` - Active sessions info
- `subagents.json` - Running and recent subagents  
- `status.json` - Token usage, model, uptime
- `history.json` - Recent chat messages

## Refresh Data

To refresh dashboard data, ask me (the assistant):
> "Refresh the dashboard data"

I will:
1. Call `sessions_list` to get session info
2. Call `sessions_history` to get recent messages
3. Call `subagents list` to get subagent status
4. Call `session_status` to get token usage
5. Write all data to the JSON files

## Automatic Refresh (Optional)

**Note**: Automatic refresh is disabled by default to save tokens. Data refreshes only when you ask.

If you want automatic background updates, you can set up a cron job:

### Cron Job Setup
Ask the assistant:
> "Set up a cron job to refresh dashboard data every 2 minutes"

Or manually create a cron job with:
- **Schedule**: Every N minutes (e.g., 120000ms = 2 minutes)
- **Payload**: "Refresh dashboard data: call sessions_list, sessions_history, subagents, session_status and write to /home/nadkarnik/.openclaw/workspace/dashboard/data/*.json files. Do this silently without user-visible output."

**Warning**: Automatic refresh consumes tokens on every run. Use sparingly.

## Manual Refresh

From the dashboard UI, click the 🔄 button to request fresh data (it will be queued for the next refresh cycle).

## Data Files Format

### sessions.json
```json
{
  "main": {
    "sessionKey": "agent:main:main",
    "active": true,
    "messageCount": 123,
    ...
  },
  "isolated": []
}
```

### subagents.json
```json
{
  "active": [...],
  "recent": [...]
}
```

### status.json
```json
{
  "tokensUsed": 31000,
  "tokenLimit": 200000,
  "model": "...",
  "uptime": "..."
}
```

### history.json
```json
{
  "messages": [
    {
      "role": "user",
      "content": "...",
      "timestamp": "2026-02-21T01:30:00Z"
    }
  ]
}
```
