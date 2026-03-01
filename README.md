# 🐾 OpenClaw Dashboard

A beautiful, real-time web dashboard for monitoring [OpenClaw](https://openclaw.ai) sessions, subagents, chat history, and memory files.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

<p align="center">
  <img src="https://via.placeholder.com/800x400/1a1a1a/2563eb?text=OpenClaw+Dashboard" alt="Dashboard Screenshot">
</p>

> **Note:** Replace the placeholder image above with an actual screenshot of your dashboard!

## ✨ Features

- 📊 **Real-time Metrics**: Token usage, session count, subagents, uptime
- 💬 **Chat History**: Browse and search your conversation history
- 🤖 **Subagent Management**: Monitor active and completed subagents
- 📁 **Memory Explorer**: View and search memory files
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 🔄 **Auto-Refresh**: Data updates every 60 seconds
- 📱 **Responsive**: Works great on desktop and mobile

## Features

- **Live Statistics**: Token usage, active sessions, subagents, uptime
- **Session Monitoring**: View all active and isolated sessions
- **Subagent Management**: Monitor running subagents, spawn new ones
- **Chat History**: Browse and search message history
- **Memory Viewer**: View and search memory files
- **System Info**: Host details, OS, Node version, workspace
- **Dark Mode**: Toggle between light and dark themes
- **Auto-refresh**: Automatically updates every 30 seconds

## Setup

1. Install dependencies:
   ```bash
   cd /home/nadkarnik/.openclaw/workspace/dashboard
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser:
   ```
   http://localhost:3456
   ```

## Configuration

- **Port**: Set `PORT` environment variable (default: 3456)
- **Auto-refresh interval**: Edit `startAutoRefresh()` in `app.js`

## OpenClaw Integration ✅

The dashboard is **fully integrated** with OpenClaw! Data is refreshed on-demand to save tokens.

### How It Works

1. **Data Bridge**: Dashboard reads from JSON files in `data/`
2. **Manual Refresh**: Ask the assistant to refresh when you want updated data
3. **Token Efficient**: Only uses API tokens when you explicitly request it

### Integrated Endpoints

- ✅ `/api/sessions` → Live from `sessions_list`
- ✅ `/api/sessions/:key/history` → Live from `sessions_history`
- ✅ `/api/subagents` → Live from `subagents list`
- ✅ `/api/status` → Live from `session_status`
- ✅ `/api/memory` → Direct file access
- 🔄 `/api/memory/search` → Queued processing (work in progress)

### Refresh Dashboard Data

To refresh the data, simply say:
> "Refresh the dashboard data"

The assistant will call all necessary APIs and update the JSON files.

**Note**: Automatic background refresh has been disabled to conserve tokens. You can re-enable it by setting up a cron job if desired (see `REFRESH.md`).

See `REFRESH.md` for details on the data format and refresh mechanism.

## Development

The dashboard is built with:
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework)
- **Styling**: Custom CSS with CSS variables for theming

All files are in the workspace, making it easy to modify and extend.

## Future Enhancements

- WebSocket support for real-time updates
- Export chat history to markdown/JSON
- Visual timeline of activities
- Cost tracking and analytics
- Mobile app (PWA)
- Multiple agent profiles
- Collaborative features (multi-user)

## Troubleshooting

- **Port already in use**: Change the PORT environment variable
- **Can't connect**: Check firewall settings, ensure server is running
- **No data showing**: OpenClaw integration not yet complete (mock data for now)

---

Built for OpenClaw by your assistant 🐾
