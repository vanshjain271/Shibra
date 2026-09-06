/**
 * Logger Middleware - MVP
 * 
 * Request logging with correlation IDs
 * Structured logging for production debugging
 */

const crypto = require('crypto');

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Request logger middleware
 * Adds request ID and logs request/response details
 */
function requestLogger(req, res, next) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Attach request ID to request object
  req.requestId = requestId;

  // Log request
  logRequest(req, requestId);

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    logResponse(req, res, duration, requestId);
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Log incoming request
 */
function logRequest(req, requestId) {
  const log = {
    type: 'REQUEST',
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId || null
  };

  // Don't log sensitive data
  if (req.body && !req.path.includes('password') && !req.path.includes('otp')) {
    log.body = sanitizeBody(req.body);
  }

  console.log(JSON.stringify(log));
}

/**
 * Log outgoing response
 */
function logResponse(req, res, duration, requestId) {
  const log = {
    type: 'RESPONSE',
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userId: req.user?.userId || null
  };

  // Log level based on status code
  if (res.statusCode >= 500) {
    log.level = 'ERROR';
  } else if (res.statusCode >= 400) {
    log.level = 'WARN';
  } else {
    log.level = 'INFO';
  }

  console.log(JSON.stringify(log));
}

/**
 * Sanitize request body (remove sensitive fields)
 */
function sanitizeBody(body) {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'otp', 'token', 'secret', 'key'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Error logger middleware
 */
function errorLogger(err, req, res, next) {
  const log = {
    type: 'ERROR',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    userId: req.user?.userId || null
  };

  console.error(JSON.stringify(log));

  // Pass to error handler
  next(err);
}

/**
 * Performance logger
 * Logs slow requests (> threshold ms)
 */
function performanceLogger(threshold = 1000) {
  return function(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > threshold) {
        const log = {
          type: 'SLOW_REQUEST',
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.userId || null
        };

        console.warn(JSON.stringify(log));
      }
    });

    next();
  };
}

module.exports = {
  requestLogger,
  errorLogger,
  performanceLogger
};