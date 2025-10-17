/**
 * Comprehensive Authentication and Security Logging Service
 * 
 * Provides detailed logging for authentication events, access control decisions,
 * and security-related activities with tenant isolation and IP tracking.
 * 
 * Features:
 * - Comprehensive auth event logging
 * - IP address and geolocation tracking
 * - User agent and device fingerprinting
 * - Security anomaly detection
 * - Rate limiting violation tracking
 * - Failed authentication pattern analysis
 * - Tenant-scoped logging with isolation
 * - Real-time alerting for security events
 * - Log aggregation and analysis
 * - GDPR-compliant data retention
 */

import { AuthLog } from '../models';

// ==================== TYPES AND INTERFACES ====================

/**
 * Extended authentication event types
 */
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
  | 'email_verification'
  | 'mfa_success'
  | 'mfa_failure'
  | 'permission_denied'
  | 'access_granted'
  | 'access_denied'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'privilege_escalation'
  | 'admin_action'
  | 'user_created'
  | 'user_deleted'
  | 'role_assigned'
  | 'role_removed'
  | 'tenant_accessed'
  | 'api_key_used'
  | 'export_data'
  | 'import_data';

/**
 * Security risk levels
 */
export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Device and browser information
 */
export interface DeviceInfo {
  userAgent: string;
  browser?: {
    name: string;
    version: string;
  };
  os?: {
    name: string;
    version: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    model?: string;
  };
  fingerprint?: string;
}

/**
 * Geolocation information
 */
export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
}

/**
 * Security context for logging
 */
export interface SecurityContext {
  riskLevel: SecurityRiskLevel;
  anomalyScore?: number;
  threats?: string[];
  mitigations?: string[];
  relatedEvents?: string[];
}

/**
 * Enhanced auth log entry
 */
export interface EnhancedAuthLog {
  tenantSlug: string;
  userId: string;
  email?: string;
  action: AuthEventType;
  ipAddress: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  geoLocation?: GeoLocation;
  securityContext?: SecurityContext;
  metadata?: {
    reason?: string;
    errorCode?: string;
    duration?: number;
    resourceType?: string;
    resourceId?: string;
    route?: string;
    method?: string;
    statusCode?: number;
    requestSize?: number;
    responseSize?: number;
    additionalInfo?: any;
  };
  correlationId?: string;
  sessionId?: string;
  timestamp: Date;
}

/**
 * Log aggregation result
 */
export interface LogAggregation {
  tenantSlug: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  eventBreakdown: Record<AuthEventType, number>;
  uniqueUsers: number;
  uniqueIPs: number;
  riskLevelBreakdown: Record<SecurityRiskLevel, number>;
  topCountries: Array<{ country: string; count: number; percentage: number }>;
  topUserAgents: Array<{ userAgent: string; count: number; percentage: number }>;
  suspiciousActivities: number;
  alertsTriggered: number;
}

/**
 * Security alert configuration
 */
export interface SecurityAlert {
  id: string;
  name: string;
  description: string;
  severity: SecurityRiskLevel;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  tenantSpecific: boolean;
}

/**
 * Alert condition
 */
export interface AlertCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'regex' | 'in' | 'frequency';
  value: any;
  timeWindow?: number; // in minutes
}

/**
 * Alert action
 */
export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'block_ip' | 'lock_account' | 'notify_admin';
  target: string;
  parameters?: Record<string, any>;
}

// ==================== LOGGING SERVICE CLASS ====================

export class AuthLoggingService {
  private static instance: AuthLoggingService;
  private alertRules: SecurityAlert[] = [];
  private ipGeoCache = new Map<string, GeoLocation>();
  private suspiciousIPs = new Set<string>();
  private rateLimitViolations = new Map<string, number>();

  private constructor() {
    this.initializeDefaultAlerts();
  }

  public static getInstance(): AuthLoggingService {
    if (!AuthLoggingService.instance) {
      AuthLoggingService.instance = new AuthLoggingService();
    }
    return AuthLoggingService.instance;
  }

