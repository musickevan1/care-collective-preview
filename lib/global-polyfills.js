// Global polyfills for server-side execution
// This must be imported before any other modules

// Polyfill self for server-side environment
if (typeof global !== 'undefined' && typeof self === 'undefined') {
  global.self = global;
}

// Ensure other common browser globals are available
if (typeof global !== 'undefined') {
  if (typeof window === 'undefined') {
    global.window = global;
  }
  if (typeof document === 'undefined') {
    global.document = {};
  }
  if (typeof navigator === 'undefined') {
    global.navigator = { userAgent: 'Node.js' };
  }
}

module.exports = {};