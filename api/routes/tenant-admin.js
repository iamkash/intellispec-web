/**
 * Multi-Tenant B2B SaaS Admin API Routes
 * 
 * Comprehensive REST API for tenant management, subscriptions, entitlements,
 * organizations, and user memberships with full audit trails.
 */

const { logger } = require('../core/Logger');
// Import mongoose for basic operations
const mongoose = require('mongoose');
const { AuditTrail } = require('../core/AuditTrail');

// For now, we'll create basic models here until the full schema integration is complete
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Function to get or create models (prevents duplicate model errors)
function getOrCreateModel(name, schema) {
  try {
    return mongoose.model(name);
  } catch (error) {
    return mongoose.model(name, schema);
  }
}

// Basic organization model for testing
const OrganizationModel = getOrCreateModel('Organization', new mongoose.Schema({
  id: String,
  name: String,
  status: { type: String, default: 'active' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// Basic tenant model for testing  
const TenantModel = getOrCreateModel('Tenant', new mongoose.Schema({
  id: String,
  orgId: String,
  name: String,
  slug: String,
  status: { type: String, default: 'active' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// Basic membership model for testing
const MembershipModel = getOrCreateModel('Membership', new mongoose.Schema({
  id: String,
  userId: String,
  tenantId: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String
}));

// Basic user model for testing
const UserModel = getOrCreateModel('User', new mongoose.Schema({
  id: String,
  email: String,
  name: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// Basic module model for testing
const ModuleModel = getOrCreateModel('Module', new mongoose.Schema({
  key: String,
  name: String,
  status: { type: String, default: 'active' },
  category: String,
  defaultIncludedInFlex: Boolean,
  icon: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// Basic subscription model for testing
const SubscriptionModel = getOrCreateModel('Subscription', new mongoose.Schema({
  id: String,
  tenantId: String,
  termStartAt: Date,
  termEndAt: Date,
  autoRenew: { type: Boolean, default: false },
  lifecycleStatus: { type: String, default: 'active' },
  suspendedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// Basic tenant entitlements model for testing
const TenantEntitlementsModel = getOrCreateModel('TenantEntitlements', new mongoose.Schema({
  id: String,
  tenantId: String,
  version: { type: Number, default: 1 },
  modules: [String],
  siteCount: { type: Number, default: 1 },
  moduleCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

async function registerTenantAdminRoutes(fastify) {
  const { verifyPlatformAdmin } = require('../middleware/platform-admin');
  const AuditTrail = require('../core/AuditTrail');
  const RequestContextManager = require('../core/RequestContext');
  
  // Use framework's platform admin middleware
  const requireSuperAdmin = verifyPlatformAdmin;

  // Helper function to create audit entries
  const createAuditEntry = async (type, entityId, changedBy, before, after, reason) => {
    const context = RequestContextManager.getCurrentContext();
    
    await AuditTrail.logUpdate(context, {
      entityType: type,
      entityId: entityId,
      changes: { before, after },
      reason
    });
  };

  const generateDiffSummary = (before, after) => {
    if (!before) return 'Created new record';
    
    const changes = [];
    Object.keys(after).forEach(key => {
      if (before[key] !== after[key]) {
        changes.push(`${key}: ${before[key]} → ${after[key]}`);
      }
    });
    
    return changes.length > 0 ? changes.join(', ') : 'No changes detected';
  };

  // ==================== TENANT ROUTES ====================

  // GET /tenants - List all tenants with filters
  fastify.get('/tenants', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { 
        page = 1, 
        limit = 15, 
        search, 
        status, 
        organization,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        format
      } = request.query;

      // Handle options format for dropdowns
      if (format === 'options') {
        const tenants = await TenantModel.find({ status: 'active' })
          .select('id name slug')
          .lean();
        
        return reply.send(
          tenants.map(tenant => ({
            value: tenant.id,
            label: `${tenant.name} (${tenant.slug})`,
            key: tenant.id
          }))
        );
      }

      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) filter.status = status;
      if (organization) filter.orgId = organization;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const tenants = await TenantModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Populate related data (simplified)
      const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
        const [organization, userCount] = await Promise.all([
          tenant.orgId ? OrganizationModel.findOne({ id: tenant.orgId }).lean() : null,
          MembershipModel.countDocuments({ tenantId: tenant.id })
        ]);

        return {
          ...tenant,
          organization,
          userCount,
          // Mock data for now
          subscription: {
            lifecycleStatus: 'active',
            daysRemaining: 30
          },
          entitlements: {
            sitesAllowed: 1,
            moduleCount: 3
          }
        };
      }));

      const total = await TenantModel.countDocuments(filter);

      return reply.send({
        data: enrichedTenants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tenants' });
    }
  });

  // GET /api/admin/tenants/stats - Platform overview statistics
  fastify.get('/tenants/stats', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const [
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        totalOrganizations
      ] = await Promise.all([
        TenantModel.countDocuments(),
        TenantModel.countDocuments({ status: 'active' }),
        TenantModel.countDocuments({ status: 'suspended' }),
        UserModel.countDocuments({ status: { $ne: 'disabled' } }),
        OrganizationModel.countDocuments({ status: 'active' })
      ]);

      return reply.send({
        stats: {
          totalTenants: { value: totalTenants, trend: '+5%' },
          activeTenants: { value: activeTenants, trend: '+3%' },
          expiringTenants: { value: 2, trend: '-2%' }, // Mock for now
          suspendedTenants: { value: suspendedTenants, trend: '0%' },
          totalUsers: { value: totalUsers, trend: '+12%' },
          totalOrganizations: { value: totalOrganizations, trend: '+1%' }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  // POST /api/admin/tenants - Create new tenant
  fastify.post('/tenants', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const {
        name,
        slug,
        orgId,
        status = 'active',
        notes,
        sitesAllowed = 1,
        modules = ['system'],
        firstUserEmail,
        firstUserName,
        firstUserRole = 'tenant_admin',
        sendInvite = true,
        termStartAt,
        termEndAt,
        autoRenew = false,
        gracePeriodDays = 7
      } = request.body;

      // Validate required fields
      if (!name || !slug || !firstUserEmail) {
        return reply.code(400).send({ 
          error: 'Name, slug, and first user email are required' 
        });
      }

      // Check if slug is unique
      const existingTenant = await TenantModel.findOne({ slug });
      if (existingTenant) {
        return reply.code(400).send({ error: 'Slug already exists' });
      }

      // Ensure System Admin module is included
      const finalModules = modules.includes('system') ? modules : ['system', ...modules];

      // Create tenant
      const tenantId = generateId('tenant');
      const tenant = await TenantModel.create({
        id: tenantId,
        orgId,
        name,
        slug,
        status,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create entitlements
      const entitlements = await TenantEntitlementsModel.create({
        id: generateId('entitlements'),
        tenantId,
        modules: finalModules,
        sitesAllowed,
        unlimitedUsers: true,
        effectiveAt: new Date(),
        version: 1,
        changedBy: 'super_admin', // TODO: Get from JWT
        createdAt: new Date()
      });

      // Create subscription if term dates provided
      let subscription = null;
      if (termStartAt && termEndAt) {
        subscription = await SubscriptionModel.create({
          id: generateId('subscription'),
          tenantId,
          termStartAt: new Date(termStartAt),
          termEndAt: new Date(termEndAt),
          autoRenew,
          gracePeriodDays,
          lifecycleStatus: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Create or find user
      let user = await UserModel.findOne({ email: firstUserEmail.toLowerCase() });
      if (!user) {
        user = await UserModel.create({
          id: generateId('user'),
          email: firstUserEmail.toLowerCase(),
          name: firstUserName,
          status: 'invited',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Create membership
      const membership = await MembershipModel.create({
        id: generateId('membership'),
        userId: user.id,
        tenantId,
        role: firstUserRole,
        createdAt: new Date(),
        createdBy: 'super_admin' // TODO: Get from JWT
      });

      // Create audit entries
      await createAuditEntry('entitlements_created', tenantId, 'super_admin', null, entitlements);
      if (subscription) {
        await createAuditEntry('subscription_created', tenantId, 'super_admin', null, subscription);
      }

      // TODO: Send invitation email if sendInvite is true

      return reply.code(201).send({
        message: 'Tenant created successfully',
        tenant: {
          ...tenant.toObject(),
          entitlements,
          subscription,
          firstUser: user,
          membership
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create tenant' });
    }
  });

  // GET /api/admin/tenants/:id - Get tenant details
  fastify.get('/tenants/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;

      const tenant = await TenantModel.findOne({ id }).lean();
      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      const [organization, subscription, entitlements, memberships] = await Promise.all([
        tenant.orgId ? OrganizationModel.findOne({ id: tenant.orgId }).lean() : null,
        SubscriptionModel.findOne({ tenantId: id }).lean(),
        TenantEntitlementsModel.findOne({ tenantId: id }).sort({ version: -1 }).lean(),
        MembershipModel.find({ tenantId: id }).lean()
      ]);

      // Fetch users for memberships (userId is stored as string, not reference)
      let tenantAdmin = null;
      let adminData = null;
      let adminDisplayName = null;
      let adminDisplayEmail = null;

      if (memberships && memberships.length > 0) {
        const userIds = memberships.map(m => m.userId);
        logger.debug('[Tenant API] Fetching users for IDs:', userIds);
        const users = await UserModel.find({ id: { $in: userIds } }).lean();
        logger.debug('[Tenant API] Found users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
        
        // Find the Tenant Admin membership (case-insensitive, handle different formats)
        const adminMembership = memberships.find(m => {
          const roleNormalized = (m.role || '').toLowerCase().replace(/[\s_-]/g, '');
          return roleNormalized === 'tenantadmin';
        });
        logger.debug('[Tenant API] Admin membership found:', adminMembership);
        
        if (adminMembership) {
          const adminUser = users.find(u => u.id === adminMembership.userId);
          if (adminUser) {
            tenantAdmin = adminUser;
            adminData = {
              createNew: 'existing',
              existingUserId: adminUser.id,
              email: adminUser.email,
              name: adminUser.name
            };
            adminDisplayName = adminUser.name;
            adminDisplayEmail = adminUser.email;
          }
        }
        
        // Attach user data to memberships for convenience
        memberships.forEach(m => {
          const user = users.find(u => u.id === m.userId);
          if (user) {
            m.user = user;
          }
        });
      }

      // Format memberships as grid data for EditableGridWidget
      const userMemberships = memberships && memberships.length > 0
        ? memberships.map((m, index) => {
            const user = m.user || { name: 'Unknown', email: m.userId, id: m.userId };
            
            // Format date for display
            const createdDate = m.createdAt ? new Date(m.createdAt) : new Date();
            const formattedDate = createdDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            
            return {
              id: m.id || m._id || `membership-${index}`,
              userId: user.id,
              userName: user.name || 'Unknown User',
              userEmail: user.email || m.userId,
              role: m.role || 'user',
              createdAt: formattedDate,
              createdAtRaw: m.createdAt || new Date().toISOString(),
              // Store membership ID for updates/deletes
              membershipId: m.id || m._id
            };
          })
        : [];

      logger.debug('[Tenant API] Returning data:', {
        adminDisplayName,
        adminDisplayEmail,
        userMembershipsCount: userMemberships.length,
        activeModules: entitlements?.modules || []
      });

      return reply.send({
        ...tenant,
        organization,
        subscription,
        entitlements,
        memberships,
        admin: adminData,
        adminDisplayName,
        adminDisplayEmail,
        userMemberships,
        // Flatten commonly used fields for easier form binding
        activeModules: entitlements?.modules || [],
        maxUsers: tenant.maxUsers || null,
        maxFacilities: tenant.maxFacilities || null
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch tenant' });
    }
  });

  // PATCH /api/admin/tenants/:id - Update tenant
  fastify.patch('/tenants/:id', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      const tenant = await TenantModel.findOneAndUpdate(
        { id },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      return reply.send({ message: 'Tenant updated successfully', tenant });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update tenant' });
    }
  });


  // ==================== ORGANIZATION ROUTES ====================

  // GET /organizations
  fastify.get('/organizations', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { format } = request.query;
      
      const organizations = await OrganizationModel.find({ status: 'active' }).lean();
      
      if (format === 'options') {
        return reply.send(
          organizations.map(org => ({
            value: org.id,
            label: org.name,
            key: org.id
          }))
        );
      }

      // Add tenant count to each organization
      const enrichedOrgs = await Promise.all(organizations.map(async (org) => {
        const tenantCount = await TenantModel.countDocuments({ orgId: org.id });
        return { ...org, tenantCount };
      }));

      return reply.send({ data: enrichedOrgs });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch organizations' });
    }
  });

  // POST /api/admin/organizations
  fastify.post('/organizations', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { name, notes } = request.body;

      if (!name) {
        return reply.code(400).send({ error: 'Organization name is required' });
      }

      const organization = await OrganizationModel.create({
        id: generateId('org'),
        name,
        notes,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return reply.code(201).send({ 
        message: 'Organization created successfully', 
        organization 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create organization' });
    }
  });

  // ==================== MEMBERSHIP ROUTES ====================

  // GET /api/admin/memberships
  fastify.get('/memberships', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { page = 1, limit = 15, tenant, role, status } = request.query;

      const filter = {};
      if (tenant) filter.tenantId = tenant;
      if (role) filter.role = role;

      const skip = (page - 1) * limit;

      const memberships = await MembershipModel.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Populate user and tenant data
      const enrichedMemberships = await Promise.all(memberships.map(async (membership) => {
        const [user, tenant] = await Promise.all([
          UserModel.findOne({ id: membership.userId }).lean(),
          TenantModel.findOne({ id: membership.tenantId }).lean()
        ]);

        return {
          ...membership,
          user,
          tenant
        };
      }));

      const total = await MembershipModel.countDocuments(filter);

      return reply.send({
        data: enrichedMemberships,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch memberships' });
    }
  });

  // ==================== MODULE ROUTES ====================

  // GET /api/admin/modules - Get available modules
  fastify.get('/modules', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { status = 'active', format } = request.query;
      
      const modules = await ModuleModel.find({ status }).lean();
      
      if (format === 'options') {
        // Return array directly for checkbox_group compatibility
        return reply.send(
          modules.map(module => ({
            value: module.key,
            label: module.name,
            icon: module.icon,
            category: module.category
          }))
        );
      }

      return reply.send({ data: modules });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch modules' });
    }
  });

  // GET /users - Get users for dropdown options
  fastify.get('/users', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { status = 'active', format, tenantId, excludeAssigned } = request.query;
      
      let users = await UserModel.find({ status }).lean();
      
      // Filter out users already assigned to this tenant
      if (tenantId && excludeAssigned === 'true') {
        const existingMemberships = await MembershipModel.find({ tenantId }).lean();
        const assignedUserIds = existingMemberships.map(m => m.userId);
        users = users.filter(u => !assignedUserIds.includes(u.id));
      }
      
      if (format === 'options') {
        return reply.send(
          users.map(user => ({
            value: user.id,
            label: `${user.name} (${user.email})`,
            email: user.email,
            name: user.name
          }))
        );
      }

      return reply.send({ data: users });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // ==================== ENTITLEMENTS ROUTES ====================

  // GET /api/admin/tenants/:id/entitlements
  fastify.get('/tenants/:id/entitlements', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;

      const entitlements = await TenantEntitlementsModel.findOne({ tenantId: id })
        .sort({ version: -1 })
        .lean();

      if (!entitlements) {
        return reply.code(404).send({ error: 'Entitlements not found' });
      }

      // Get module details
      const modules = await ModuleModel.find({ 
        key: { $in: entitlements.modules } 
      }).lean();

      return reply.send({
        ...entitlements,
        moduleDetails: modules
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch entitlements' });
    }
  });

  // POST /api/admin/tenants/:id/entitlements
  fastify.post('/tenants/:id/entitlements', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { modules, sitesAllowed, changeReason } = request.body;

      // Get current entitlements
      const current = await TenantEntitlementsModel.findOne({ tenantId: id })
        .sort({ version: -1 })
        .lean();

      // Ensure System Admin is always included
      const finalModules = modules.includes('system') ? modules : ['system', ...modules];

      // Create new version
      const newEntitlements = await TenantEntitlementsModel.create({
        id: generateId('entitlements'),
        tenantId: id,
        modules: finalModules,
        sitesAllowed,
        unlimitedUsers: true,
        effectiveAt: new Date(),
        version: (current?.version || 0) + 1,
        changedBy: 'super_admin', // TODO: Get from JWT
        createdAt: new Date()
      });

      // Create audit entry
      await createAuditEntry(
        'entitlements_updated', 
        id, 
        'super_admin', 
        current, 
        newEntitlements, 
        changeReason
      );

      return reply.send({ 
        message: 'Entitlements updated successfully', 
        entitlements: newEntitlements 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update entitlements' });
    }
  });

  // ==================== SUBSCRIPTION ROUTES ====================

  // GET /api/admin/tenants/:id/subscription
  fastify.get('/tenants/:id/subscription', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;

      const subscription = await SubscriptionModel.findOne({ tenantId: id }).lean();

      if (!subscription) {
        return reply.code(404).send({ error: 'Subscription not found' });
      }

      // Calculate additional fields
      const now = new Date();
      const termEnd = new Date(subscription.termEndAt);
      const daysRemaining = Math.ceil((termEnd - now) / (1000 * 60 * 60 * 24));
      const isInGrace = subscription.lifecycleStatus === 'grace';

      return reply.send({
        ...subscription,
        daysRemaining,
        isInGrace,
        canAccess: ['active', 'trialing', 'grace'].includes(subscription.lifecycleStatus)
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch subscription' });
    }
  });

  // POST /api/admin/tenants/:id/subscription/extend
  fastify.post('/tenants/:id/subscription/extend', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { days, changeReason } = request.body;

      const current = await SubscriptionModel.findOne({ tenantId: id });
      if (!current) {
        return reply.code(404).send({ error: 'Subscription not found' });
      }

      const newTermEnd = new Date(current.termEndAt);
      newTermEnd.setDate(newTermEnd.getDate() + days);

      const updated = await SubscriptionModel.findOneAndUpdate(
        { tenantId: id },
        { 
          termEndAt: newTermEnd,
          lifecycleStatus: 'active',
          updatedAt: new Date()
        },
        { new: true }
      );

      // Create audit entry
      await createAuditEntry(
        'subscription_extended',
        id,
        'super_admin',
        current.toObject(),
        updated.toObject(),
        changeReason || `Extended by ${days} days`
      );

      return reply.send({ 
        message: 'Subscription extended successfully', 
        subscription: updated 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to extend subscription' });
    }
  });

  // ==================== TENANT ACTIVATION/DEACTIVATION ROUTES ====================

  // POST /api/admin/tenants/:id/activate
  fastify.post('/tenants/:id/activate', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { reason } = request.body;

      const current = await TenantModel.findOne({ id });
      if (!current) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      if (current.status === 'active') {
        return reply.code(400).send({ error: 'Tenant is already active' });
      }

      const updated = await TenantModel.findOneAndUpdate(
        { id },
        { 
          status: 'active',
          updatedAt: new Date(),
          lastModifiedBy: 'super_admin'
        },
        { new: true }
      );

      // Also reactivate subscription if suspended
      await SubscriptionModel.findOneAndUpdate(
        { tenantId: id },
        { 
          lifecycleStatus: 'active',
          suspendedAt: null,
          updatedAt: new Date()
        }
      );

      // Create audit entry
      const context = {
        userId: request.user?.id || 'super_admin',
        tenantId: id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logUpdate(
        context,
        'tenant',
        id,
        { status: current.status },
        { status: 'active' },
        { reason: reason || 'Tenant activated by Super Admin' }
      );

      return reply.send({ 
        message: 'Tenant activated successfully', 
        tenant: updated 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to activate tenant' });
    }
  });

  // POST /api/admin/tenants/:id/suspend
  fastify.post('/tenants/:id/suspend', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { reason } = request.body;

      const current = await TenantModel.findOne({ id });
      if (!current) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      if (current.status === 'suspended') {
        return reply.code(400).send({ error: 'Tenant is already suspended' });
      }

      const updated = await TenantModel.findOneAndUpdate(
        { id },
        { 
          status: 'suspended',
          updatedAt: new Date(),
          lastModifiedBy: 'super_admin'
        },
        { new: true }
      );

      // Also suspend subscription
      await SubscriptionModel.findOneAndUpdate(
        { tenantId: id },
        { 
          lifecycleStatus: 'suspended',
          suspendedAt: new Date(),
          updatedAt: new Date()
        }
      );

      // Create audit entry
      const context = {
        userId: request.user?.id || 'super_admin',
        tenantId: id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logUpdate(
        context,
        'tenant',
        id,
        { status: current.status },
        { status: 'suspended' },
        { reason: reason || 'Tenant suspended by Super Admin' }
      );

      return reply.send({ 
        message: 'Tenant suspended successfully', 
        tenant: updated 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to suspend tenant' });
    }
  });

  // POST /api/admin/tenants/:id/deactivate
  fastify.post('/tenants/:id/deactivate', { preHandler: requireSuperAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { reason } = request.body;

      const current = await TenantModel.findOne({ id });
      if (!current) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      if (current.status === 'inactive') {
        return reply.code(400).send({ error: 'Tenant is already inactive' });
      }

      const updated = await TenantModel.findOneAndUpdate(
        { id },
        { 
          status: 'inactive',
          updatedAt: new Date(),
          lastModifiedBy: 'super_admin'
        },
        { new: true }
      );

      // Also terminate subscription
      await SubscriptionModel.findOneAndUpdate(
        { tenantId: id },
        { 
          lifecycleStatus: 'terminated',
          suspendedAt: new Date(),
          updatedAt: new Date()
        }
      );

      // Create audit entry
      const context = {
        userId: request.user?.id || 'super_admin',
        tenantId: id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logUpdate(
        context,
        'tenant',
        id,
        { status: current.status },
        { status: 'inactive' },
        { reason: reason || 'Tenant deactivated by Super Admin' }
      );

      return reply.send({ 
        message: 'Tenant deactivated successfully', 
        tenant: updated 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to deactivate tenant' });
    }
  });
}

module.exports = registerTenantAdminRoutes;