  /**
   * Log authentication event with enhanced context
   */
  async logAuthEvent(event: Partial<EnhancedAuthLog>): Promise<void> {
    try {
      // Generate correlation ID if not provided
      const correlationId = event.correlationId || this.generateCorrelationId();

      // Enhance event with additional context
      const enhancedEvent = await this.enhanceLogEvent(event);

      // Determine security context
      const securityContext = await this.analyzeSecurityContext(enhancedEvent);

      // Create log entry
      await AuthLog.create({
        tenantSlug: enhancedEvent.tenantSlug,
        userId: enhancedEvent.userId,
        email: enhancedEvent.email,
        action: enhancedEvent.action,
        ipAddress: enhancedEvent.ipAddress,
        userAgent: enhancedEvent.userAgent,
        metadata: {
          ...enhancedEvent.metadata,
          deviceInfo: enhancedEvent.deviceInfo,
          geoLocation: enhancedEvent.geoLocation,
          securityContext,
          correlationId,
          sessionId: enhancedEvent.sessionId
        },
        timestamp: enhancedEvent.timestamp || new Date()
      });

      // Check for security alerts
      await this.checkSecurityAlerts(enhancedEvent, securityContext);

      // Update suspicious activity tracking
      await this.updateSuspiciousActivityTracking(enhancedEvent);
} catch (error) {
      console.error('Failed to log auth event:', error);
      // Don't throw error to avoid breaking auth flow
    }
  }

  /**
   * Enhance log event with additional context
   */
  private async enhanceLogEvent(event: Partial<EnhancedAuthLog>): Promise<EnhancedAuthLog> {
    const enhanced: EnhancedAuthLog = {
      tenantSlug: event.tenantSlug || 'unknown',
      userId: event.userId || 'unknown',
      email: event.email,
      action: event.action || 'unknown' as AuthEventType,
      ipAddress: event.ipAddress || 'unknown',
      userAgent: event.userAgent,
      timestamp: event.timestamp || new Date()
    };

    // Parse device information from User-Agent
    if (event.userAgent) {
      enhanced.deviceInfo = this.parseUserAgent(event.userAgent);
    }

    // Get geolocation for IP address
    if (event.ipAddress && event.ipAddress !== 'unknown') {
      enhanced.geoLocation = await this.getGeoLocation(event.ipAddress);
    }

    // Add metadata
    enhanced.metadata = event.metadata || {};
    enhanced.correlationId = event.correlationId;
    enhanced.sessionId = event.sessionId;

    return enhanced;
  }

  /**
   * Analyze security context for the event
   */
  private async analyzeSecurityContext(event: EnhancedAuthLog): Promise<SecurityContext> {
    let riskLevel: SecurityRiskLevel = 'low';
    let anomalyScore = 0;
    const threats: string[] = [];
    const mitigations: string[] = [];

    // Analyze IP reputation
    if (this.suspiciousIPs.has(event.ipAddress)) {
      riskLevel = 'high';
      anomalyScore += 30;
      threats.push('Known suspicious IP');
    }

    // Check for unusual geolocation
    if (event.geoLocation) {
      const isUnusualLocation = await this.checkUnusualLocation(event.tenantSlug, event.userId, event.geoLocation);
      if (isUnusualLocation) {
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        anomalyScore += 20;
        threats.push('Unusual geographic location');
      }
    }

    // Check for failed login patterns
    if (event.action === 'login_failure') {
      const recentFailures = await this.getRecentFailedLogins(event.tenantSlug, event.userId, 15); // 15 minutes
      if (recentFailures >= 3) {
        riskLevel = 'high';
        anomalyScore += 25;
        threats.push('Multiple failed login attempts');
      }
    }

    // Check for rate limiting violations
    const rateLimitKey = `${event.ipAddress}-${event.tenantSlug}`;
    const violations = this.rateLimitViolations.get(rateLimitKey) || 0;
    if (violations > 5) {
      riskLevel = 'critical';
      anomalyScore += 40;
      threats.push('Excessive rate limit violations');
    }

    // Check for suspicious user agent patterns
    if (event.deviceInfo && this.isSuspiciousUserAgent(event.deviceInfo.userAgent)) {
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      anomalyScore += 15;
      threats.push('Suspicious user agent pattern');
    }

    // Check for time-based anomalies
    const isUnusualTime = this.isUnusualLoginTime(event.timestamp, event.geoLocation?.timezone);
    if (isUnusualTime) {
      anomalyScore += 10;
      threats.push('Unusual login time');
    }

    // Determine final risk level based on anomaly score
    if (anomalyScore >= 50) {
      riskLevel = 'critical';
    } else if (anomalyScore >= 30) {
      riskLevel = 'high';
    } else if (anomalyScore >= 15) {
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      anomalyScore,
      threats,
      mitigations
    };
  }

