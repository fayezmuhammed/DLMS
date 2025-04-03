const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

/**
 * Format the current timestamp for logs
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
};

/**
 * Log a message to both console and file
 * @param {string} level - Log level (info, error, warn, debug)
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
const log = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const logEntry = data 
    ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  // Write to appropriate log file based on level
  const logFile = path.join(logsDir, `${level}.log`);
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
  
  // Also write to combined log
  const combinedLogFile = path.join(logsDir, 'combined.log');
  fs.appendFile(combinedLogFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to combined log file:', err);
    }
  });
  
  // Output to console based on log level
  switch (level) {
    case 'error':
      console.error(logEntry.trim());
      break;
    case 'warn':
      console.warn(logEntry.trim());
      break;
    case 'info':
      console.log(logEntry.trim());
      break;
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.log(logEntry.trim());
      }
      break;
    default:
      console.log(logEntry.trim());
  }
};

/**
 * Logger object with methods for different log levels
 */
const logger = {
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} [data] - Additional data to log
   */
  info: (message, data = null) => {
    log('info', message, data);
  },
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Object|Error} [error] - Error object or data to log
   */
  error: (message, error = null) => {
    let errorData = null;
    
    if (error instanceof Error) {
      errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else if (error) {
      errorData = error;
    }
    
    log('error', message, errorData);
  },
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} [data] - Additional data to log
   */
  warn: (message, data = null) => {
    log('warn', message, data);
  },
  
  /**
   * Log a debug message (only in non-production environments)
   * @param {string} message - Message to log
   * @param {Object} [data] - Additional data to log
   */
  debug: (message, data = null) => {
    log('debug', message, data);
  }
};

module.exports = logger; 