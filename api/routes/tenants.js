/**
 * Tenant Discovery API Routes (Fastify)
 * 
 * Provides endpoints for discovering tenant(s) by email domain
 * and listing available tenants for multi-tenant login flows.
 */

const mongoose = require('mongoose');

// Lazy-load models to avoid issues with initialization order
const getTenantModel = () => mongoose.model('Tenant');
const getMembershipModel = () => mongoose.model('Membership');
const getUserModel = () => mongoose.model('User');

/**
 * Register tenant discovery routes
 */
async function registerTenantRoutes(fastify) {
  
  /**
   * GET /api/tenants/discover
   * 
   * Discover tenant(s) for a given email address
   * 
   * Query params:
   *   - email: User's email address
   *   - domain: Email domain (optional, extracted from email if not provided)
   * 
   * Response formats:
   *   1. Single tenant found: { tenantSlug: "tenant-slug" }
   *   2. Multiple tenants: { tenants: [{ slug: "...", name: "..." }] }
   *   3. No tenants: { error: "No tenant found" }
   */
  fastify.get('/tenants/discover', async (request, reply) => {
    try {
      const { email, domain } = request.query;
      
      const TenantModel = getTenantModel();
      const MembershipModel = getMembershipModel();
      const UserModel = getUserModel();
      
      if (!email) {
        return reply.code(400).send({ 
          error: 'Email parameter is required' 
        });
      }
      
      // Extract domain from email if not provided
      const emailDomain = domain || email.split('@')[1];
      
      if (!emailDomain) {
        return reply.code(400).send({ 
          error: 'Invalid email format' 
        });
      }
      
      // Strategy 1: Find user by email and get their memberships
      const user = await UserModel.findOne({ 
        email: email.toLowerCase() 
      }).lean();
      
      if (user) {
        // Check if user is platform admin - they can access ALL tenants
        if (user.platformRole === 'platform_admin') {
          const allTenants = await TenantModel.find({ 
            status: 'active' 
          })
          .select('id name slug')
          .sort({ name: 1 })
          .lean();
          
          if (allTenants.length === 1) {
            return reply.send({ 
              tenantSlug: allTenants[0].slug,
              tenantName: allTenants[0].name,
              isPlatformAdmin: true
            });
          } else if (allTenants.length > 0) {
            return reply.send({ 
              tenants: allTenants.map(t => ({
                slug: t.slug,
                name: t.name
              })),
              isPlatformAdmin: true
            });
          }
        }
        
        // Regular user - Get tenants via memberships
        const userId = user.id || user.userId || user._id.toString();
        const memberships = await MembershipModel.find({ 
          userId: userId
        }).lean();
        
        if (memberships && memberships.length > 0) {
          const tenantIds = memberships.map(m => m.tenantId);
          
          // Support both schemas - try both id and _id
          // Separate valid ObjectIds from string IDs
          const validObjectIds = [];
          tenantIds.forEach(id => {
            if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
              try {
                validObjectIds.push(new require('mongoose').Types.ObjectId(id));
              } catch (e) {
                // Skip invalid ObjectIds
              }
            }
          });
          
          const tenantQuery = {
            status: 'active',
            $or: [
              { id: { $in: tenantIds } }
            ]
          };
          
          if (validObjectIds.length > 0) {
            tenantQuery.$or.push({ _id: { $in: validObjectIds } });
          }
          
          const tenants = await TenantModel.find(tenantQuery)
          .select('id name slug tenantSlug')
          .lean();
          
          if (tenants.length === 1) {
            // Single tenant - return slug directly (support both field names)
            const slug = tenants[0].slug || tenants[0].tenantSlug;
            return reply.send({ 
              tenantSlug: slug,
              tenantName: tenants[0].name
            });
          } else if (tenants.length > 1) {
            // Multiple tenants - return list for user to choose
            return reply.send({ 
              tenants: tenants.map(t => ({
                slug: t.slug || t.tenantSlug,
                name: t.name
              }))
            });
          }
        }
      }
      
      // Strategy 2: Try to find tenant by email domain pattern
      // This is useful for enterprise customers with custom domains
      // e.g., @hfsinclair.com -> hf-sinclair tenant
      const domainBasedTenant = await TenantModel.findOne({
        status: 'active',
        $or: [
          { slug: emailDomain.split('.')[0].toLowerCase() },
          { name: new RegExp(emailDomain.split('.')[0], 'i') }
        ]
      })
      .select('id name slug')
      .lean();
      
      if (domainBasedTenant) {
        return reply.send({ 
          tenantSlug: domainBasedTenant.slug,
          tenantName: domainBasedTenant.name,
          discovered: 'domain-match'
        });
      }
      
      // Strategy 3: No tenant found
      return reply.code(404).send({ 
        error: 'No organization found for this email address',
        suggestion: 'Please contact your administrator for access'
      });
      
    } catch (error) {
      fastify.log.error('Tenant discovery error:', error);
      return reply.code(500).send({ 
        error: 'Failed to discover tenant',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/tenants
   * 
   * List all active tenants (for admin purposes or tenant selector)
   * Note: In production, this should be protected and possibly filtered
   */
  fastify.get('/tenants', async (request, reply) => {
    try {
      const { status = 'active', limit = 100 } = request.query;
      
      const TenantModel = getTenantModel();
      
      const tenants = await TenantModel.find({ 
        status 
      })
      .select('id name slug status plan tenantType')
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .lean();
      
      return reply.send({ 
        tenants,
        count: tenants.length
      });
      
    } catch (error) {
      fastify.log.error('List tenants error:', error);
      return reply.code(500).send({ 
        error: 'Failed to list tenants',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/tenants/:slugOrId
   * 
   * Get tenant details by slug or ID
   */
  fastify.get('/tenants/:slugOrId', async (request, reply) => {
    try {
      const { slugOrId } = request.params;
      
      const TenantModel = getTenantModel();
      
      const tenant = await TenantModel.findOne({
        $or: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
      })
      .select('id name slug status plan tenantType maxUsers maxFacilities')
      .lean();
      
      if (!tenant) {
        return reply.code(404).send({ 
          error: 'Tenant not found' 
        });
      }
      
      return reply.send(tenant);
      
    } catch (error) {
      fastify.log.error('Get tenant error:', error);
      return reply.code(500).send({ 
        error: 'Failed to get tenant',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}

module.exports = registerTenantRoutes;
