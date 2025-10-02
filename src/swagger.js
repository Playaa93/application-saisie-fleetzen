/**
 * Swagger/OpenAPI Documentation Configuration
 *
 * This module sets up Swagger UI for interactive API documentation.
 * It integrates with Express to serve the OpenAPI specification.
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

/**
 * Load OpenAPI specification from YAML file
 */
const loadSwaggerDocument = () => {
  try {
    const swaggerPath = path.join(__dirname, '../docs/api/openapi.yaml');

    if (!fs.existsSync(swaggerPath)) {
      console.error(`OpenAPI specification not found at: ${swaggerPath}`);
      return null;
    }

    const swaggerDocument = YAML.load(swaggerPath);
    return swaggerDocument;
  } catch (error) {
    console.error('Error loading OpenAPI specification:', error);
    return null;
  }
};

/**
 * Swagger UI configuration options
 */
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none', // 'none', 'list', or 'full'
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    displayRequestDuration: true,
    persistAuthorization: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    displayOperationId: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .information-container { margin: 30px 0 }
    .swagger-ui .scheme-container { margin: 0; padding: 15px 0 }
  `,
  customSiteTitle: 'Form Management API - Documentation',
  customfavIcon: '/favicon.ico',
};

/**
 * Setup Swagger documentation routes
 *
 * @param {Express.Application} app - Express application instance
 */
const setupSwagger = (app) => {
  const swaggerDocument = loadSwaggerDocument();

  if (!swaggerDocument) {
    console.warn('Swagger documentation not available');
    return;
  }

  // Serve Swagger UI at /api-docs
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerUiOptions)
  );

  // Serve raw OpenAPI JSON at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Serve raw OpenAPI YAML at /api-docs.yaml
  app.get('/api-docs.yaml', (req, res) => {
    const yamlPath = path.join(__dirname, '../docs/api/openapi.yaml');
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(yamlPath);
  });

  // Health check endpoint for documentation
  app.get('/api-docs/health', (req, res) => {
    res.json({
      success: true,
      message: 'API documentation is available',
      endpoints: {
        ui: '/api-docs',
        json: '/api-docs.json',
        yaml: '/api-docs.yaml',
      },
    });
  });

  console.log('✓ Swagger documentation available at /api-docs');
  console.log('✓ OpenAPI JSON available at /api-docs.json');
  console.log('✓ OpenAPI YAML available at /api-docs.yaml');
};

/**
 * Generate OpenAPI documentation from route definitions
 * Useful for keeping documentation in sync with code
 *
 * @param {Array} routes - Array of route definitions
 * @returns {Object} OpenAPI paths object
 */
const generatePathsFromRoutes = (routes) => {
  const paths = {};

  routes.forEach(route => {
    const { path, method, summary, description, responses, requestBody } = route;

    if (!paths[path]) {
      paths[path] = {};
    }

    paths[path][method.toLowerCase()] = {
      summary,
      description,
      responses: responses || {
        '200': {
          description: 'Successful response',
        },
      },
      ...(requestBody && { requestBody }),
    };
  });

  return paths;
};

/**
 * Middleware to validate requests against OpenAPI schema
 *
 * @param {Object} swaggerDocument - OpenAPI specification
 * @returns {Function} Express middleware
 */
const createValidationMiddleware = (swaggerDocument) => {
  return (req, res, next) => {
    // This is a placeholder for OpenAPI request validation
    // In production, use libraries like express-openapi-validator
    // or swagger-express-validator

    const path = req.path;
    const method = req.method.toLowerCase();

    if (swaggerDocument.paths[path] && swaggerDocument.paths[path][method]) {
      // Validation logic here
      console.log(`Validating ${method.toUpperCase()} ${path}`);
    }

    next();
  };
};

module.exports = {
  setupSwagger,
  loadSwaggerDocument,
  generatePathsFromRoutes,
  createValidationMiddleware,
  swaggerUiOptions,
};
