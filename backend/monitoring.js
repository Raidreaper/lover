import fs from 'fs';
import path from 'path';

class ServerMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      aiRequests: 0,
      aiFailures: 0,
      activeConnections: 0,
      peakConnections: 0,
      memoryUsage: [],
      responseTimes: [],
      errors: []
    };
    
    this.logDir = './logs';
    this.ensureLogDirectory();
    this.startPeriodicLogging();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logRequest(req, res, duration) {
    this.stats.totalRequests++;
    this.stats.responseTimes.push(duration);
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Keep only last 1000 response times for memory efficiency
    if (this.stats.responseTimes.length > 1000) {
      this.stats.responseTimes = this.stats.responseTimes.slice(-1000);
    }

    // Log to file
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    this.writeToLog('requests.log', logEntry);
  }

  logAIRequest(success, duration, error = null) {
    this.stats.aiRequests++;
    
    if (!success) {
      this.stats.aiFailures++;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      success: success,
      duration: duration,
      error: error ? error.message : null
    };

    this.writeToLog('ai-requests.log', logEntry);
  }

  logError(error, context = {}) {
    this.stats.errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context
    });

    // Keep only last 100 errors
    if (this.stats.errors.length > 100) {
      this.stats.errors = this.stats.errors.slice(-100);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context
    };

    this.writeToLog('errors.log', logEntry);
  }

  updateConnectionCount(count) {
    this.stats.activeConnections = count;
    if (count > this.stats.peakConnections) {
      this.stats.peakConnections = count;
    }
  }

  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const avgResponseTime = this.stats.responseTimes.length > 0 
      ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length 
      : 0;

    const memoryUsage = process.memoryUsage();
    this.stats.memoryUsage.push({
      timestamp: Date.now(),
      ...memoryUsage
    });

    // Keep only last 100 memory readings
    if (this.stats.memoryUsage.length > 100) {
      this.stats.memoryUsage = this.stats.memoryUsage.slice(-100);
    }

    return {
      uptime: {
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
        days: Math.floor(uptime / 86400000)
      },
      requests: {
        total: this.stats.totalRequests,
        successful: this.stats.successfulRequests,
        failed: this.stats.failedRequests,
        successRate: this.stats.totalRequests > 0 
          ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + '%'
          : '0%'
      },
      ai: {
        total: this.stats.aiRequests,
        failures: this.stats.aiFailures,
        successRate: this.stats.aiRequests > 0 
          ? (((this.stats.aiRequests - this.stats.aiFailures) / this.stats.aiRequests) * 100).toFixed(2) + '%'
          : '0%'
      },
      connections: {
        current: this.stats.activeConnections,
        peak: this.stats.peakConnections
      },
      performance: {
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        memoryUsage: {
          rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + 'MB',
          heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
          heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB'
        }
      },
      errors: {
        count: this.stats.errors.length,
        recent: this.stats.errors.slice(-5)
      }
    };
  }

  writeToLog(filename, data) {
    const logPath = path.join(this.logDir, filename);
    const logLine = JSON.stringify(data) + '\n';
    
    fs.appendFile(logPath, logLine, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  startPeriodicLogging() {
    // Log stats every 5 minutes
    setInterval(() => {
      const stats = this.getStats();
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'periodic_stats',
        stats: stats
      };
      
      this.writeToLog('server-stats.log', logEntry);
      console.log('📊 Server Stats:', {
        uptime: stats.uptime,
        requests: stats.requests.successRate,
        ai: stats.ai.successRate,
        connections: stats.connections.current,
        memory: stats.performance.memoryUsage.rss
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up old log files (keep last 7 days)
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  cleanupOldLogs() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    fs.readdir(this.logDir, (err, files) => {
      if (err) {
        console.error('Failed to read log directory:', err);
        return;
      }

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (now - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Failed to delete old log file:', err);
              } else {
                console.log('🧹 Deleted old log file:', file);
              }
            });
          }
        });
      });
    });
  }

  // Health check method
  isHealthy() {
    const stats = this.getStats();
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.rss / 1024 / 1024;
    
    // Consider unhealthy if:
    // - Memory usage > 1GB
    // - Error rate > 20%
    // - AI failure rate > 50%
    const errorRate = this.stats.totalRequests > 0 
      ? (this.stats.failedRequests / this.stats.totalRequests) * 100 
      : 0;
    const aiFailureRate = this.stats.aiRequests > 0 
      ? (this.stats.aiFailures / this.stats.aiRequests) * 100 
      : 0;

    return {
      healthy: memoryUsageMB < 1024 && errorRate < 20 && aiFailureRate < 50,
      issues: {
        highMemory: memoryUsageMB >= 1024,
        highErrorRate: errorRate >= 20,
        highAIFailureRate: aiFailureRate >= 50
      },
      metrics: {
        memoryUsageMB: memoryUsageMB.toFixed(2),
        errorRate: errorRate.toFixed(2) + '%',
        aiFailureRate: aiFailureRate.toFixed(2) + '%'
      }
    };
  }
}

export default ServerMonitor; 