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

## Automatic Refresh

You can set up automatic refresh via cron or heartbeat:

### Option 1: Cron Job
```
Every 1 minute: "Refresh dashboard data in background"
```

### Option 2: Heartbeat
Add to `HEARTBEAT.md`:
```markdown
- Every 2-3 heartbeats, refresh dashboard data
```

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
