import chalk from 'chalk';

/**
 * Enhanced logger with color-coded output and file logging
 */
class Logger {
  constructor() {
    this.debugEnabled = process.env.DEBUG === 'true';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      debug: 0,
      info: 1,
      success: 1,
      warn: 2,
      error: 3,
      critical: 4
    };
  }

  /**
   * Formats a timestamp for log messages
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    return chalk.gray(`[${new Date().toISOString()}]`);
  }

  /**
   * Checks if a message should be logged based on log level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to log the message
   */
  shouldLog(level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }

  /**
   * Formats a log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Function} colorFn - Chalk color function
   * @returns {string} Formatted message
   */
  formatMessage(level, message, colorFn) {
    return `${this.getTimestamp()} ${colorFn(level.toUpperCase())} ${message}`;
  }

  /**
   * Log a debug message (only when debug is enabled)
   * @param {string} message - Message to log
   */
  debug(message) {
    if (this.debugEnabled && this.shouldLog('debug')) {
      const formattedMessage = this.formatMessage('debug', message, chalk.blue);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    if (this.shouldLog('info')) {
      const formattedMessage = this.formatMessage('info', message, chalk.blue);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log a success message
   * @param {string} message - Message to log
   */
  success(message) {
    if (this.shouldLog('success')) {
      const formattedMessage = this.formatMessage('success', message, chalk.green);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   */
  warn(message) {
    if (this.shouldLog('warn')) {
      const formattedMessage = this.formatMessage('warning', message, chalk.yellow);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   */
  error(message) {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message, chalk.red);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log a critical error message
   * @param {string} message - Message to log
   */
  critical(message) {
    if (this.shouldLog('critical')) {
      const formattedMessage = this.formatMessage('critical', message, chalk.bgRed.white);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log a message with a custom tag
   * @param {string} tag - Custom tag
   * @param {string} message - Message to log
   * @param {Function} color - Chalk color function
   */
  custom(tag, message, color = chalk.white) {
    const formattedMessage = `${this.getTimestamp()} ${color(tag)} ${message}`;
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Write a log message to file
   * @param {string} message - Message to write
   */
  writeToFile(message) {
    if (this.logToFile) {
      // In a browser environment, we can't write to files
      // This would be implemented differently in a Node.js environment
      try {
        const cleanMessage = message.replace(/\u001b\[.*?m/g, ''); // Remove ANSI color codes
        // In a real implementation, this would write to a file
        console.debug('[File Log]', cleanMessage);
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  /**
   * Group related log messages
   * @param {string} label - Group label
   * @param {Function} fn - Function containing log messages
   */
  group(label, fn) {
    console.group(this.formatMessage('group', label, chalk.cyan));
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Log a table of data
   * @param {Array|Object} data - Data to display in table
   * @param {Array} columns - Column names to include
   */
  table(data, columns) {
    console.log(this.getTimestamp());
    console.table(data, columns);
  }

  /**
   * Clear the console
   */
  clear() {
    console.clear();
  }
}

export const logger = new Logger();
export default logger;