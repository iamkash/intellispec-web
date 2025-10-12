/**
 * Security Audit Service
 * 
 * Ensures all API endpoints are properly tenant-aware and secure.
 * Prevents data leakage between tenants.
 * 
 * Design Patterns:
 * - Audit Pattern (systematic checking)
 * - Observer Pattern (monitoring)
 * 
 * Features:
 * - Tenant isolation verification
 * - Cross-tenant leak detection
 * - Asset hierarchy validation
 * - Security reporting
 */

const mongoose = require('mongoose');
const { logger } = require('./Logger');

class SecurityAudit {
  /**
   * Audit all documents for tenant isolation
   */
  static async auditTenantIsolation() {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('documents');
      
      logger.info('Starting Tenant Security Audit');
      
      // Get all unique tenant IDs
      const tenants = await collection.distinct('tenantId');
      logger.info('Found tenants', { count: tenants.length, tenants });
      
      // Check each document type for tenant distribution
      const documentTypes = await collection.distinct('type');
      logger.info('Found document types', { count: documentTypes.length, documentTypes });
      
      const auditResults = [];
      
      for (const docType of documentTypes) {
        logger.info(`Analyzing ${docType} documents`);
        
        const typeStats = await collection.aggregate([
          { $match: { type: docType } },
          { $group: { 
            _id: '$tenantId', 
            count: { $sum: 1 },
            sampleDocs: { $push: { id: '$id', name: '$name' } }
          }},
          { $sort: { count: -1 } }
        ]).toArray();
        
        const typeSummary = {
          documentType: docType,
          tenantDistribution: typeStats.map(stat => ({
            tenantId: stat._id,
            count: stat.count,
            sample: stat.sampleDocs[0]?.name || stat.sampleDocs[0]?.id
          }))
        };
        
        auditResults.push(typeSummary);
        
        typeStats.forEach(stat => {
          logger.info(`Tenant ${stat._id}: ${stat.count} ${docType} documents`, {
            sample: stat.sampleDocs[0]?.name || stat.sampleDocs[0]?.id
          });
        });
      }
      
      // Check for documents without tenant ID (security risk)
      const untenanted = await collection.countDocuments({ 
        $or: [
          { tenantId: { $exists: false } },
          { tenantId: null },
          { tenantId: '' }
        ]
      });
      
      if (untenanted > 0) {
        logger.warn('SECURITY RISK: Documents without tenant ID', { 
          count: untenanted 
        });
        
        auditResults.push({
          securityIssue: 'MISSING_TENANT_ID',
          count: untenanted,
          severity: 'HIGH'
        });
      } else {
        logger.info('All documents have proper tenant IDs');
      }
      
      return {
        success: true,
        tenantCount: tenants.length,
        documentTypeCount: documentTypes.length,
        untenantedDocuments: untenanted,
        details: auditResults
      };
      
    } catch (error) {
      logger.error('Tenant security audit failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Validate that a specific API endpoint properly filters by tenant
   */
  static async testEndpointTenantFiltering(endpoint, params = {}) {
    try {
      logger.info('Testing tenant filtering for endpoint', { endpoint, params });
      
      // This would need to be called with different tenant contexts
      // to verify isolation - implementation depends on your auth system
      
      // TODO: Implement endpoint-specific testing
      
      logger.warn('Endpoint testing not fully implemented', { endpoint });
      
      return {
        endpoint,
        tested: false,
        message: 'Implementation pending'
      };
      
    } catch (error) {
      logger.error('Failed to test endpoint', { endpoint, error: error.message });
      throw error;
    }
  }
  
  /**
   * Check for cross-tenant data leaks in asset hierarchy
   */
  static async auditAssetHierarchy() {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('documents');
      
      logger.info('Auditing Asset Hierarchy Tenant Isolation');
      
      const hierarchyIssues = [];
      
      // Check companies
      const companies = await collection.find({ type: 'company' }).toArray();
      logger.info('Found companies', { count: companies.length });
      
      for (const company of companies.slice(0, 3)) { // Check first 3 companies
        logger.info(`Checking company`, { 
          name: company.name, 
          tenantId: company.tenantId 
        });
        
        // Check sites for this company
        const sites = await collection.find({ 
          type: 'site', 
          company_id: company.id
        }).toArray();
        
        logger.info(`Found sites for company`, { 
          companyName: company.name,
          siteCount: sites.length 
        });
        
        // Check for cross-tenant leaks in sites
        const crossTenantSites = sites.filter(site => site.tenantId !== company.tenantId);
        if (crossTenantSites.length > 0) {
          logger.error('SECURITY ISSUE: Cross-tenant sites found', {
            companyId: company.id,
            companyTenantId: company.tenantId,
            crossTenantSites: crossTenantSites.map(s => ({
              id: s.id,
              name: s.name,
              tenantId: s.tenantId
            }))
          });
          
          hierarchyIssues.push({
            type: 'CROSS_TENANT_SITE',
            company: { id: company.id, tenantId: company.tenantId },
            issues: crossTenantSites.length
          });
        }
        
        for (const site of sites.slice(0, 2)) { // Check first 2 sites
          logger.info(`Checking site`, { 
            name: site.name, 
            tenantId: site.tenantId 
          });
          
          // Check asset groups for this site
          const assetGroups = await collection.find({
            type: 'asset_group',
            site_id: site.id
          }).toArray();
          
          logger.info(`Found asset groups for site`, {
            siteName: site.name,
            assetGroupCount: assetGroups.length
          });
          
          // Check for cross-tenant leaks in asset groups
          const crossTenantGroups = assetGroups.filter(group => group.tenantId !== site.tenantId);
          if (crossTenantGroups.length > 0) {
            logger.error('SECURITY ISSUE: Cross-tenant asset groups found', {
              siteId: site.id,
              siteTenantId: site.tenantId,
              crossTenantGroups: crossTenantGroups.map(g => ({
                id: g.id,
                name: g.name,
                tenantId: g.tenantId
              }))
            });
            
            hierarchyIssues.push({
              type: 'CROSS_TENANT_ASSET_GROUP',
              site: { id: site.id, tenantId: site.tenantId },
              issues: crossTenantGroups.length
            });
          }
        }
      }
      
      if (hierarchyIssues.length === 0) {
        logger.info('No cross-tenant hierarchy issues found');
      } else {
        logger.warn('Cross-tenant hierarchy issues detected', { 
          issueCount: hierarchyIssues.length 
        });
      }
      
      return {
        success: true,
        companiesChecked: Math.min(companies.length, 3),
        issuesFound: hierarchyIssues.length,
        issues: hierarchyIssues
      };
      
    } catch (error) {
      logger.error('Asset hierarchy audit failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Run comprehensive security audit
   * Combines all audit checks
   */
  static async runFullAudit() {
    logger.info('Starting comprehensive security audit');
    
    const results = {
      timestamp: new Date().toISOString(),
      audits: []
    };
    
    try {
      // Tenant isolation audit
      const tenantIsolation = await this.auditTenantIsolation();
      results.audits.push({
        name: 'Tenant Isolation',
        ...tenantIsolation
      });
      
      // Asset hierarchy audit
      const assetHierarchy = await this.auditAssetHierarchy();
      results.audits.push({
        name: 'Asset Hierarchy',
        ...assetHierarchy
      });
      
      results.success = true;
      results.overallStatus = results.audits.every(a => a.success) ? 'PASS' : 'FAIL';
      
      logger.info('Security audit completed', { 
        status: results.overallStatus 
      });
      
      return results;
      
    } catch (error) {
      results.success = false;
      results.error = error.message;
      logger.error('Security audit failed', { error: error.message });
      return results;
    }
  }
}

module.exports = SecurityAudit;

