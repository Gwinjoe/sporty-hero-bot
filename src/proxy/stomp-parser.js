/**
 * STOMP Protocol Parser and Message Modifier
 */

import { logger } from '../utils/logger.js';

/**
 * Converts a STOMP frame to a JSON object
 * @param {string} stompFrame - The STOMP frame string
 * @returns {Object} - Parsed STOMP message
 */
export function stompToJson(stompFrame) {
  try {
    const lines = stompFrame.split('\n');
    const command = lines.shift();
    const headers = {};
    let bodyStartIndex = lines.indexOf('');

    // Parse headers
    for (let i = 0; i < bodyStartIndex; i++) {
      const line = lines[i];
      const [key, ...rest] = line.split(':');
      headers[key.trim()] = rest.join(':').trim();
    }

    // Join the rest of the lines as body
    const bodyLines = lines.slice(bodyStartIndex + 1);
    const rawBody = bodyLines.join('\n');
    const body = rawBody.endsWith('\x00')
      ? rawBody.slice(0, -1)
      : rawBody;

    return {
      command,
      headers,
      body
    };
  } catch (err) {
    logger.error(`Error parsing STOMP frame: ${err.message}`);
    return { command: '', headers: {}, body: '' };
  }
}

/**
 * Converts a JSON object to a STOMP frame
 * @param {Object} message - The message object with command, headers, and body
 * @returns {string} - STOMP frame
 */
export function jsonToStomp({ command, headers = {}, body = '' }) {
  try {
    let frame = `${command}\n`;

    for (const [key, value] of Object.entries(headers)) {
      frame += `${key}:${value}\n`;
    }

    frame += `\n${body}\x00`; // Add empty line before body, and null char at end
    return frame;
  } catch (err) {
    logger.error(`Error converting to STOMP frame: ${err.message}`);
    return '';
  }
}

/**
 * Modifies the bet amount in a STOMP message
 * @param {string} originalMessage - Original STOMP message
 * @param {number} newAmount - New bet amount
 * @returns {string} - Modified STOMP message
 */
export function modifyBetAmount(originalMessage, newAmount) {
  try {
    // Parse original message
    const parsed = stompToJson(originalMessage);

    // Modify bet amount
    const body = JSON.parse(parsed.body);
    const originalAmount = body.betAmount;
    body.betAmount = newAmount;

    logger.debug(`Modified bet amount: ${originalAmount} -> ${newAmount}`);

    // Update content length if present
    const headers = { ...parsed.headers };
    const newBodyString = JSON.stringify(body);
    if (headers['content-length']) {
      headers['content-length'] = newBodyString.length.toString();
    }

    // Rebuild STOMP message
    return jsonToStomp({
      command: parsed.command,
      headers,
      body: newBodyString
    });
  } catch (err) {
    logger.error(`Error modifying bet amount: ${err.message}`);
    return originalMessage;
  }
}

/**
 * Modifies the cashout coefficient in a STOMP message
 * @param {string} originalMessage - Original STOMP message
 * @param {number} coefficient - New coefficient
 * @returns {string} - Modified STOMP message
 */
export function modifyCashoutCoefficient(originalMessage, coefficient) {
  try {
    const parsed = stompToJson(originalMessage);
    const body = JSON.parse(parsed.body);

    // Store original coefficient for logging
    const originalCoefficient = body.coefficient;
    
    // Set to specified multiplier instead of random
    body.coefficient = parseFloat(coefficient.toFixed(2));

    logger.debug(`Modified cashout coefficient: ${originalCoefficient} -> ${body.coefficient}`);

    // Update content length if present
    const headers = { ...parsed.headers };
    const newBodyString = JSON.stringify(body);
    if (headers['content-length']) {
      headers['content-length'] = newBodyString.length.toString();
    }

    return jsonToStomp({
      command: parsed.command,
      headers,
      body: newBodyString
    });
  } catch (err) {
    logger.error(`Error modifying cashout coefficient: ${err.message}`);
    return originalMessage;
  }
}

/**
 * Validates a STOMP frame
 * @param {string} frame - STOMP frame to validate
 * @returns {boolean} - Whether the frame is valid
 */
export function validateStompFrame(frame) {
  try {
    // Check if frame starts with a valid STOMP command
    const validCommands = ['CONNECT', 'SEND', 'SUBSCRIBE', 'UNSUBSCRIBE', 'BEGIN', 'COMMIT', 'ABORT', 'ACK', 'NACK', 'DISCONNECT', 'MESSAGE', 'RECEIPT', 'ERROR'];
    const firstLine = frame.split('\n')[0];
    
    if (!validCommands.includes(firstLine)) {
      return false;
    }

    // Check for proper frame structure (command, headers, empty line, body, null char)
    const parts = frame.split('\n\n');
    if (parts.length < 2) {
      return false;
    }

    // Check for null terminator
    if (!frame.endsWith('\x00')) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Extracts headers from a STOMP frame
 * @param {string} frame - STOMP frame
 * @returns {Object} - Headers object
 */
export function extractHeaders(frame) {
  try {
    const lines = frame.split('\n');
    const headers = {};
    
    // Skip command line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === '') break;
      
      const [key, ...rest] = line.split(':');
      headers[key.trim()] = rest.join(':').trim();
    }
    
    return headers;
  } catch (err) {
    return {};
  }
}

export default {
  stompToJson,
  jsonToStomp,
  modifyBetAmount,
  modifyCashoutCoefficient,
  validateStompFrame,
  extractHeaders
};