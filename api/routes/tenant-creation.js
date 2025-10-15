/**
 * Tenant Creation API
 * 
 * Handles atomic creation of tenants with admin users, subscriptions, and entitlements.
 * Super Admin only - creates complete tenant setup in a single transaction.
 */

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { AuditTrail } = require('../core/AuditTrail');

async function logAudit(event) {
  const eventType = event.action && event.action.toUpperCase().startsWith('CREATE')
    ? 'CREATE'
    : 'SYSTEM_CHANGE';

  await AuditTrail.log({
    eventType,
    userId: event.performedBy,
    userName: event.performedByName,
    tenantId: event.metadata?.tenantId,
    resourceType: event.entityType,
    resourceId: event.entityId,
    action: event.action,
    changes: event.changes,
    metadata: event.metadata,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    success: true
  });
}

// Helper to generate unique IDs
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create model helper
function getOrCreateModel(name, schema) {
  try {
    return mongoose.model(name);
  } catch (error) {
    return mongoose.model(name, schema);
  }
}

// Models
const TenantModel = getOrCreateModel('Tenant', new mongoose.Schema({
  id: String,
  orgId: String,
  name: String,
  slug: String,
  status: { type: String, default: 'active' },
  plan: { type: String, default: 'IntelliFlex' },
  tenantType: { type: String, default: 'facility-based' },
  maxUsers: Number,
  maxFacilities: Number,
  trial: {
    enabled: { type: Boolean, default: false },
    trialDays: { type: Number, default: 30 },
    startMode: { type: String, default: 'auto' },
    gracePeriodDays: { type: Number, default: 7 }
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: String,
  lastModifiedBy: String
}));

const UserModel = getOrCreateModel('User', new mongoose.Schema({
  id: String,
  email: String,
  name: String,
  password: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const MembershipModel = getOrCreateModel('Membership', new mongoose.Schema({
  id: String,
  userId: String,
  tenantId: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String
}));

const SubscriptionModel = getOrCreateModel('Subscription', new mongoose.Schema({
  id: String,
  tenantId: String,
  termStartAt: Date,
  termEndAt: Date,
  autoRenew: { type: Boolean, default: false },
  gracePeriodDays: Number,
  lifecycleStatus: { type: String, default: 'active' },
  suspendedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const TenantEntitlementsModel = getOrCreateModel('TenantEntitlements', new mongoose.Schema({
  id: String,
  tenantId: String,
  version: { type: Number, default: 1 },
  modules: [String],
  sitesAllowed: Number,
  unlimitedUsers: Boolean,
  effectiveAt: Date,
  changedBy: String,
  createdAt: { type: Date, default: Date.now }
}));

/**
 * Register tenant creation routes
 */
async function registerTenantCreationRoutes(fastify, options) {
  
  // Use platform admin middleware from framework
  const { verifyPlatformAdmin } = require('../middleware/platform-admin');
  const requireSuperAdmin = verifyPlatformAdmin;

  /**
   * POST /api/tenants/create-with-admin
   * Create a complete tenant setup atomically
   * 
   * Request body:
   * {
   *   tenant: { name, slug, orgId, status, plan, tenantType, maxUsers, maxFacilities, trial, notes },
   *   admin: { createNew, email, name, password, existingUserId },
   *   subscription: { termStartAt, termEndAt, autoRenew, gracePeriodDays },
   *   entitlements: { modules }
   * }
   */
  fastify.post('/tenants/create-with-admin', { preHandler: requireSuperAdmin }, async (request, reply) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { tenant, admin, subscription, entitlements } = request.body;
      const performedBy = request.user?.id || request.user?.email || 'super_admin';
      const performedByName = request.user?.name || 'Super Administrator';
      
      // Create audit context
      const auditContext = {
        userId: performedBy,
        tenantId: null, // Will be set after tenant creation
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };

      // Validate required fields
      if (!tenant?.name || !tenant?.slug) {
        throw new Error('Tenant name and slug are required');
      }

      // Check if slug already exists
      const existingTenant = await TenantModel.findOne({ slug: tenant.slug });
      if (existingTenant) {
        throw new Error(`Tenant with slug "${tenant.slug}" already exists`);
      }

      // Generate tenant ID
      const tenantId = generateId('t');

      // 1. CREATE TENANT
      const newTenant = await TenantModel.create([{
        id: tenantId,
        orgId: tenant.orgId || null,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status || 'active',
        plan: tenant.plan || 'IntelliFlex',
        tenantType: tenant.tenantType || 'facility-based',
        maxUsers: tenant.maxUsers || null,
        maxFacilities: tenant.maxFacilities || null,
        trial: tenant.trial || {
          enabled: false,
          trialDays: 30,
          startMode: 'auto',
          gracePeriodDays: 7
        },
        notes: tenant.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: performedBy
      }], { session });

      // Log tenant creation
      auditContext.tenantId = tenantId;
      await AuditTrail.logCreate(
        auditContext,
        'tenant',
        tenantId,
        newTenant[0],
        {
          plan: tenant.plan,
          tenantType: tenant.tenantType,
          trialEnabled: tenant.trial?.enabled
        }
      );

      let adminUserId = null;

      // 2. CREATE OR ASSIGN ADMIN USER
      if (admin?.createNew === 'create' && admin?.email && admin?.name && admin?.password) {
        // Validate password
        if (admin.password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        if (admin.password !== admin.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        // Check if email already exists
        const existingUser = await UserModel.findOne({ email: admin.email });
        if (existingUser) {
          throw new Error(`User with email "${admin.email}" already exists`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(admin.password, 12);

        // Create user
        adminUserId = generateId('u');
        await UserModel.create([{
          id: adminUserId,
          email: admin.email,
          name: admin.name,
          password: hashedPassword,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }], { session });

        // Log user creation
        await AuditTrail.logCreate(
          auditContext,
          'user',
          adminUserId,
          {
            id: adminUserId,
            email: admin.email,
            name: admin.name,
            status: 'active'
          },
          {
            role: 'tenant_admin',
            tenantId,
            tenantName: tenant.name
          }
        );

      } else if (admin?.createNew === 'assign' && admin?.existingUserId) {
        // Use existing user
        adminUserId = admin.existingUserId;

        // Verify user exists
        const existingUser = await UserModel.findOne({ id: adminUserId });
        if (!existingUser) {
          throw new Error(`User with ID "${adminUserId}" not found`);
        }
      }

      // 3. CREATE MEMBERSHIP (if admin user was created/assigned)
      if (adminUserId) {
        const membershipId = generateId('membership');
        await MembershipModel.create([{
          id: membershipId,
          userId: adminUserId,
          tenantId: tenantId,
          role: 'tenant_admin',
          createdAt: new Date(),
          createdBy: performedBy
        }], { session });

        // Log membership creation
        await AuditTrail.logCreate(
          auditContext,
          'membership',
          membershipId,
          {
            userId: adminUserId,
            tenantId,
            role: 'tenant_admin'
          },
          {
            tenantName: tenant.name
          }
        );
      }

      // 4. CREATE SUBSCRIPTION
      if (subscription && subscription.termStartAt && subscription.termEndAt) {
        const subscriptionId = generateId('subscription');
        
        // Determine lifecycle status based on trial and dates
        let lifecycleStatus = 'active';
        if (tenant.trial?.enabled) {
          lifecycleStatus = 'trialing';
        }

        await SubscriptionModel.create([{
          id: subscriptionId,
          tenantId: tenantId,
          termStartAt: new Date(subscription.termStartAt),
          termEndAt: new Date(subscription.termEndAt),
          autoRenew: subscription.autoRenew || false,
          gracePeriodDays: subscription.gracePeriodDays || 7,
          lifecycleStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        }], { session });

        // Log subscription creation
        await AuditTrail.logCreate(
          auditContext,
          'subscription',
          subscriptionId,
          {
            termStartAt: subscription.termStartAt,
            termEndAt: subscription.termEndAt,
            autoRenew: subscription.autoRenew,
            lifecycleStatus
          },
          {
            tenantId,
            tenantName: tenant.name
          }
        );
      }

      // 5. CREATE ENTITLEMENTS
      if (entitlements && entitlements.modules && entitlements.modules.length > 0) {
        const entitlementsId = generateId('entitlements');
        
        await TenantEntitlementsModel.create([{
          id: entitlementsId,
          tenantId: tenantId,
          version: 1,
          modules: entitlements.modules,
          sitesAllowed: tenant.maxFacilities || 1,
          unlimitedUsers: tenant.tenantType === 'enterprise' || tenant.tenantType === 'facility-based',
          effectiveAt: new Date(),
          changedBy: performedBy,
          createdAt: new Date()
        }], { session });

        // Log entitlements creation
        await logAudit({
          action: 'create_entitlements',
          entityType: 'entitlements',
          entityId: entitlementsId,
          entityName: `Entitlements for ${tenant.name}`,
          performedBy,
          performedByName,
          changes: {
            before: null,
            after: {
              modules: entitlements.modules,
              sitesAllowed: tenant.maxFacilities || 1
            }
          },
          metadata: {
            tenantId,
            tenantName: tenant.name
          },
          ipAddress: request.ip || request.connection?.remoteAddress,
          userAgent: request.headers['user-agent']
        });
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return reply.code(201).send({
        success: true,
        message: 'Tenant created successfully with admin user',
        data: {
          tenantId,
          adminUserId,
          tenant: newTenant[0]
        }
      });

    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();
      session.endSession();

      fastify.log.error('Error creating tenant:', error);
      
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to create tenant'
      });
    }
  });
}

module.exports = registerTenantCreationRoutes;
