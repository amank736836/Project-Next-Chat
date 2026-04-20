// Add mongoose to global type to prevent multiple connections in dev
if (typeof global !== 'undefined') {
  global.mongoose = global.mongoose || { conn: null, promise: null };
}
