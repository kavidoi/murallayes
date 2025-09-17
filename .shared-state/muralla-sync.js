#!/usr/bin/env node

/**
 * Muralla Shared State System v2.0
 * Real-time synchronization daemon for cross-IDE development
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');
const { spawn } = require('child_process');

class MurallaSharedState {
  constructor() {
    this.projectRoot = process.cwd();
    this.stateDir = path.join(this.projectRoot, '.shared-state');
    this.sessionId = this.generateSessionId();
    this.isActive = false;
    this.watchers = new Map();
    this.eventQueue = [];
    this.syncInterval = 100; // ms
    this.terminalProcesses = new Map();
    
    // Ensure shared state directory exists
    this.ensureDirectories();
  }

  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  async ensureDirectories() {
    const dirs = ['sessions', 'todos', 'memories', 'logs', 'events', 'config'];
    for (const dir of dirs) {
      const dirPath = path.join(this.stateDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  async initialize() {
    console.log(`🚀 Initializing Muralla Shared State System v2.0`);
    console.log(`📁 Project: ${this.projectRoot}`);
    console.log(`🔑 Session: ${this.sessionId}`);
    
    try {
      // Load system config
      await this.loadConfig();
      
      // Register current session
      await this.registerSession();
      
      // Start filesystem watchers
      await this.startWatchers();
      
      // Initialize terminal log capture
      await this.initializeTerminalCapture();
      
      // Start sync loop
      this.startSyncLoop();
      
      this.isActive = true;
      console.log(`✅ Muralla Shared State System active`);
      
    } catch (error) {
      console.error(`❌ Failed to initialize Muralla system:`, error.message);
      process.exit(1);
    }
  }

  async loadConfig() {
    const configPath = path.join(this.stateDir, 'config', 'system.json');
    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
      this.config = config;
      this.syncInterval = config.sync_interval_ms || 100;
    } catch (error) {
      // Use defaults if config doesn't exist
      this.config = {
        version: '2.0.0',
        sync_interval_ms: 100,
        features: {
          realtime_sync: true,
          terminal_logs: true,
          ai_tracking: true
        }
      };
    }
  }

  async registerSession() {
    const sessionData = {
      session_id: this.sessionId,
      ide: process.env.MURALLA_IDE || 'unknown',
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      status: 'active',
      pid: process.pid,
      user: process.env.USER || 'unknown',
      project_context: {
        name: path.basename(this.projectRoot),
        root: this.projectRoot
      },
      capabilities: {
        filesystem_watch: true,
        terminal_capture: true,
        cross_sync: true
      }
    };

    const sessionPath = path.join(this.stateDir, 'sessions', `${this.sessionId}.json`);
    await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
    
    console.log(`📝 Session registered: ${this.sessionId}`);
  }

  async startWatchers() {
    // Watch shared state files for changes
    const stateWatcher = chokidar.watch(this.stateDir, {
      ignored: /node_modules|\.git/,
      persistent: true,
      ignoreInitial: true
    });

    stateWatcher.on('change', (filePath) => {
      this.handleStateFileChange(filePath);
    });

    // Watch project files for AI interactions
    const projectWatcher = chokidar.watch(this.projectRoot, {
      ignored: [/node_modules/, /\.git/, /\.shared-state/, /dist/, /build/],
      persistent: true,
      ignoreInitial: true
    });

    projectWatcher.on('change', (filePath) => {
      this.handleProjectFileChange(filePath);
    });

    this.watchers.set('state', stateWatcher);
    this.watchers.set('project', projectWatcher);
    
    console.log(`👀 Filesystem watchers active`);
  }

  async initializeTerminalCapture() {
    // Create terminal logs directory
    const logsDir = path.join(this.stateDir, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Start log aggregation
    this.startLogAggregation();
    
    console.log(`📋 Terminal log capture initialized`);
  }

  startLogAggregation() {
    // Monitor for new terminal processes and capture their output
    setInterval(async () => {
      try {
        await this.captureTerminalLogs();
      } catch (error) {
        // Silent fail for log capture
      }
    }, 1000);
  }

  async captureTerminalLogs() {
    // Capture running processes and their output
    const processes = [];
    
    // Add system information
    const logEntry = {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      type: 'system_status',
      data: {
        active_sessions: await this.getActiveSessions(),
        running_processes: processes,
        system_load: process.cpuUsage(),
        memory_usage: process.memoryUsage()
      }
    };

    const logPath = path.join(this.stateDir, 'logs', `${Date.now()}.json`);
    await fs.writeFile(logPath, JSON.stringify(logEntry, null, 2));
  }

  async getActiveSessions() {
    try {
      const sessionsDir = path.join(this.stateDir, 'sessions');
      const files = await fs.readdir(sessionsDir);
      const sessions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionData = JSON.parse(
            await fs.readFile(path.join(sessionsDir, file), 'utf8')
          );
          sessions.push(sessionData);
        }
      }
      
      return sessions.filter(session => session.status === 'active');
    } catch (error) {
      return [];
    }
  }

  handleStateFileChange(filePath) {
    const event = {
      id: this.generateEventId(),
      type: 'state_change',
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      file_path: filePath,
      change_type: 'modification'
    };
    
    this.queueEvent(event);
    console.log(`🔄 State change detected: ${path.basename(filePath)}`);
  }

  handleProjectFileChange(filePath) {
    const event = {
      id: this.generateEventId(),
      type: 'project_change',
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      file_path: filePath,
      change_type: 'modification',
      classification: this.classifyChange(filePath)
    };
    
    this.queueEvent(event);
    console.log(`📝 Project change: ${path.basename(filePath)}`);
  }

  classifyChange(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    
    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
      return 'code';
    } else if (ext === '.json' && basename === 'package.json') {
      return 'dependencies';
    } else if (ext === '.md') {
      return 'documentation';
    } else if (basename.includes('prisma') || ext === '.prisma') {
      return 'database';
    } else {
      return 'other';
    }
  }

  generateEventId() {
    return crypto.randomBytes(8).toString('hex');
  }

  queueEvent(event) {
    this.eventQueue.push(event);
    
    // Prevent memory buildup
    if (this.eventQueue.length > 1000) {
      this.eventQueue = this.eventQueue.slice(-500);
    }
  }

  startSyncLoop() {
    setInterval(async () => {
      await this.processEventQueue();
      await this.updateSessionActivity();
    }, this.syncInterval);
    
    console.log(`⚡ Sync loop active (${this.syncInterval}ms interval)`);
  }

  async processEventQueue() {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    // Write events to file system for other sessions to read
    const eventBatch = {
      batch_id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      events: events
    };
    
    const eventPath = path.join(
      this.stateDir, 
      'events', 
      `${Date.now()}_${this.sessionId}.json`
    );
    
    try {
      await fs.writeFile(eventPath, JSON.stringify(eventBatch, null, 2));
    } catch (error) {
      console.error('Failed to write events:', error.message);
    }
  }

  async updateSessionActivity() {
    const sessionPath = path.join(this.stateDir, 'sessions', `${this.sessionId}.json`);
    
    try {
      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
      sessionData.last_activity = new Date().toISOString();
      
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      // Session file might not exist yet
    }
  }

  async shutdown() {
    console.log(`🛑 Shutting down Muralla Shared State System`);
    
    this.isActive = false;
    
    // Close watchers
    for (const [name, watcher] of this.watchers) {
      await watcher.close();
      console.log(`   Closed ${name} watcher`);
    }
    
    // Mark session as inactive
    const sessionPath = path.join(this.stateDir, 'sessions', `${this.sessionId}.json`);
    try {
      const sessionData = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
      sessionData.status = 'inactive';
      sessionData.ended_at = new Date().toISOString();
      
      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      // Session file might not exist
    }
    
    console.log(`✅ Muralla system shutdown complete`);
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'start';
  
  switch (command) {
    case 'start':
    case 'daemon':
      const muralla = new MurallaSharedState();
      
      // Handle shutdown gracefully
      process.on('SIGINT', async () => {
        await muralla.shutdown();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        await muralla.shutdown();
        process.exit(0);
      });
      
      await muralla.initialize();
      
      // Keep running
      process.stdin.resume();
      break;
      
    default:
      console.log('Muralla Shared State System v2.0');
      console.log('Usage: node muralla-sync.js [start|daemon]');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MurallaSharedState };