  /**
   * Parse User-Agent string to extract device information
   */
  private parseUserAgent(userAgent: string): DeviceInfo {
    const deviceInfo: DeviceInfo = { userAgent };

    // Basic User-Agent parsing (in production, use a proper library like ua-parser-js)
    try {
      // Browser detection
      if (userAgent.includes('Chrome')) {
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        deviceInfo.browser = {
          name: 'Chrome',
          version: match ? match[1] : 'unknown'
        };
      } else if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        deviceInfo.browser = {
          name: 'Firefox',
          version: match ? match[1] : 'unknown'
        };
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/([0-9.]+)/);
        deviceInfo.browser = {
          name: 'Safari',
          version: match ? match[1] : 'unknown'
        };
      }

      // OS detection
      if (userAgent.includes('Windows')) {
        deviceInfo.os = { name: 'Windows', version: 'unknown' };
      } else if (userAgent.includes('Mac OS X')) {
        const match = userAgent.match(/Mac OS X ([0-9_]+)/);
        deviceInfo.os = {
          name: 'macOS',
          version: match ? match[1].replace(/_/g, '.') : 'unknown'
        };
      } else if (userAgent.includes('Linux')) {
        deviceInfo.os = { name: 'Linux', version: 'unknown' };
      }

      // Device type detection
      if (userAgent.includes('Mobile')) {
        deviceInfo.device = { type: 'mobile' };
      } else if (userAgent.includes('Tablet')) {
        deviceInfo.device = { type: 'tablet' };
      } else {
        deviceInfo.device = { type: 'desktop' };
      }

