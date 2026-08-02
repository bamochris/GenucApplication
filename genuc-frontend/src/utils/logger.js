/**
 * 📋 Logging structuré pour le debugging
 * Peut être remplacé par Sentry ou DataDog en production
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class Logger {
  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.logs = [];
  }

  _format(level, message, data) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  _log(level, message, data) {
    const log = this._format(level, message, data);
    this.logs.push(log);

    if (this.isDev) {
      const color = {
        DEBUG: 'color: #888',
        INFO: 'color: #0066cc',
        WARN: 'color: #ff9900',
        ERROR: 'color: #cc0000',
      }[level];
      console.log(`%c[${level}] ${message}`, color, data);
    }

    // En production: envoyer à Sentry, DataDog, etc.
    if (!this.isDev && level === LogLevel.ERROR) {
      this._sendToMonitoring(log);
    }
  }

  _sendToMonitoring(log) {
    // À implémenter: envoyer à un service de monitoring
    // if (window.Sentry) window.Sentry.captureException(log);
  }

  debug(message, data = {}) {
    this._log(LogLevel.DEBUG, message, data);
  }

  info(message, data = {}) {
    this._log(LogLevel.INFO, message, data);
  }

  warn(message, data = {}) {
    this._log(LogLevel.WARN, message, data);
  }

  error(message, data = {}) {
    this._log(LogLevel.ERROR, message, data);
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(l => l.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

const logger = new Logger();

export default logger;
