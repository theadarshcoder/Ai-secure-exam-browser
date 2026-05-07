const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * 📖 Swagger Documentation Setup
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vision Exam Platform API',
      version: '1.0.0',
      description: 'Enterprise AI-Proctored Exam SaaS API Documentation',
      contact: {
        name: 'Vision Support',
        url: 'https://vision.io/support'
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'V1 API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Mount Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'Vision API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    }
  }));
};

module.exports = setupSwagger;
