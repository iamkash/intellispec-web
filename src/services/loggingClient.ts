/**
 * Browser-safe Authentication Logging Client
 *
 * Sends auth/security events to the backend API. Avoids importing server-only
 * modules (e.g., mongoose models) so it can be safely bundled in the browser.
 */

import { getApiFullUrl } from '../config/api.config';

export type AuthEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset'
  | 'password_change'
  | 'account_locked'
  | 'account_unlocked'
  | 'token_refresh'
  | 'token_expired'
  | 'token_revoked'
  | 'permission_denied'
  | 'access_granted'
  | 'access_denied'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'admin_action';

export interface AuthLogEvent {
  tenantSlug: string;
  userId: string;
  email?: string;
  action: AuthEventType | string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date | string;
}

class AuthLoggingClient {
  async logAuthEvent(event: AuthLogEvent): Promise<void> {
    try {
      await fetch(getApiFullUrl('/api/logs/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...event, timestamp: event.timestamp ?? new Date().toISOString() })
      });
    } catch (err) {
      // Non-fatal in the client; swallow to avoid breaking UX
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('AuthLoggingClient.logAuthEvent failed', err);
      }
    }
  }
}

export const authLoggingService = new AuthLoggingClient();

export default authLoggingService;


