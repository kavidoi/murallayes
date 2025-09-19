#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

class LocalSharedState {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateDir = path.join(projectRoot, '.shared-state');
    this.sessionId = this.generateSessionId();
    
    this.initializeState();
    this.startHeartbeat();
  }

  generateSessionId() {
    const env = process.env.TERM_PROGRAM || process.env.VSCODE_PID ? 'vscode' : 
                process.env.WINDSURF ? 'windsurf' : 'terminal';
    return `${env}-${os.hostname()}-${Date.now()}`;
  }

  initializeState() {
    // Create directories
    [this.stateDir, 
     path.join(this.stateDir, 'sessions'),
     path.join(this.stateDir, 'logs'),
     path.join(this.stateDir, 'changes')
    ].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // Register this session
    this.registerSession();
  }

  registerSession() {
    const sessionFile = path.join(this.stateDir, 'sessions', `${this.sessionId}.json`);
    const sessionData = {
      id: this.sessionId,
      type: this.sessionId.split('-')[0],
      hostname: os.hostname(),
      pid: process.pid,
      cwd: process.cwd(),
      startTime: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  }

  // Log terminal commands and outputs
  logCommand(command, output = '', status = 'success') {
    const logEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      command,
      output: output.substring(0, 1000), // Truncate long outputs
      status,
      cwd: process.cwd()
    };

    const logFile = path.join(this.stateDir, 'logs', `${new Date().toISOString().split('T')[0]}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  // Log AI/code changes
  logChange(type, description, files = []) {
    const changeEntry = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      type, // 'code-edit', 'file-create', 'server-start', etc.
      description,
      files: files.map(f => path.relative(this.projectRoot, f)),
      cwd: path.relative(this.projectRoot, process.cwd())
    };

    const changeFile = path.join(this.stateDir, 'changes', `${new Date().toISOString().split('T')[0]}.jsonl`);
    fs.appendFileSync(changeFile, JSON.stringify(changeEntry) + '\n');
  }

  // Update server status
  updateServerStatus(service, status, port = null) {
    const statusFile = path.join(this.stateDir, 'server-status.json');
    let statuses = {};
    
    if (fs.existsSync(statusFile)) {
      statuses = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    }

    statuses[`${this.sessionId}-${service}`] = {
      sessionId: this.sessionId,
      service,
      status,
      port,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };

    fs.writeFileSync(statusFile, JSON.stringify(statuses, null, 2));
  }

  // Get active sessions
  getActiveSessions() {
    const sessionsDir = path.join(this.stateDir, 'sessions');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(sessionsDir, f), 'utf8'));
          return new Date(data.lastSeen) > fiveMinutesAgo ? data : null;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }

  // Get recent activity
  getRecentActivity(hours = 1) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const activity = [];

    // Get logs
    const logsDir = path.join(this.stateDir, 'logs');
    if (fs.existsSync(logsDir)) {
      fs.readdirSync(logsDir)
        .filter(f => f.endsWith('.jsonl'))
        .forEach(file => {
          const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
          content.split('\n').filter(line => line.trim()).forEach(line => {
            try {
              const entry = JSON.parse(line);
              if (new Date(entry.timestamp) > cutoff) {
                activity.push({ ...entry, activityType: 'command' });
              }
            } catch (e) {}
          });
        });
    }

    // Get changes
    const changesDir = path.join(this.stateDir, 'changes');
    if (fs.existsSync(changesDir)) {
      fs.readdirSync(changesDir)
        .filter(f => f.endsWith('.jsonl'))
        .forEach(file => {
          const content = fs.readFileSync(path.join(changesDir, file), 'utf8');
          content.split('\n').filter(line => line.trim()).forEach(line => {
            try {
              const entry = JSON.parse(line);
              if (new Date(entry.timestamp) > cutoff) {
                activity.push({ ...entry, activityType: 'change' });
              }
            } catch (e) {}
          });
        });
    }

    return activity.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Get server statuses
  getServerStatuses() {
    const statusFile = path.join(this.stateDir, 'server-status.json');
    if (!fs.existsSync(statusFile)) return {};
    
    try {
      return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  // Heartbeat to keep session alive
  startHeartbeat() {
    setInterval(() => {
      const sessionFile = path.join(this.stateDir, 'sessions', `${this.sessionId}.json`);
      if (fs.existsSync(sessionFile)) {
        const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        data.lastSeen = new Date().toISOString();
        fs.writeFileSync(sessionFile, JSON.stringify(data, null, 2));
      }
    }, 30000); // Every 30 seconds
  }

  // Cleanup old files
  cleanup() {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    // Clean old sessions
    const sessionsDir = path.join(this.stateDir, 'sessions');
    fs.readdirSync(sessionsDir).forEach(file => {
      const filePath = path.join(sessionsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime < threeDaysAgo) {
        fs.unlinkSync(filePath);
      }
    });

    // Clean old logs (keep last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    [path.join(this.stateDir, 'logs'), path.join(this.stateDir, 'changes')].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < weekAgo) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
  }

  // Display status
  displayStatus() {
    const sessions = this.getActiveSessions();
    const servers = this.getServerStatuses();
    const activity = this.getRecentActivity(0.5); // Last 30 minutes

    console.log('\n🔄 Muralla Local Shared State');
    console.log('================================');
    
    console.log(`\n📱 Active Sessions (${sessions.length}):`);
    sessions.forEach(session => {
      const age = Math.round((Date.now() - new Date(session.startTime)) / 60000);
      console.log(`  ${session.type.padEnd(8)} | ${session.id} | ${age}m ago`);
    });

    console.log(`\n🚀 Server Status:`);
    Object.values(servers).forEach(server => {
      const status = server.status === 'running' ? '✅' : server.status === 'starting' ? '🔄' : '❌';
      console.log(`  ${status} ${server.service.padEnd(10)} | Port ${server.port || 'N/A'} | ${server.sessionId.split('-')[0]}`);
    });

    console.log(`\n📝 Recent Activity (${activity.length} items):`);
    activity.slice(-5).forEach(item => {
      const time = new Date(item.timestamp).toLocaleTimeString();
      const type = item.activityType === 'command' ? '💻' : '🔧';
      const desc = item.activityType === 'command' ? 
        `${item.command} ${item.status === 'success' ? '✅' : '❌'}` : 
        `${item.type}: ${item.description}`;
      console.log(`  ${type} ${time} | ${desc.substring(0, 60)}...`);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const state = new LocalSharedState();
  const [,, command, ...args] = process.argv;

  switch (command) {
    case 'status':
      state.displayStatus();
      break;
      
    case 'log':
      const [cmd, output, status] = args;
      state.logCommand(cmd, output, status || 'success');
      console.log('✅ Command logged');
      break;
      
    case 'change':
      const [type, description, ...files] = args;
      state.logChange(type, description, files);
      console.log('✅ Change logged');
      break;
      
    case 'server':
      const [service, serverStatus, port] = args;
      state.updateServerStatus(service, serverStatus, port);
      console.log('✅ Server status updated');
      break;
      
    case 'activity':
      const hours = parseInt(args[0]) || 1;
      console.log(JSON.stringify(state.getRecentActivity(hours), null, 2));
      break;
      
    case 'cleanup':
      state.cleanup();
      console.log('✅ Cleanup completed');
      break;
      
    case 'watch':
      console.log('👀 Watching for changes... (Ctrl+C to stop)');
      setInterval(() => {
        process.stdout.write('\r' + new Date().toLocaleTimeString() + ' - Monitoring...');
      }, 1000);
      break;
      
    default:
      console.log('Muralla Local Shared State');
      console.log('Usage:');
      console.log('  node local-sync.js status           # Show current status');
      console.log('  node local-sync.js log "cmd" "out"  # Log command');
      console.log('  node local-sync.js change "type" "desc" [files...]  # Log change');
      console.log('  node local-sync.js server "svc" "status" [port]     # Update server');
      console.log('  node local-sync.js activity [hours] # Show activity');
      console.log('  node local-sync.js cleanup          # Clean old files');
      console.log('  node local-sync.js watch            # Monitor mode');
  }
}

module.exports = LocalSharedState;
