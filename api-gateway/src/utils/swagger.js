const fs = require('fs');
const path = require('path');

// Generate complete OpenAPI spec dynamically
const generateOpenAPISpec = (req) => {
  const baseUrl = req ? `${req.protocol}://${req.get('host')}/api/v1` : 'http://localhost:3000/api/v1';
  
  return {
    openapi: '3.0.3',
    info: {
      title: 'CAB Booking System API Gateway',
      description: 'Main API Gateway for CAB Booking System - Routes requests to microservices',
      version: '1.0.0',
      contact: {
        name: 'DHHTTT18A-N12 Team',
        url: 'https://github.com/Ngochanh11/DHHTTT18A-N12-cab-system'
      }
    },
    servers: [
      {
        url: baseUrl,
        description: 'API Gateway'
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local Development'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Service is healthy'
            }
          }
        }
      },
      '/test': {
        get: {
          tags: ['Testing'],
          summary: 'Test endpoint',
          operationId: 'testEndpoint',
          responses: {
            '200': {
              description: 'API Gateway is working'
            }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          operationId: 'login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Login successful' },
            '401': { description: 'Invalid credentials' }
          }
        }
      },
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'User registration',
          operationId: 'register',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                    phone: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'User created' },
            '400': { description: 'Invalid input' }
          }
        }
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get users',
          operationId: 'getUsers',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of users' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/drivers': {
        get: {
          tags: ['Drivers'],
          summary: 'Get available drivers',
          operationId: 'getDrivers',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of drivers' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/bookings': {
        get: {
          tags: ['Bookings'],
          summary: 'Get bookings',
          operationId: 'getBookings',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of bookings' },
            '401': { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Bookings'],
          summary: 'Create booking',
          operationId: 'createBooking',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Booking created' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/rides': {
        get: {
          tags: ['Rides'],
          summary: 'Get rides',
          operationId: 'getRides',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of rides' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/payments': {
        post: {
          tags: ['Payments'],
          summary: 'Create payment',
          operationId: 'createPayment',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Payment created' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/pricings': {
        get: {
          tags: ['Pricing'],
          summary: 'Get pricing',
          operationId: 'getPricing',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Pricing information' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notifications',
          operationId: 'getNotifications',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of notifications' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/reviews': {
        get: {
          tags: ['Reviews'],
          summary: 'Get reviews',
          operationId: 'getReviews',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of reviews' },
            '401': { description: 'Unauthorized' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  };
};

// Serve OpenAPI JSON
const serveOpenAPIJson = (req, res) => {
  const spec = generateOpenAPISpec(req);
  res.json(spec);
};

// Serve Swagger UI
const serveSwaggerUI = (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>CAB Booking System API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin:0; background: #fafafa; }
      .top-bar { background: #1a1a1a; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
      .logo { font-size: 1.5em; font-weight: bold; }
      .version { font-size: 0.9em; color: #ccc; }
    </style>
  </head>
  <body>
    <div class="top-bar">
      <div class="logo">🚕 CAB Booking System</div>
      <div class="version">API Gateway v1.0.0</div>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          url: window.location.origin + '/api/v1/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          defaultModelsExpandDepth: 2,
          defaultModelExpandDepth: 2
        });
        window.ui = ui;
      }
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
};

module.exports = {
  generateOpenAPISpec,
  serveOpenAPIJson,
  serveSwaggerUI
};