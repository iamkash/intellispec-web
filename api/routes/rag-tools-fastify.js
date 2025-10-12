const { logger } = require('../core/Logger');
const mongoose = require('mongoose');

// Use existing mongoose connection instead of creating new MongoClient
const getDb = () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected. Ensure mongoose.connect() is called first.');
  }
  return mongoose.connection.db;
};

async function registerRagToolsRoutes(fastify) {
  /**
   * Configurable tool execution endpoint for search_data
   * Searches any document type based on current filters and context
   */
  fastify.post('/api/tools/search_data', async (request, reply) => {
    try {
      const { arguments: args, context } = request.body;
      const { query, filters } = args;
      const tenantId = request.headers['x-tenant-id'];

      const { documentType } = args;
// Build search pipeline for configurable document types
      const searchConditions = [
        { 'type': { $regex: query, $options: 'i' } },
        { 'id': { $regex: query, $options: 'i' } }
      ];

      // Add document type specific search fields based on schema
      if (documentType === 'paintInvoice') {
        searchConditions.push(
          { 'name': { $regex: query, $options: 'i' } },
          { 'vendorName': { $regex: query, $options: 'i' } },
          { 'productName': { $regex: query, $options: 'i' } },
          { 'paintType': { $regex: query, $options: 'i' } }
        );
      } else if (documentType === 'company') {
        searchConditions.push(
          { 'name': { $regex: query, $options: 'i' } },
          { 'industry': { $regex: query, $options: 'i' } }
        );
      } else if (documentType === 'site') {
        searchConditions.push(
          { 'name': { $regex: query, $options: 'i' } },
          { 'location': { $regex: query, $options: 'i' } }
        );
      } else if (documentType === 'paint_specifications') {
        searchConditions.push(
          { 'manufacturer': { $regex: query, $options: 'i' } },
          { 'productName': { $regex: query, $options: 'i' } },
          { 'productCode': { $regex: query, $options: 'i' } },
          { 'color': { $regex: query, $options: 'i' } }
        );
      }

      const pipeline = [
        {
          $match: {
            $and: [
              { tenantId: tenantId || 'default' },
              { type: documentType },
              { deleted: { $ne: true } },
              { $or: searchConditions }
            ]
          }
        },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            id: 1,
            type: 1,
            name: 1,
            vendorName: 1,
            productName: 1,
            paintType: 1,
            industry: 1,
            location: 1,
            manufacturer: 1,
            productCode: 1,
            color: 1,
            vocContent: 1,
            gallons: 1,
            costPerGallon: 1,
            totalCost: 1,
            purchaseDate: 1,
            companyId: 1,
            facilityId: 1
          }
        }
      ];

      const results = await getDb().collection('documents').aggregate(pipeline).toArray();
      
      return reply.send({
        success: true,
        data: results,
        count: results.length,
        query: query,
        documentType: documentType
      });
    } catch (error) {
      logger.error('Search data error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * Calculate total VOC emissions
   */
  fastify.post('/api/tools/calculate_voc', async (request, reply) => {
    try {
      const { arguments: args } = request.body;
      const { startDate, endDate, facilityId, companyId } = args;
      const tenantId = request.headers['x-tenant-id'];
const matchConditions = {
        tenantId: tenantId || 'default',
        type: 'paintInvoice',
        deleted: { $ne: true }
      };

      if (startDate && endDate) {
        matchConditions.purchaseDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      if (facilityId) matchConditions.facilityId = facilityId;
      if (companyId) matchConditions.companyId = companyId;

      const pipeline = [
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalVOC: { $sum: { $multiply: ['$vocContent', '$gallons'] } },
            totalGallons: { $sum: '$gallons' },
            invoiceCount: { $sum: 1 },
            totalCost: { $sum: '$totalCost' }
          }
        }
      ];

      const results = await getDb().collection('documents').aggregate(pipeline).toArray();
      const summary = results[0] || { totalVOC: 0, totalGallons: 0, invoiceCount: 0, totalCost: 0 };

      return reply.send({
        success: true,
        data: {
          totalVOC: summary.totalVOC,
          totalGallons: summary.totalGallons,
          invoiceCount: summary.invoiceCount,
          totalCost: summary.totalCost,
          averageVOCPerGallon: summary.totalGallons > 0 ? summary.totalVOC / summary.totalGallons : 0
        }
      });
    } catch (error) {
      logger.error('Calculate VOC error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * Get compliance status
   */
  fastify.post('/api/tools/get_compliance_status', async (request, reply) => {
    try {
      const { arguments: args } = request.body;
      const { facilityId, year } = args;
      const tenantId = request.headers['x-tenant-id'];

      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      const pipeline = [
        {
          $match: {
            tenantId: tenantId || 'default',
            type: 'paintInvoice',
            facilityId: facilityId,
            purchaseDate: { $gte: startDate, $lte: endDate },
            deleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: { $month: '$purchaseDate' },
            monthlyVOC: { $sum: { $multiply: ['$vocContent', '$gallons'] } },
            monthlyGallons: { $sum: '$gallons' }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const monthlyData = await getDb().collection('documents').aggregate(pipeline).toArray();
      
      const yearlyTotal = monthlyData.reduce((sum, month) => sum + month.monthlyVOC, 0);
      const vocLimit = 10000; // Example limit in lbs
      const complianceStatus = yearlyTotal <= vocLimit ? 'COMPLIANT' : 'NON_COMPLIANT';

      return reply.send({
        success: true,
        data: {
          facilityId,
          year,
          yearlyVOC: yearlyTotal,
          vocLimit,
          complianceStatus,
          monthlyBreakdown: monthlyData.map(m => ({
            month: m._id,
            voc: m.monthlyVOC,
            gallons: m.monthlyGallons
          }))
        }
      });
    } catch (error) {
      logger.error('Get compliance status error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * Generate report
   */
  fastify.post('/api/tools/generate_report', async (request, reply) => {
    try {
      const { arguments: args } = request.body;
      const { reportType, parameters } = args;
      const tenantId = request.headers['x-tenant-id'];
// This would typically generate a PDF or Excel report
      // For now, return structured data
      const reportData = {
        reportType,
        generatedAt: new Date(),
        parameters,
        summary: {
          message: `${reportType} report generated successfully`,
          recordCount: 0
        }
      };

      return reply.send({
        success: true,
        data: reportData
      });
    } catch (error) {
      logger.error('Generate report error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * Compare facilities
   */
  fastify.post('/api/tools/compare_facilities', async (request, reply) => {
    try {
      const { arguments: args } = request.body;
      const { facilityIds, metric, timeRange } = args;
      const tenantId = request.headers['x-tenant-id'];

      const comparisons = await Promise.all(
        facilityIds.map(async (facilityId) => {
          const pipeline = [
            {
              $match: {
                tenantId: tenantId || 'default',
                type: 'paintInvoice',
                facilityId: facilityId,
                deleted: { $ne: true }
              }
            },
            {
              $group: {
                _id: '$facilityId',
                totalVOC: { $sum: { $multiply: ['$vocContent', '$gallons'] } },
                totalGallons: { $sum: '$gallons' },
                totalCost: { $sum: '$totalCost' },
                invoiceCount: { $sum: 1 }
              }
            }
          ];

          const results = await getDb().collection('documents').aggregate(pipeline).toArray();
          return results[0] || { _id: facilityId, totalVOC: 0, totalGallons: 0, totalCost: 0, invoiceCount: 0 };
        })
      );

      return reply.send({
        success: true,
        data: {
          metric,
          timeRange,
          comparisons: comparisons.map(c => ({
            facilityId: c._id,
            totalVOC: c.totalVOC,
            totalGallons: c.totalGallons,
            totalCost: c.totalCost,
            invoiceCount: c.invoiceCount,
            averageVOCPerGallon: c.totalGallons > 0 ? c.totalVOC / c.totalGallons : 0
          }))
        }
      });
    } catch (error) {
      logger.error('Compare facilities error:', error);
      return reply.status(500).send({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

module.exports = registerRagToolsRoutes;
