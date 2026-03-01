#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper to call OpenClaw CLI
async function openclawCmd(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('openclaw', args, {
      cwd: process.env.HOME + '/.openclaw/workspace',
      env: process.env
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => stdout += data.toString());
    proc.stderr.on('data', (data) => stderr += data.toString());
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed: ${stderr}`));
      }
    });
  });
}

// API Endpoints

// Helper to read data file
async function readDataFile(filename) {
  try {
    const filepath = path.join(__dirname, 'data', `${filename}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Get session list
app.get('/api/sessions', async (req, res) => {
  try {
    const data = await readDataFile('sessions');
    if (data) {
      res.json(data);
    } else {
      // Fallback to basic structure if no data yet
      res.json({
        main: {
          sessionKey: 'main',
          kind: 'main',
          active: true,
          lastMessage: new Date().toISOString(),
          messageCount: 0
        },
        isolated: []
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session history
app.get('/api/sessions/:key/history', async (req, res) => {
  try {
    const { key } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const data = await readDataFile('history');
    if (data && data.messages) {
      // Apply limit
      const messages = data.messages.slice(0, limit);
      res.json({ 
        sessionKey: key,
        messages,
        total: data.messages.length
      });
    } else {
      res.json({ 
        sessionKey: key,
        messages: [],
        total: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subagents
app.get('/api/subagents', async (req, res) => {
  try {
    const data = await readDataFile('subagents');
    if (data) {
      res.json(data);
    } else {
      res.json({ 
        active: [],
        recent: []
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session status
app.get('/api/status', async (req, res) => {
  try {
    const data = await readDataFile('status');
    if (data) {
      res.json(data);
    } else {
      res.json({
        model: 'anthropic/claude-sonnet-4-5-20250929',
        tokensUsed: 0,
        tokenLimit: 200000,
        uptime: '0h 0m',
        status: 'unknown'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory files
app.get('/api/memory', async (req, res) => {
  try {
    const memoryDir = path.join(process.env.HOME, '.openclaw/workspace/memory');
    let files = [];
    
    try {
      const entries = await fs.readdir(memoryDir);
      files = entries
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
    } catch (err) {
      // Memory dir doesn't exist yet
    }
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get memory file content
app.get('/api/memory/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    // Sanitize filename
    if (!filename.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(
      process.env.HOME,
      '.openclaw/workspace/memory',
      filename
    );
    
    const content = await fs.readFile(filepath, 'utf-8');
    res.json({ filename, content });
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Search memory
app.post('/api/memory/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Write search request to file for OpenClaw to process
    const requestFile = path.join(__dirname, 'data', 'search-request.json');
    await fs.writeFile(requestFile, JSON.stringify({ query, timestamp: Date.now() }));
    
    // Wait briefly for response (OpenClaw will process via heartbeat/cron)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const data = await readDataFile('search-results');
    if (data && data.query === query) {
      res.json(data);
    } else {
      res.json({
        query,
        results: [],
        note: 'Search request queued, results pending'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system info
app.get('/api/system', async (req, res) => {
  try {
    const info = {
      host: 'knserverpc',
      os: 'Linux 6.8.0-100-generic',
      node: 'v22.22.0',
      workspace: process.env.HOME + '/.openclaw/workspace',
      uptime: process.uptime()
    };
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File Manager API
const WORKSPACE_ROOT = path.join(process.env.HOME, '.openclaw/workspace');

// Helper to sanitize and validate paths
function validatePath(requestedPath) {
  const normalized = path.normalize(requestedPath || '');
  const fullPath = path.join(WORKSPACE_ROOT, normalized);
  
  // Ensure path is within workspace
  if (!fullPath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: path outside workspace');
  }
  
  return fullPath;
}

// List files in directory
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || '';
    const fullPath = validatePath(dirPath);
    
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryPath);
        const relativePath = path.relative(WORKSPACE_ROOT, entryPath);
        
        return {
          name: entry.name,
          path: relativePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          isHidden: entry.name.startsWith('.')
        };
      })
    );
    
    // Sort: directories first, then files, hidden items last
    files.sort((a, b) => {
      if (a.isHidden !== b.isHidden) return a.isHidden ? 1 : -1;
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      path: dirPath,
      files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read file contents
app.get('/api/files/read', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Path required' });
    }
    
    const fullPath = validatePath(filePath);
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
    
    // Limit file size to 1MB for safety
    if (stats.size > 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (>1MB)' });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Write file contents
app.post('/api/files/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'Path and content required' });
    }
    
    const fullPath = validatePath(filePath);
    
    // Create parent directories if needed
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf-8');
    
    const stats = await fs.stat(fullPath);
    res.json({
      success: true,
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file or directory
app.delete('/api/files/delete', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'Path required' });
    }
    
    const fullPath = validatePath(filePath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true });
    } else {
      await fs.unlink(fullPath);
    }
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OpenClaw Dashboard running at http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/*`);
});
