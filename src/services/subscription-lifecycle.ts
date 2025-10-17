/**
 * Subscription Lifecycle Management Service
 * 
 * Handles automated subscription lifecycle checks, status updates,
 * notifications, and grace period management for multi-tenant B2B SaaS.
 */

import { 
  SubscriptionModel, 
  TenantModel, 
  MembershipModel, 
  UserModel,
  SubscriptionHistoryModel,
  generateId 
} from '../schemas/tenant/mongodb-schemas';
import { Subscription, NotificationEvent } from '../schemas/tenant/models';

interface LifecycleCheckResult {
  tenantsChecked: number;
  statusChanges: number;
  notificationsSent: number;
  errors: string[];
}

interface NotificationConfig {
  daysBeforeExpiry: number[];
  enableEmail: boolean;
  enableWebhook: boolean;
  webhookUrl?: string;
}

class SubscriptionLifecycleService {
  private notificationConfig: NotificationConfig = {
    daysBeforeExpiry: [14, 7, 3, 1],
    enableEmail: true,
    enableWebhook: false
  };

  /**
   * Main lifecycle check - runs daily to update subscription statuses
   */
  async runLifecycleCheck(): Promise<LifecycleCheckResult> {
    const result: LifecycleCheckResult = {
      tenantsChecked: 0,
      statusChanges: 0,
      notificationsSent: 0,
      errors: []
    };

    try {
// Get all active subscriptions
      const subscriptions = await SubscriptionModel.find({
        lifecycleStatus: { $in: ['trialing', 'active', 'grace'] }
      }).lean();

      result.tenantsChecked = subscriptions.length;

      for (const subscription of subscriptions) {
        try {
          await this.checkSubscriptionStatus(subscription as any, result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error checking tenant ${subscription.tenantId}: ${errorMessage}`);
          console.error(`Lifecycle check error for tenant ${subscription.tenantId}:`, error);
        }
      }

      // Update last check timestamp
      await SubscriptionModel.updateMany(
        { lifecycleStatus: { $in: ['trialing', 'active', 'grace', 'expired'] } },
        { lastLifecycleCheckAt: new Date() }
      );
return result;

    } catch (error) {
      console.error('Lifecycle check failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Lifecycle check failed: ${errorMessage}`);
      return result;
    }
  }

  /**
   * Check and update individual subscription status
   */
  private async checkSubscriptionStatus(
    subscription: Subscription, 
    result: LifecycleCheckResult
  ): Promise<void> {
    const now = new Date();
    const termEnd = new Date(subscription.termEndAt);
    const daysUntilExpiry = Math.ceil((termEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStatus = subscription.lifecycleStatus;
    let statusChanged = false;

    // Determine new status based on dates and current status
    if (subscription.lifecycleStatus === 'suspended') {
      // Suspended tenants stay suspended until manually resumed
      return;
    }

    if (now <= termEnd) {
      // Still within term
      if (subscription.lifecycleStatus !== 'active' && subscription.lifecycleStatus !== 'trialing') {
        newStatus = 'active';
        statusChanged = true;
      }
    } else {
      // Past term end date
      const graceEndDate = new Date(termEnd);
      graceEndDate.setDate(graceEndDate.getDate() + subscription.gracePeriodDays);

      if (subscription.gracePeriodDays > 0 && now <= graceEndDate) {
        // In grace period
        if (subscription.lifecycleStatus !== 'grace') {
          newStatus = 'grace';
          statusChanged = true;
        }
      } else {
        // Expired
        if (subscription.lifecycleStatus !== 'expired') {
          newStatus = 'expired';
          statusChanged = true;
        }
      }
    }

    // Update status if changed
    if (statusChanged) {
      await this.updateSubscriptionStatus(subscription, newStatus);
      result.statusChanges++;
      
      // Send status change notification
      await this.sendStatusChangeNotification(subscription.tenantId, newStatus);
      result.notificationsSent++;
    }

    // Send expiry warnings
    if (this.shouldSendExpiryWarning(daysUntilExpiry, subscription)) {
      await this.sendExpiryWarning(subscription.tenantId, daysUntilExpiry);
      result.notificationsSent++;
    }
  }

  /**
   * Update subscription status and create audit entry
   */
  private async updateSubscriptionStatus(
    subscription: Subscription, 
    newStatus: string
  ): Promise<void> {
    const oldStatus = subscription.lifecycleStatus;
    
    await SubscriptionModel.findOneAndUpdate(
      { tenantId: subscription.tenantId },
      { 
        lifecycleStatus: newStatus,
        updatedAt: new Date()
      }
    );

    // Create audit entry
    await SubscriptionHistoryModel.create({
      id: generateId('sub_hist'),
      tenantId: subscription.tenantId,
      changeType: 'updated',
      changedBy: 'system_lifecycle_check',
      changeReason: `Automatic status change: ${oldStatus} → ${newStatus}`,
      beforeSnapshot: { lifecycleStatus: oldStatus },
      afterSnapshot: { lifecycleStatus: newStatus },
      diff: `Status changed from ${oldStatus} to ${newStatus}`,
      createdAt: new Date()
    });
}

  /**
   * Check if expiry warning should be sent
   */
  private shouldSendExpiryWarning(daysUntilExpiry: number, subscription: Subscription): boolean {
    // Only send warnings for active/trialing subscriptions
    if (!['active', 'trialing'].includes(subscription.lifecycleStatus)) {
      return false;
    }

    // Check if this is a warning day
    if (!this.notificationConfig.daysBeforeExpiry.includes(daysUntilExpiry)) {
      return false;
    }

    // TODO: Check if we already sent notification for this day
    // This would require tracking sent notifications in the database
    return true;
  }

  /**
   * Send expiry warning notification
   */
  private async sendExpiryWarning(tenantId: string, daysUntilExpiry: number): Promise<void> {
    const event: NotificationEvent = {
      type: 'subscription_expiring',
      tenantId,
      daysUntilExpiry,
      metadata: {
        urgency: daysUntilExpiry <= 3 ? 'high' : 'medium',
        timestamp: new Date().toISOString()
      }
    };

    await this.processNotificationEvent(event);
  }

  /**
   * Send status change notification
   */
  private async sendStatusChangeNotification(tenantId: string, newStatus: string): Promise<void> {
    let eventType: NotificationEvent['type'];
    
    switch (newStatus) {
      case 'grace':
        eventType = 'subscription_grace';
        break;
      case 'expired':
        eventType = 'subscription_expired';
        break;
      case 'suspended':
        eventType = 'subscription_suspended';
        break;
      case 'active':
        eventType = 'subscription_resumed';
        break;
      default:
        return; // No notification for other status changes
    }

    const event: NotificationEvent = {
      type: eventType,
      tenantId,
      metadata: {
        newStatus,
        timestamp: new Date().toISOString()
      }
    };

    await this.processNotificationEvent(event);
  }

  /**
   * Process notification event (email, webhook, etc.)
   */
  private async processNotificationEvent(event: NotificationEvent): Promise<void> {
    try {
      // Get tenant and admin users
      const tenant = await TenantModel.findOne({ id: event.tenantId }).lean();
      const adminMemberships = await MembershipModel.find({ 
        tenantId: event.tenantId, 
        role: 'tenant_admin' 
      }).lean();

      if (!tenant) {
        console.error(`Tenant not found for notification: ${event.tenantId}`);
        return;
      }

      // Get admin user emails
      const adminUserIds = (adminMemberships as any[]).map((m: any) => m.userId);
      const adminUsers = await UserModel.find({ 
        id: { $in: adminUserIds },
        status: 'active'
      }).lean();

      const adminEmails = (adminUsers as any[]).map((u: any) => u.email);

      // Send email notifications
      if (this.notificationConfig.enableEmail && adminEmails.length > 0) {
        await this.sendEmailNotification(event, tenant as any, adminEmails);
      }

      // Send webhook notifications
      if (this.notificationConfig.enableWebhook && this.notificationConfig.webhookUrl) {
        await this.sendWebhookNotification(event, tenant as any);
      }
} catch (error) {
      console.error(`Failed to process notification for tenant ${event.tenantId}:`, error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    event: NotificationEvent, 
    tenant: any, 
    adminEmails: string[]
  ): Promise<void> {
    // TODO: Implement email sending logic
    // This would integrate with your email service (SendGrid, SES, etc.)
    
    const emailData = {
      to: adminEmails,
      subject: this.getEmailSubject(event, tenant),
      template: this.getEmailTemplate(event),
      data: {
        tenantName: tenant.name,
        daysUntilExpiry: event.daysUntilExpiry,
        eventType: event.type,
        timestamp: event.metadata?.timestamp
      }
    };
    console.debug('[SubscriptionLifecycle] Prepared email notification payload', emailData);
    // await emailService.send(emailData);
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(event: NotificationEvent, tenant: any): Promise<void> {
    // TODO: Implement webhook sending logic
    
    const webhookData = {
      event: event.type,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      },
      data: event.metadata,
      timestamp: new Date().toISOString()
    };
    console.debug('[SubscriptionLifecycle] Prepared webhook notification payload', webhookData);
    // await fetch(this.notificationConfig.webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(webhookData)
    // });
  }

  /**
   * Get email subject based on event type
   */
  private getEmailSubject(event: NotificationEvent, tenant: any): string {
    switch (event.type) {
      case 'subscription_expiring':
        const days = event.daysUntilExpiry;
        return `${tenant.name} - Subscription expires in ${days} day${days !== 1 ? 's' : ''}`;
      case 'subscription_expired':
        return `${tenant.name} - Subscription has expired`;
      case 'subscription_grace':
        return `${tenant.name} - Subscription in grace period`;
      case 'subscription_suspended':
        return `${tenant.name} - Account suspended`;
      case 'subscription_resumed':
        return `${tenant.name} - Account resumed`;
      default:
        return `${tenant.name} - Account notification`;
    }
  }

  /**
   * Get email template based on event type
   */
  private getEmailTemplate(event: NotificationEvent): string {
    // TODO: Return appropriate email template name
    switch (event.type) {
      case 'subscription_expiring':
        return 'subscription-expiring';
      case 'subscription_expired':
        return 'subscription-expired';
      case 'subscription_grace':
        return 'subscription-grace';
      case 'subscription_suspended':
        return 'subscription-suspended';
      case 'subscription_resumed':
        return 'subscription-resumed';
      default:
        return 'subscription-notification';
    }
  }

  /**
   * Manually extend subscription term
   */
  async extendSubscription(
    tenantId: string, 
    days: number, 
    changedBy: string,
    reason?: string
  ): Promise<void> {
    const subscription = await SubscriptionModel.findOne({ tenantId });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const oldTermEnd = new Date(subscription.termEndAt);
    const newTermEnd = new Date(oldTermEnd);
    newTermEnd.setDate(newTermEnd.getDate() + days);

    const beforeSnapshot = subscription.toObject();
    
    await SubscriptionModel.findOneAndUpdate(
      { tenantId },
      { 
        termEndAt: newTermEnd,
        lifecycleStatus: 'active',
        updatedAt: new Date()
      }
    );

    const afterSnapshot = { ...beforeSnapshot, termEndAt: newTermEnd, lifecycleStatus: 'active' };

    // Create audit entry
    await SubscriptionHistoryModel.create({
      id: generateId('sub_hist'),
      tenantId,
      changeType: 'extended',
      changedBy,
      changeReason: reason || `Extended by ${days} days`,
      beforeSnapshot,
      afterSnapshot,
      diff: `Term extended from ${oldTermEnd.toISOString()} to ${newTermEnd.toISOString()}`,
      createdAt: new Date()
    });
}

  /**
   * Manually suspend subscription
   */
  async suspendSubscription(tenantId: string, changedBy: string, reason?: string): Promise<void> {
    const subscription = await SubscriptionModel.findOne({ tenantId });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const beforeSnapshot = subscription.toObject();
    
    await SubscriptionModel.findOneAndUpdate(
      { tenantId },
      { 
        lifecycleStatus: 'suspended',
        suspendedAt: new Date(),
        updatedAt: new Date()
      }
    );

    const afterSnapshot = { ...beforeSnapshot, lifecycleStatus: 'suspended', suspendedAt: new Date() };

    // Create audit entry
    await SubscriptionHistoryModel.create({
      id: generateId('sub_hist'),
      tenantId,
      changeType: 'suspended',
      changedBy,
      changeReason: reason || 'Manually suspended',
      beforeSnapshot,
      afterSnapshot,
      diff: 'Subscription suspended',
      createdAt: new Date()
    });

    // Send notification
    await this.sendStatusChangeNotification(tenantId, 'suspended');
}

  /**
   * Resume suspended subscription
   */
  async resumeSubscription(tenantId: string, changedBy: string, reason?: string): Promise<void> {
    const subscription = await SubscriptionModel.findOne({ tenantId });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const beforeSnapshot = subscription.toObject();
    
    await SubscriptionModel.findOneAndUpdate(
      { tenantId },
      { 
        lifecycleStatus: 'active',
        suspendedAt: null,
        updatedAt: new Date()
      }
    );

    const afterSnapshot = { ...beforeSnapshot, lifecycleStatus: 'active', suspendedAt: null };

    // Create audit entry
    await SubscriptionHistoryModel.create({
      id: generateId('sub_hist'),
      tenantId,
      changeType: 'resumed',
      changedBy,
      changeReason: reason || 'Manually resumed',
      beforeSnapshot,
      afterSnapshot,
      diff: 'Subscription resumed',
      createdAt: new Date()
    });

    // Send notification
    await this.sendStatusChangeNotification(tenantId, 'active');
}

  /**
   * Get subscription statistics for dashboard
   */
  async getSubscriptionStats(): Promise<any> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      graceSubscriptions,
      expiredSubscriptions,
      suspendedSubscriptions,
      expiringSubscriptions
    ] = await Promise.all([
      SubscriptionModel.countDocuments(),
      SubscriptionModel.countDocuments({ lifecycleStatus: 'active' }),
      SubscriptionModel.countDocuments({ lifecycleStatus: 'trialing' }),
      SubscriptionModel.countDocuments({ lifecycleStatus: 'grace' }),
      SubscriptionModel.countDocuments({ lifecycleStatus: 'expired' }),
      SubscriptionModel.countDocuments({ lifecycleStatus: 'suspended' }),
      SubscriptionModel.countDocuments({
        lifecycleStatus: { $in: ['active', 'trialing'] },
        termEndAt: { $gte: now, $lte: thirtyDaysFromNow }
      })
    ]);

    return {
      total: totalSubscriptions,
      active: activeSubscriptions,
      trialing: trialingSubscriptions,
      grace: graceSubscriptions,
      expired: expiredSubscriptions,
      suspended: suspendedSubscriptions,
      expiringIn30Days: expiringSubscriptions
    };
  }
}

// Export singleton instance
export const subscriptionLifecycleService = new SubscriptionLifecycleService();
export default subscriptionLifecycleService;
