/**
 * Connect to MongoDB
 * @returns {Promise} MongoDB connection
 */
export function connectDB(): Promise<any>;
/**
 * Disconnect from MongoDB
 * @returns {Promise} Disconnect result
 */
export function disconnectDB(): Promise<any>;
/**
 * Get current MongoDB connection status
 * @returns {string} Connection status
 */
export function getConnectionStatus(): string;
