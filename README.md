# Sporty Hero Game Automation System

A comprehensive automation system for the Sporty Hero game, featuring a proxy server for traffic interception, WebSocket monitoring, and automated game interactions.

## Features

- **Advanced Proxy Server**
  - HTTP/HTTPS/WebSocket traffic interception
  - Rotating proxy support with automatic failover
  - STOMP protocol message parsing and modification
  - Real-time WebSocket monitoring

- **Game Automation**
  - Automated login and game navigation
  - Coordinate-based UI interaction
  - Configurable bet amounts and cashout targets
  - Real-time multiplier tracking
  - Automated betting and cashout strategies

- **Modern Dashboard**
  - Real-time statistics and monitoring
  - Game state visualization
  - Configuration management
  - Session history tracking
  - Profit/loss analytics

- **Robust Architecture**
  - Event-driven design
  - Error recovery mechanisms
  - Comprehensive logging
  - Type-safe implementations
  - Modular component structure

## Prerequisites

- Node.js 18.0.0 or higher
- Chrome/Chromium browser
- Active Sporty Hero game account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sporty-hero-automation
```

2. Install dependencies:
```bash
npm install
```

3. Configure the system:
   - Copy `.env.example` to `.env`
   - Update credentials and settings in `src/config.js`

## Usage

### Start the Complete System

```bash
# Start everything (proxy server, bot, and dashboard)
node src/cli.js start --debug
```

### Start Components Individually

```bash
# Start the proxy server
npm run proxy

# Start the automation bot
npm run bot

# Start the dashboard
npm run dev
```

### CLI Options

```bash
# Show available commands
node src/cli.js --help

# Start with custom settings
node src/cli.js start --bet-amount 200 --cashout 2.5 --auto-bet
```

## Configuration

Edit `src/config.js` to customize:

- Proxy server ports
- Game credentials
- Betting strategies
- Proxy server list
- Automation behavior

## Architecture

### Components

1. **Proxy Server** (`src/proxy/`)
   - Traffic interception
   - WebSocket handling
   - STOMP message processing
   - Proxy rotation

2. **Game Automation** (`src/automation/`)
   - Browser automation
   - Game interaction
   - State management
   - Event handling

3. **Dashboard** (`src/App.tsx`)
   - Real-time monitoring
   - Configuration interface
   - Statistics display
   - Control panel

4. **Core Utilities** (`src/utils/`)
   - Logging system
   - Configuration management
   - Helper functions
   - Type definitions

### Data Flow

1. Proxy server intercepts game traffic
2. STOMP messages are parsed and analyzed
3. Game state is extracted and broadcast
4. Automation system responds to events
5. Dashboard updates in real-time
6. User controls affect automation behavior

## Security

- Credentials are stored securely in environment variables
- Proxy rotation prevents detection
- Secure WebSocket connections
- Rate limiting implementation
- Error handling and validation

## Monitoring

The dashboard provides real-time information about:

- Current game state
- Betting history
- Win/loss statistics
- Proxy server status
- System performance
- Error logs

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check proxy server status
   - Verify network connectivity
   - Ensure valid credentials

2. **Automation Failures**
   - Verify browser compatibility
   - Check screen resolution
   - Update click coordinates

3. **Performance Issues**
   - Monitor system resources
   - Check proxy server load
   - Adjust automation timing

### Logs

- Check `logs/` directory for detailed logs
- Enable debug mode for verbose output
- Monitor dashboard for real-time status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Create an issue for bug reports
- Join our Discord community
- Check the wiki for guides

## Disclaimer

This tool is for educational purposes only. Use responsibly and in accordance with all applicable terms of service and regulations.