const http = require('http');
const net = require('net');
const tls = require('tls');
const { URL } = require('url');
const WebSocket = require('ws');
const HttpsProxyAgent = require('https-proxy-agent');
const { stompToJson, modifyBetAmount, modifyCashoutCoefficient } = require('./stomp-parser');

class UniversalProxy {
  constructor() {
    this.proxyList = [
      '38.153.152.244:9594:xneilhsx:f9d9rj06j6d8',
      '86.38.234.176:6630:xneilhsx:f9d9rj06j6d8',
      '173.211.0.148:6641:xneilhsx:f9d9rj06j6d8',
      '161.123.152.115:6360:xneilhsx:f9d9rj06j6d8',
      '216.10.27.159:6837:xneilhsx:f9d9rj06j6d8',
      '154.36.110.199:6853:xneilhsx:f9d9rj06j6d8',
      '45.151.162.198:6600:xneilhsx:f9d9rj06j6d8',
      '185.199.229.156:7492:xneilhsx:f9d9rj06j6d8',
      '185.199.228.220:7300:xneilhsx:f9d9rj06j6d8',
      '185.199.231.45:8382:xneilhsx:f9d9rj06j6d8'
    ].map(proxyStr => {
      const [host, port, username, password] = proxyStr.split(':');
      return {
        host,
        port: parseInt(port),
        auth: `${username}:${password}`
      };
    });
    this.currentProxyIndex = 0;
    this.connectionPool = new Map();
  }

  start(port) {
    const server = http.createServer();
    server.on('request', this.handleHttp.bind(this));
    server.on('connect', this.handleConnect.bind(this));
    server.on('upgrade', this.handleUpgrade.bind(this));
    server.listen(port, () => console.log(`Universal Proxy:${port}`));
  }

  async handleHttp(clientReq, clientRes) {
    const proxy = this.getNextProxy();
    const parsedUrl = new URL(clientReq.url);

    const options = {
      host: proxy.host,
      port: proxy.port,
      path: clientReq.url,
      method: clientReq.method,
      headers: {
        ...clientReq.headers,
        'Proxy-Authorization': `Basic ${Buffer.from(proxy.auth).toString('base64')}`
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    });

    proxyReq.on('error', (err) => {
      clientRes.writeHead(500);
      clientRes.end('Proxy error');
    });

    clientReq.pipe(proxyReq);
  }

  handleConnect(clientReq, clientSocket, head) {
    const proxy = this.getNextProxy();
    const [targetHost, targetPort] = clientReq.url.split(':');
    const targetPortNumber = targetPort ? parseInt(targetPort) : 443;

    const proxySocket = net.connect(proxy.port, proxy.host, () => {
      const connectRequest = `CONNECT ${targetHost}:${targetPortNumber} HTTP/1.1\r\n` +
        `Host: ${targetHost}:${targetPortNumber}\r\n` +
        `Proxy-Authorization: Basic ${Buffer.from(proxy.auth).toString('base64')}\r\n\r\n`;
      proxySocket.write(connectRequest);

      proxySocket.once('data', (data) => {
        const response = data.toString();
        if (!response.startsWith('HTTP/1.1 200')) {
          clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          proxySocket.end();
          return;
        }

        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

        proxySocket.pipe(clientSocket);
        clientSocket.pipe(proxySocket);

        if (head.length > 0) {
          proxySocket.write(head);
        }
      });
    });

    proxySocket.on('error', (err) => {
      clientSocket.end();
    });

    clientSocket.on('error', (err) => {
      proxySocket.end();
    });
  }

  handleUpgrade(clientReq, clientSocket, head) {
    const proxy = this.getNextProxy();
    const targetHost = clientReq.headers.host;
    const targetUrl = `wss://${targetHost}${clientReq.url}`;

    const agent = new HttpsProxyAgent({
      host: proxy.host,
      port: proxy.port,
      auth: proxy.auth
    });

    const wsProxy = new WebSocket(targetUrl, {
      headers: clientReq.headers,
      agent
    });

    const clientWs = new WebSocket(null);
    clientWs.setSocket(clientSocket, head);

    clientWs.on('message', (data) => {
      const modified = this.processFrame(data.toString());
      wsProxy.send(modified);
    });

    wsProxy.on('message', (data) => {
      clientWs.send(data.toString());
    });

    wsProxy.on('error', (err) => {
      clientWs.close();
    });

    clientWs.on('error', (err) => {
      wsProxy.close();
    });
  }

  processFrame(frame) {
    const message = stompToJson(frame);

    if (message.headers.destination === '/queue/bet') {
      return modifyBetAmount(frame, 100); // Adjust bet amount as needed
    }

    if (message.headers.destination === '/queue/cashout') {
      return modifyCashoutCoefficient(frame, this.lastMultiplier); // Ensure lastMultiplier is tracked
    }

    return frame;
  }

  getNextProxy() {
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }
}

new UniversalProxy().start(8080);
