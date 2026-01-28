const httpProxy = require('http-proxy');
const config = require('../config');

// Create WebSocket proxy for ride updates
const rideProxy = httpProxy.createProxyServer({ ws: true });

rideProxy.on('error', (err, req, socket) => {
  console.error('[Ride WS] Proxy error:', err.message);
  socket.destroy();
});

rideProxy.on('proxyRes', (proxyRes, req, res) => {
  console.log(`[Ride WS] Connection upgraded for: ${req.url}`);
});

rideProxy.on('proxyReq', (proxyReq, req, res) => {
  // Add authentication for WebSocket connections
  if (req.headers['sec-websocket-protocol']) {
    const token = req.headers['sec-websocket-protocol'];
    proxyReq.setHeader('Authorization', `Bearer ${token}`);
  }
  if (req.user) {
    proxyReq.setHeader('X-User-ID', req.user.id || '');
    proxyReq.setHeader('X-User-Role', req.user.role || '');
  }
  proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || Date.now().toString());
});

module.exports = {
  upgrade: (req, socket, head) => {
    rideProxy.ws(req, socket, head, {
      target: config.rideWebSocket,
      ws: true,
      changeOrigin: true
    });
  }
};