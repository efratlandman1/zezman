const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

// Initialize Sentry if DSN is provided
const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      integrations: [
        // Enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request && event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
        }
        
        // Remove sensitive body data
        if (event.request && event.request.data) {
          if (typeof event.request.data === 'object') {
            delete event.request.data.password;
            delete event.request.data.token;
            delete event.request.data.secret;
          }
        }
        
        return event;
      },
      // Ignore certain errors
      ignoreErrors: [
        'Network Error',
        'Request timeout',
        'ECONNRESET',
        'ECONNREFUSED',
        'ENOTFOUND'
      ]
    });

    // RequestHandler creates a separate execution context using domains
    app.use(Sentry.Handlers.requestHandler());
    
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }
};

// Error handler for Sentry
const sentryErrorHandler = () => {
  if (process.env.SENTRY_DSN) {
    return Sentry.Handlers.errorHandler();
  }
  return (err, req, res, next) => next(err);
};

// Capture and report errors
const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: context.tags || {},
      user: context.user || {},
      extra: context.extra || {}
    });
  }
};

// Capture and report messages
const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      tags: context.tags || {},
      user: context.user || {},
      extra: context.extra || {}
    });
  }
};

// Set user context
const setUser = (user) => {
  if (process.env.SENTRY_DSN && user) {
    Sentry.setUser({
      id: user._id || user.id,
      email: user.email,
      role: user.role
    });
  }
};

// Set tag context
const setTag = (key, value) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setTag(key, value);
  }
};

// Set extra context
const setExtra = (key, value) => {
  if (process.env.SENTRY_DSN) {
    Sentry.setExtra(key, value);
  }
};

// Flush Sentry events
const flush = async (timeout = 2000) => {
  if (process.env.SENTRY_DSN) {
    await Sentry.flush(timeout);
  }
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  setTag,
  setExtra,
  flush
}; 