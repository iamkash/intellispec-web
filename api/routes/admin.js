/**
 * Admin API Routes - Platform administrator endpoints for tenant, user, and role management
 * These routes fetch data directly from the database collections
 */

const { logger } = require('../core/Logger');
const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { requirePlatformAdmin } = require('../core/AuthMiddleware');

async function registerAdminRoutes(fastify) {
  // registering admin routes
  // Using centralized requirePlatformAdmin middleware from AuthMiddleware

  // ===================== TENANT STATS =====================
  fastify.get('/admin/tenants/stats', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }
      const tenantsCol = db.collection('tenants');
      const usersCol = db.collection('users');

      // Get tenant counts by status
      const tenantStats = await tenantsCol.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const totalTenants = await tenantsCol.countDocuments();
      const activeTenants = tenantStats.find(s => s._id === 'active')?.count || 0;
      const trialTenants = await tenantsCol.countDocuments({ 'subscription.plan': 'trial' });
      const totalUsers = await usersCol.countDocuments();

      // Calculate growth trends (simple mock for now - you can implement real calculation)
      const stats = [
        {
          id: 'total-tenants',
          title: 'Total Tenants',
          value: totalTenants,
          trend: { value: 8.5, direction: 'up', period: 'vs last month' },
          icon: 'ApartmentOutlined',
          color: 'blue'
        },
        {
          id: 'active-tenants',
          title: 'Active Tenants',
          value: activeTenants,
          trend: { value: 5.2, direction: 'up', period: 'vs last month' },
          icon: 'CheckCircleOutlined',
          color: 'green'
        },
        {
          id: 'trial-tenants',
          title: 'Trial Tenants',
          value: trialTenants,
          trend: { value: 25.0, direction: 'down', period: 'vs last month' },
          icon: 'ClockCircleOutlined',
          color: 'orange'
        },
        {
          id: 'total-users',
          title: 'Total Users',
          value: totalUsers,
          trend: { value: 12.3, direction: 'up', period: 'vs last month' },
          icon: 'UserOutlined',
          color: 'purple'
        }
      ];

      return { stats };
    } catch (error) {
      fastify.log.error('Error fetching tenant stats:', error);
      return reply.code(500).send({ error: 'Failed to fetch tenant statistics' });
    }
  });

  // ===================== TENANT MANAGEMENT =====================
  fastify.get('/admin/tenants', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }
      const tenantsCol = db.collection('tenants');
      const usersCol = db.collection('users');

      // Check if this is a request for options format (for dropdowns)
      const { format } = request.query;
      
      if (format === 'options') {
        // Return simplified format for dropdown options
        const tenants = await tenantsCol.find(
          { status: { $in: ['active', 'pending'] } }, // Only active/pending tenants
          { 
            projection: { 
              _id: 1, 
              name: 1, 
              tenantSlug: 1,
              status: 1 
            } 
          }
        ).sort({ name: 1 }).toArray();

        const options = tenants.map(tenant => ({
          value: tenant._id.toString(),
          label: `${tenant.name} (${tenant.tenantSlug})`,
          key: tenant._id.toString()
        }));

        return reply.send(options);
      }

      // Default: Get all tenants with user counts
      const tenants = await tenantsCol.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'tenantId',
            as: 'users'
          }
        },
        {
          $addFields: {
            userCount: { $size: '$users' }
          }
        },
        {
          $project: {
            users: 0 // Don't return user details, just count
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();

      return reply.send({ data: tenants });
    } catch (error) {
      fastify.log.error('Error fetching tenants:', error);
      return reply.code(500).send({ error: 'Failed to fetch tenants' });
    }
  });

  // ===================== USER MANAGEMENT =====================
  fastify.get('/admin/users', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }
      const usersCol = db.collection('users');

      // Get all users with tenant and role information
      const users = await usersCol.aggregate([
        {
          $lookup: {
            from: 'tenants',
            localField: 'tenantId',
            foreignField: '_id',
            as: 'tenant'
          }
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'roleIds',
            foreignField: '_id',
            as: 'roles'
          }
        },
        {
          $addFields: {
            tenantName: { $arrayElemAt: ['$tenant.name', 0] },
            tenantSlug: { $arrayElemAt: ['$tenant.tenantSlug', 0] },
            role: { $arrayElemAt: ['$roles.name', 0] } // Primary role
          }
        },
        {
          $project: {
            password: 0, // Never return passwords
            tenant: 0,
            roles: 0
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray();

      return { data: users };
    } catch (error) {
      fastify.log.error('Error fetching users:', error);
      return reply.code(500).send({ error: 'Failed to fetch users' });
    }
  });

  // ===================== ROLE MANAGEMENT =====================
  fastify.get('/admin/roles', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }
      const rolesCol = db.collection('roles');
      const usersCol = db.collection('users');

      // Check if this is a request for options format (for dropdowns)
      const { format } = request.query;
      
      if (format === 'options') {
        // Return simplified format for dropdown options
        const roles = await rolesCol.find(
          {}, // Get all roles
          { 
            projection: { 
              _id: 1, 
              name: 1, 
              isSystemRole: 1,
              tenantId: 1
            } 
          }
        ).sort({ isSystemRole: -1, name: 1 }).toArray();

        const options = roles.map(role => ({
          value: role._id.toString(),
          label: `${role.name}${role.isSystemRole ? ' (System)' : ''}`,
          key: role._id.toString()
        }));

        return reply.send(options);
      }

      // Default: Get all roles with user counts
      const roles = await rolesCol.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'roleIds',
            as: 'users'
          }
        },
        {
          $lookup: {
            from: 'tenants',
            localField: 'tenantId',
            foreignField: '_id',
            as: 'tenant'
          }
        },
        {
          $addFields: {
            userCount: { $size: '$users' },
            tenantName: { $arrayElemAt: ['$tenant.name', 0] },
            type: { $cond: { if: { $eq: ['$isSystemRole', true] }, then: 'system', else: 'custom' } },
            tenantScope: { $cond: { if: { $eq: ['$tenantId', null] }, then: 'global', else: 'tenant' } }
          }
        },
        {
          $project: {
            users: 0,
            tenant: 0
          }
        },
        {
          $sort: { isSystemRole: -1, name: 1 }
        }
      ]).toArray();

      return reply.send({ data: roles });
    } catch (error) {
      fastify.log.error('Error fetching roles:', error);
      return reply.code(500).send({ error: 'Failed to fetch roles' });
    }
  });

  // ===================== TENANT CRUD OPERATIONS =====================
  
  // Create new tenant
  fastify.post('/admin/tenants', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const tenantsCol = db.collection('tenants');
      
      const tenantData = {
        ...request.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: request.body.status || 'active'
      };
      
      const result = await tenantsCol.insertOne(tenantData);
      return { success: true, id: result.insertedId };
    } catch (error) {
      fastify.log.error('Error creating tenant:', error);
      return reply.code(500).send({ error: 'Failed to create tenant' });
    }
  });

  // Update tenant
  fastify.put('/admin/tenants/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const tenantsCol = db.collection('tenants');
      
      const updateData = {
        ...request.body,
        updatedAt: new Date()
      };
      delete updateData._id; // Don't update _id
      
      const result = await tenantsCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { $set: updateData }
      );
      
      return { success: true, modified: result.modifiedCount };
    } catch (error) {
      fastify.log.error('Error updating tenant:', error);
      return reply.code(500).send({ error: 'Failed to update tenant' });
    }
  });

  // Delete tenant
  fastify.delete('/admin/tenants/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const tenantsCol = db.collection('tenants');
      
      const result = await tenantsCol.deleteOne({ _id: new ObjectId(request.params.id) });
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      fastify.log.error('Error deleting tenant:', error);
      return reply.code(500).send({ error: 'Failed to delete tenant' });
    }
  });

  // ===================== USER CRUD OPERATIONS =====================
  
  // Create new user
  fastify.post('/admin/users', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const usersCol = db.collection('users');
      const bcrypt = require('bcryptjs');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(request.body.password, 12);
      
      const userData = {
        ...request.body,
        password: hashedPassword,
        tenantId: new ObjectId(request.body.tenantId),
        roleIds: (request.body.roleIds || []).map(id => new ObjectId(id)),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: request.body.status || 'active'
      };
      
      const result = await usersCol.insertOne(userData);
      return { success: true, id: result.insertedId };
    } catch (error) {
      fastify.log.error('Error creating user:', error);
      return reply.code(500).send({ error: 'Failed to create user' });
    }
  });

  // Update user
  fastify.put('/admin/users/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const usersCol = db.collection('users');
      
      const updateData = {
        ...request.body,
        updatedAt: new Date()
      };
      
      // Handle password update
      if (updateData.password) {
        const bcrypt = require('bcryptjs');
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }
      
      // Handle ObjectId conversions
      if (updateData.tenantId) updateData.tenantId = new ObjectId(updateData.tenantId);
      if (updateData.roleIds) updateData.roleIds = updateData.roleIds.map(id => new ObjectId(id));
      
      delete updateData._id; // Don't update _id
      
      const result = await usersCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { $set: updateData }
      );
      
      return { success: true, modified: result.modifiedCount };
    } catch (error) {
      fastify.log.error('Error updating user:', error);
      return reply.code(500).send({ error: 'Failed to update user' });
    }
  });

  // Delete user
  fastify.delete('/admin/users/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const usersCol = db.collection('users');
      
      const result = await usersCol.deleteOne({ _id: new ObjectId(request.params.id) });
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      fastify.log.error('Error deleting user:', error);
      return reply.code(500).send({ error: 'Failed to delete user' });
    }
  });

  // ===================== ROLE CRUD OPERATIONS =====================
  
  // Create new role
  fastify.post('/admin/roles', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const rolesCol = db.collection('roles');
      
      const roleData = {
        ...request.body,
        tenantId: request.body.tenantId ? new ObjectId(request.body.tenantId) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystemRole: request.body.isSystemRole || false
      };
      
      const result = await rolesCol.insertOne(roleData);
      return { success: true, id: result.insertedId };
    } catch (error) {
      fastify.log.error('Error creating role:', error);
      return reply.code(500).send({ error: 'Failed to create role' });
    }
  });

  // Update role
  fastify.put('/admin/roles/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const rolesCol = db.collection('roles');
      
      const updateData = {
        ...request.body,
        updatedAt: new Date()
      };
      
      if (updateData.tenantId) updateData.tenantId = new ObjectId(updateData.tenantId);
      delete updateData._id; // Don't update _id
      
      const result = await rolesCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { $set: updateData }
      );
      
      return { success: true, modified: result.modifiedCount };
    } catch (error) {
      fastify.log.error('Error updating role:', error);
      return reply.code(500).send({ error: 'Failed to update role' });
    }
  });

  // Delete role
  fastify.delete('/admin/roles/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const rolesCol = db.collection('roles');
      
      const result = await rolesCol.deleteOne({ _id: new ObjectId(request.params.id) });
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      fastify.log.error('Error deleting role:', error);
      return reply.code(500).send({ error: 'Failed to delete role' });
    }
  });

  // ===================== MODULE CRUD OPERATIONS =====================
  
  // Get modules statistics
  fastify.get('/admin/modules/stats', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      const stats = await modulesCol.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            hidden: { $sum: { $cond: [{ $eq: ['$status', 'hidden'] }, 1, 0] } },
            defaultInFlex: { $sum: { $cond: ['$defaultIncludedInFlex', 1, 0] } }
          }
        }
      ]).toArray();
      
      const categoryStats = await modulesCol.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      const result = stats[0] || { total: 0, active: 0, hidden: 0, defaultInFlex: 0 };
      result.categories = categoryStats;
      
      return reply.send({ 
        stats: [
          { 
            label: 'Total Modules', 
            value: result.total, 
            icon: 'Package',
            trend: 'stable' 
          },
          { 
            label: 'Active Modules', 
            value: result.active, 
            icon: 'CheckCircle',
            trend: 'up' 
          },
          { 
            label: 'Default in Flex', 
            value: result.defaultInFlex, 
            icon: 'Star',
            trend: 'stable' 
          },
          { 
            label: 'Categories', 
            value: categoryStats.length, 
            icon: 'Tag',
            trend: 'stable' 
          }
        ]
      });
    } catch (error) {
      fastify.log.error('Error fetching module stats:', error);
      return reply.code(500).send({ error: 'Failed to fetch module statistics' });
    }
  });
  
  // Get all modules
  fastify.get('/admin/modules', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      const { 
        page = 1, 
        pageSize = 15, 
        search, 
        status, 
        category, 
        defaultIncludedInFlex,
        sortBy = 'name',
        sortOrder = 'asc'
      } = request.query;
      
      // Build query
      let query = {};
      
      if (search) {
        query.$or = [
          { key: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) query.status = status;
      if (category) query.category = category;
      if (defaultIncludedInFlex !== undefined) {
        query.defaultIncludedInFlex = defaultIncludedInFlex === 'true';
      }
      
      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      
      // Get data
      const [modules, totalCount] = await Promise.all([
        modulesCol.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        modulesCol.countDocuments(query)
      ]);
      
      return reply.send({
        data: modules,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(pageSize))
        }
      });
    } catch (error) {
      fastify.log.error('Error fetching modules:', error);
      return reply.code(500).send({ error: 'Failed to fetch modules' });
    }
  });
  
  // Create new module
  fastify.post('/admin/modules', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      // Check if key already exists
      const existingModule = await modulesCol.findOne({ key: request.body.key });
      if (existingModule) {
        return reply.code(400).send({ error: 'Module key already exists' });
      }
      
      // Prevent creation of system module
      if (request.body.key === 'system') {
        return reply.code(400).send({ error: 'Cannot create system module - it already exists' });
      }
      
      const moduleData = {
        key: request.body.key,
        name: request.body.name,
        status: request.body.status || 'active',
        category: request.body.category || null,
        defaultIncludedInFlex: request.body.defaultIncludedInFlex || false,
        icon: request.body.icon || 'Package',
        description: request.body.description || '',
        isSystemModule: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await modulesCol.insertOne(moduleData);
      return reply.send({ success: true, id: result.insertedId, module: moduleData });
    } catch (error) {
      fastify.log.error('Error creating module:', error);
      return reply.code(500).send({ error: 'Failed to create module' });
    }
  });
  
  // Update module
  fastify.put('/admin/modules/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      // Get existing module
      const existingModule = await modulesCol.findOne({ _id: new ObjectId(request.params.id) });
      if (!existingModule) {
        return reply.code(404).send({ error: 'Module not found' });
      }
      
      // Prevent editing system module key or making it inactive
      if (existingModule.isSystemModule || existingModule.key === 'system') {
        if (request.body.key && request.body.key !== existingModule.key) {
          return reply.code(400).send({ error: 'Cannot change system module key' });
        }
        if (request.body.status && request.body.status !== 'active') {
          return reply.code(400).send({ error: 'System module must remain active' });
        }
        if (request.body.defaultIncludedInFlex === false) {
          return reply.code(400).send({ error: 'System module must remain included by default' });
        }
      }
      
      // Check if new key conflicts (if key is being changed)
      if (request.body.key && request.body.key !== existingModule.key) {
        const keyConflict = await modulesCol.findOne({ 
          key: request.body.key,
          _id: { $ne: new ObjectId(request.params.id) }
        });
        if (keyConflict) {
          return reply.code(400).send({ error: 'Module key already exists' });
        }
      }
      
      const updateData = {
        name: request.body.name || existingModule.name,
        status: request.body.status || existingModule.status,
        category: request.body.category !== undefined ? request.body.category : existingModule.category,
        defaultIncludedInFlex: request.body.defaultIncludedInFlex !== undefined ? request.body.defaultIncludedInFlex : existingModule.defaultIncludedInFlex,
        icon: request.body.icon || existingModule.icon,
        description: request.body.description !== undefined ? request.body.description : existingModule.description,
        updatedAt: new Date()
      };
      
      // Only allow key changes for non-system modules
      if (!existingModule.isSystemModule && request.body.key) {
        updateData.key = request.body.key;
      }
      
      const result = await modulesCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { $set: updateData }
      );
      
      return reply.send({ success: true, modified: result.modifiedCount });
    } catch (error) {
      fastify.log.error('Error updating module:', error);
      return reply.code(500).send({ error: 'Failed to update module' });
    }
  });
  
  // Archive module (soft delete by setting status to hidden)
  fastify.post('/admin/modules/:id/archive', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      // Get existing module
      const existingModule = await modulesCol.findOne({ _id: new ObjectId(request.params.id) });
      if (!existingModule) {
        return reply.code(404).send({ error: 'Module not found' });
      }
      
      // Prevent archiving system module
      if (existingModule.isSystemModule || existingModule.key === 'system') {
        return reply.code(400).send({ error: 'Cannot archive system module' });
      }
      
      const result = await modulesCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { 
          $set: { 
            status: 'hidden',
            updatedAt: new Date()
          }
        }
      );
      
      return reply.send({ success: true, modified: result.modifiedCount });
    } catch (error) {
      fastify.log.error('Error archiving module:', error);
      return reply.code(500).send({ error: 'Failed to archive module' });
    }
  });
  
  // Activate module
  fastify.post('/admin/modules/:id/activate', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      const result = await modulesCol.updateOne(
        { _id: new ObjectId(request.params.id) },
        { 
          $set: { 
            status: 'active',
            updatedAt: new Date()
          }
        }
      );
      
      return reply.send({ success: true, modified: result.modifiedCount });
    } catch (error) {
      fastify.log.error('Error activating module:', error);
      return reply.code(500).send({ error: 'Failed to activate module' });
    }
  });
  
  // Delete module (hard delete - use with caution)
  fastify.delete('/admin/modules/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const modulesCol = db.collection('modules');
      
      // Get existing module
      const existingModule = await modulesCol.findOne({ _id: new ObjectId(request.params.id) });
      if (!existingModule) {
        return reply.code(404).send({ error: 'Module not found' });
      }
      
      // Prevent deleting system module
      if (existingModule.isSystemModule || existingModule.key === 'system') {
        return reply.code(400).send({ error: 'Cannot delete system module' });
      }
      
      const result = await modulesCol.deleteOne({ _id: new ObjectId(request.params.id) });
      return reply.send({ success: true, deleted: result.deletedCount });
    } catch (error) {
      fastify.log.error('Error deleting module:', error);
      return reply.code(500).send({ error: 'Failed to delete module' });
    }
  });
  
  
}

module.exports = registerAdminRoutes;
