
// stompParser.js

function stompToJson(stompFrame) {
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
}

function jsonToStomp({ command, headers = {}, body = '' }) {
  let frame = `${command}\n`;

  for (const [key, value] of Object.entries(headers)) {
    frame += `${key}:${value}\n`;
  }

  frame += `\n${body}\x00`; // Add empty line before body, and null char at end
  return frame;
}

function modifyBetAmount(originalMessage, newAmount) {
  // Parse original message
  const parsed = stompToJson(originalMessage);

  // Modify bet amount
  const body = JSON.parse(parsed.body);
  body.betAmount = newAmount;

  // Rebuild STOMP message
  return jsonToStomp({
    command: parsed.command,
    headers: {
      ...parsed.headers,
      'content-length': JSON.stringify(body).length.toString()
    },
    body: JSON.stringify(body)
  });
}

function modifyCashoutCoefficient(originalMessage, coefficient) {
  const parsed = stompToJson(originalMessage);
  const body = JSON.parse(parsed.body);

  // Set to last multiplier instead of random
  body.coefficient = parseFloat(coefficient.toFixed(2));

  return jsonToStomp({
    command: parsed.command,
    headers: parsed.headers,
    body: JSON.stringify(body)
  });
} module.exports = {
  stompToJson,
  jsonToStomp,
  modifyCashoutCoefficient,
  modifyBetAmount
};