      // Generate simple fingerprint
      deviceInfo.fingerprint = this.generateDeviceFingerprint(userAgent);

    } catch (error) {
      console.error('Error parsing User-Agent:', error);
    }

    return deviceInfo;
  }

  /**
   * Get geolocation information for IP address
   */
  private async getGeoLocation(ipAddress: string): Promise<GeoLocation | undefined> {
    // Check cache first
    if (this.ipGeoCache.has(ipAddress)) {
      return this.ipGeoCache.get(ipAddress);
    }

    // Skip private/local IPs
    if (this.isPrivateIP(ipAddress)) {
      return undefined;
    }

    try {
      // In production, use a real geolocation service like MaxMind, IPStack, etc.
      // For now, return mock data
      const mockGeoData: GeoLocation = {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'UTC',
        isp: 'Unknown ISP'
      };

      // Cache the result
      this.ipGeoCache.set(ipAddress, mockGeoData);
      
      return mockGeoData;
    } catch (error) {
      console.error('Geolocation lookup failed:', error);
      return undefined;
    }
  }

  /**
   * Check if IP address is private/local
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^127\./, // 127.0.0.0/8
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^::1$/, // IPv6 loopback
      /^fc00:/, // IPv6 unique local
      /^fe80:/ // IPv6 link local
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(userAgent: string): string {
    // Simple hash-based fingerprint (in production, use more sophisticated fingerprinting)
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check for unusual location based on user's history
   */
  private async checkUnusualLocation(tenantSlug: string, userId: string, location: GeoLocation): Promise<boolean> {
    try {
      // Get user's recent login locations (last 30 days)
      const recentLogs = await AuthLog.find({
        tenantSlug,
        userId,
        action: 'login_success',
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .limit(50)
      .sort({ timestamp: -1 });

      if (recentLogs.length === 0) {
        return false; // No history, assume it's normal
      }

      // Check if current location matches recent locations
      const knownCountries = new Set<string>(
        (recentLogs as any[])
          .map((log: any) => log?.metadata?.geoLocation?.country as string | undefined)
          .filter((country: string | undefined): country is string => Boolean(country))
      );

      return location.country ? !knownCountries.has(location.country) : false;
    } catch (error) {
      console.error('Error checking unusual location:', error);
      return false;
    }
  }

  /**
   * Get recent failed login attempts
   */
  private async getRecentFailedLogins(tenantSlug: string, userId: string, windowMinutes: number): Promise<number> {
    try {
      const since = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      const count = await AuthLog.countDocuments({
        tenantSlug,
        userId,
        action: 'login_failure',
        timestamp: { $gte: since }
      });

      return count;
    } catch (error) {
      console.error('Error getting recent failed logins:', error);
      return 0;
    }
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /scripts/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if login time is unusual
   */
  private isUnusualLoginTime(timestamp: Date, timezone?: string): boolean {
    const hour = timestamp.getHours();
    
    // Consider 2 AM - 6 AM as unusual login hours
    return hour >= 2 && hour <= 6;
  }

  /**
   * Generate correlation ID for tracking related events
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check security alerts
   */
  private async checkSecurityAlerts(event: EnhancedAuthLog, securityContext: SecurityContext): Promise<void> {
    for (const alert of this.alertRules) {
      if (!alert.enabled) continue;
      
      if (alert.tenantSpecific && alert.id !== event.tenantSlug) continue;
      
      const triggered = await this.evaluateAlertConditions(event, securityContext, alert.conditions);
      
      if (triggered) {
        await this.triggerAlert(alert, event, securityContext);
      }
    }
  }

  /**
   * Evaluate alert conditions
   */
  private async evaluateAlertConditions(
    event: EnhancedAuthLog,
    securityContext: SecurityContext,
    conditions: AlertCondition[]
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(event, securityContext, condition);
      if (!result) {
        return false; // All conditions must be met
      }
    }
    return true;
  }

  /**
   * Evaluate single alert condition
   */
  private async evaluateCondition(
    event: EnhancedAuthLog,
    securityContext: SecurityContext,
    condition: AlertCondition
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(event, securityContext, condition.field);
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'frequency':
        return await this.checkFrequencyCondition(event, condition);
      default:
        return false;
    }
  }

  /**
   * Get field value from event or security context
   */
  private getFieldValue(event: EnhancedAuthLog, securityContext: SecurityContext, field: string): any {
    const paths = field.split('.');
    let value: any = { ...event, securityContext };
    
    for (const path of paths) {
      if (value && typeof value === 'object') {
        value = value[path];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Check frequency-based condition
   */
  private async checkFrequencyCondition(event: EnhancedAuthLog, condition: AlertCondition): Promise<boolean> {
    if (!condition.timeWindow) return false;
    
    const since = new Date(Date.now() - condition.timeWindow * 60 * 1000);
    
    const count = await AuthLog.countDocuments({
      tenantSlug: event.tenantSlug,
      userId: event.userId,
      action: condition.value,
      timestamp: { $gte: since }
    });
    
    return count >= Number(condition.value);
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(alert: SecurityAlert, event: EnhancedAuthLog, securityContext: SecurityContext): Promise<void> {
    console.warn(`Security Alert Triggered: ${alert.name} for ${event.userId} from ${event.ipAddress}`);
    
    for (const action of alert.actions) {
      await this.executeAlertAction(action, alert, event, securityContext);
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(
    action: AlertAction,
    alert: SecurityAlert,
    event: EnhancedAuthLog,
    securityContext: SecurityContext
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'log':
          console.warn(`SECURITY ALERT: ${alert.name} - ${event.action} by ${event.userId}`);
          break;
        case 'block_ip':
          this.suspiciousIPs.add(event.ipAddress);
          console.warn(`IP ${event.ipAddress} has been flagged as suspicious`);
          break;
        case 'email':
          // TODO: Implement email notification
break;
        case 'webhook':
          // TODO: Implement webhook notification
break;
        case 'notify_admin':
          // TODO: Implement admin notification
break;
        default:
          console.warn(`Unknown alert action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Failed to execute alert action ${action.type}:`, error);
    }
  }

  /**
   * Update suspicious activity tracking
   */
  private async updateSuspiciousActivityTracking(event: EnhancedAuthLog): Promise<void> {
    // Track rate limit violations
    if (event.action === 'rate_limit_exceeded') {
      const key = `${event.ipAddress}-${event.tenantSlug}`;
      const current = this.rateLimitViolations.get(key) || 0;
      this.rateLimitViolations.set(key, current + 1);
    }

    // Track failed login attempts
    if (event.action === 'login_failure') {
      // Could implement additional tracking here
    }
  }

  /**
   * Initialize default security alerts
   */
  private initializeDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Alert when user has multiple failed login attempts in short time',
        severity: 'high',
        conditions: [
          { field: 'action', operator: 'eq', value: 'login_failure' },
          { field: 'action', operator: 'frequency', value: 5, timeWindow: 15 }
        ],
        actions: [
          { type: 'log', target: 'security' },
          { type: 'block_ip', target: 'auto' }
        ],
        enabled: true,
        tenantSpecific: false
      },
      {
        id: 'unusual_location',
        name: 'Login from Unusual Location',
        description: 'Alert when user logs in from new geographic location',
        severity: 'medium',
        conditions: [
          { field: 'securityContext.threats', operator: 'contains', value: 'Unusual geographic location' }
        ],
        actions: [
          { type: 'log', target: 'security' },
          { type: 'notify_admin', target: 'admin' }
        ],
        enabled: true,
        tenantSpecific: false
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent',
        description: 'Alert when suspicious user agent is detected',
        severity: 'medium',
        conditions: [
          { field: 'securityContext.threats', operator: 'contains', value: 'Suspicious user agent pattern' }
        ],
        actions: [
          { type: 'log', target: 'security' }
        ],
        enabled: true,
        tenantSpecific: false
      }
    ];
  }

  /**
   * Get log aggregation for analysis
   */
  async getLogAggregation(
    tenantSlug: string,
    startDate: Date,
    endDate: Date
  ): Promise<LogAggregation> {
    try {
      const logs = await AuthLog.find({
        tenantSlug,
        timestamp: { $gte: startDate, $lte: endDate }
      });

      const eventBreakdown: Record<string, number> = {};
      const uniqueUsers = new Set<string>();
      const uniqueIPs = new Set<string>();
      const riskLevelBreakdown: Record<SecurityRiskLevel, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };
      const countryCount: Record<string, number> = {};
      const userAgentCount: Record<string, number> = {};
      let suspiciousActivities = 0;

      logs.forEach((log: any) => {
        // Event breakdown
        const actionKey = String(log.action) as string;
        eventBreakdown[actionKey] = (eventBreakdown[actionKey] || 0) + 1;
        
        // Unique tracking
        uniqueUsers.add(String(log.userId));
        uniqueIPs.add(String(log.ipAddress));
        
        // Risk level breakdown
        const riskLevel = log.metadata?.securityContext?.riskLevel as SecurityRiskLevel;
        if (riskLevel && riskLevelBreakdown[riskLevel] !== undefined) {
          riskLevelBreakdown[riskLevel]++;
        }
        
        // Geographic breakdown
        const country = log.metadata?.geoLocation?.country;
        if (country) {
          countryCount[country] = (countryCount[country] || 0) + 1;
        }
        
        // User agent breakdown
        if (log.userAgent) {
          userAgentCount[log.userAgent] = (userAgentCount[log.userAgent] || 0) + 1;
        }
        
        // Suspicious activities
        const threats = log.metadata?.securityContext?.threats;
        if (threats && threats.length > 0) {
          suspiciousActivities++;
        }
      });

      const totalEvents = logs.length;
      
      return {
        tenantSlug,
        timeframe: { start: startDate, end: endDate },
        totalEvents,
        eventBreakdown: eventBreakdown as Record<AuthEventType, number>,
        uniqueUsers: uniqueUsers.size,
        uniqueIPs: uniqueIPs.size,
        riskLevelBreakdown,
        topCountries: Object.entries(countryCount)
          .map(([country, count]) => ({
            country,
            count,
            percentage: (count / totalEvents) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        topUserAgents: Object.entries(userAgentCount)
          .map(([userAgent, count]) => ({
            userAgent,
            count,
            percentage: (count / totalEvents) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        suspiciousActivities,
        alertsTriggered: 0 // TODO: Track alert triggers
      };
    } catch (error) {
      console.error('Error generating log aggregation:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const result = await AuthLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Quick logging function for authentication events
 */
export async function logAuthEvent(event: {
  tenantSlug: string;
  userId: string;
  email?: string;
  action: AuthEventType;
  ipAddress: string;
  userAgent?: string;
  metadata?: any;
  correlationId?: string;
  sessionId?: string;
}): Promise<void> {
  const loggingService = AuthLoggingService.getInstance();
  await loggingService.logAuthEvent(event);
}

/**
 * Log permission check result
 */
export async function logPermissionCheck(context: {
  tenantSlug: string;
  userId: string;
  email?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action: string;
  granted: boolean;
  reason: string;
}): Promise<void> {
  await logAuthEvent({
    tenantSlug: context.tenantSlug,
    userId: context.userId,
    email: context.email,
    action: context.granted ? 'access_granted' : 'access_denied',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      resource: context.resource,
      requiredAction: context.action,
      reason: context.reason
    }
  });
}

// Export singleton instance
export const authLoggingService = AuthLoggingService.getInstance();

const AuthLoggingExports = {
  AuthLoggingService,
  authLoggingService,
  logAuthEvent,
  logPermissionCheck
};

export default AuthLoggingExports;
