const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const getTimestamp = () => {
  return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
};

const log = (level, message, data = null) => {
  const timestamp = getTimestamp();
  const logEntry = data 
    ? `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}\n`
    : `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

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

const logger = {
  info: (message, data = null) => {
    log('info', message, data);
  },
  
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
  
  warn: (message, data = null) => {
    log('warn', message, data);
  },
  
  debug: (message, data = null) => {
    log('debug', message, data);
  }
};

module.exports = logger;