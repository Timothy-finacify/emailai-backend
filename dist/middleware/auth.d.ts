/**
 * Main authentication middleware
 * Verifies JWT token and fetches user
 */
export function authMiddleware(req: any, res: any, next: any): Promise<any>;
/**
 * Middleware to require email verification
 * Must be used AFTER authMiddleware
 */
export function requireVerification(req: any, res: any, next: any): any;
/**
 * Middleware to require specific user roles
 * Usage: requireRole('admin', 'premium')
 */
export function requireRole(...roles: any[]): (req: any, res: any, next: any) => any;
/**
 * Optional: Middleware to track user activity (optional)
 */
export function trackActivity(req: any, res: any, next: any): void;
