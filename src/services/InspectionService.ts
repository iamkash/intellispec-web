/**
 * Inspection Service
 * 
 * Handles CRUD operations for inspection documents with tenant isolation
 */

import { v4 as uuidv4 } from 'uuid';
import { InspectionModel } from '../models/DocumentSchemas';

export interface InspectionSaveData {
  inspectionType: string;
  workspaceId: string;
  status?: string;
  progress?: number;
  formData?: Record<string, any>;
  sections?: Record<string, any>;
  grids?: Record<string, any>;
  aiAnalysis?: Record<string, any>;
  attachments?: any[];
  wizardState?: any;
  [key: string]: any;
}

export class InspectionService {
  /**
   * Create a new inspection document
   */
  static async createInspection(
    data: InspectionSaveData,
    tenantId: string,
    userId: string
  ): Promise<any> {
    const inspectionId = `INSP-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const inspection = new InspectionModel({
      id: inspectionId,
      type: 'inspection',
      tenantId,
      inspectionType: data.inspectionType,
      workspaceId: data.workspaceId,
      status: data.status || 'draft',
      progress: data.progress || 0,
      formData: data.formData || {},
      sections: data.sections || {},
      grids: data.grids || {},
      aiAnalysis: data.aiAnalysis || {},
      attachments: data.attachments || [],
      wizardState: data.wizardState,
      completedSections: data.completedSections || [],
      created_date: new Date(),
      created_by: userId,
      last_updated: new Date(),
      updated_by: userId
    });

    await inspection.save();
    return inspection;
  }

  /**
   * Update an existing inspection document
   */
  static async updateInspection(
    inspectionId: string,
    data: Partial<InspectionSaveData>,
    tenantId: string,
    userId: string
  ): Promise<any> {
    // Calculate progress based on completed sections
    if (data.completedSections) {
      const totalSections = 15; // Adjust based on your wizard sections
      data.progress = Math.round((data.completedSections.length / totalSections) * 100);
    }

    const inspection = await InspectionModel.findOneAndUpdate(
      { 
        id: inspectionId, 
        tenantId,
        deleted: { $ne: true }
      },
      {
        ...data,
        last_updated: new Date(),
        updated_by: userId
      },
      { new: true }
    );

    return inspection;
  }

  /**
   * Get inspection by ID (with tenant validation)
   */
  static async getInspection(
    inspectionId: string,
    tenantId: string
  ): Promise<any> {
    return await InspectionModel.findOne({
      id: inspectionId,
      tenantId,
      deleted: { $ne: true }
    });
  }

  /**
   * List inspections with filters
   */
  static async listInspections(
    tenantId: string,
    filters: any = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
    } = {}
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      type: 'inspection',
      tenantId,
      deleted: { $ne: true }
    };

    // Apply filters - now working with dynamic structure
    if (filters.inspectionType) {
      query.inspectionType = Array.isArray(filters.inspectionType) 
        ? { $in: filters.inspectionType }
        : filters.inspectionType;
    }

    if (filters.workspaceId) {
      query.workspaceId = filters.workspaceId;
    }

    if (filters.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status;
    }

    // Dynamic field filters - these query formData fields
    if (filters.equipmentType) {
      query['formData.equipmentType'] = Array.isArray(filters.equipmentType)
        ? { $in: filters.equipmentType }
        : filters.equipmentType;
    }

    if (filters.equipmentId) {
      query['formData.equipmentId'] = new RegExp(filters.equipmentId, 'i');
    }

    if (filters.inspectorName) {
      query['formData.inspectorName'] = new RegExp(filters.inspectorName, 'i');
    }

    if (filters.location) {
      query['formData.location'] = new RegExp(filters.location, 'i');
    }

    // Date range filter - query formData.inspectionDate
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start || end) {
        query['formData.inspectionDate'] = {};
        if (start) query['formData.inspectionDate'].$gte = new Date(start);
        if (end) query['formData.inspectionDate'].$lte = new Date(end);
      }
    }

    // Progress filter
    if (filters.progressMin !== undefined || filters.progressMax !== undefined) {
      query.progress = {};
      if (filters.progressMin !== undefined) query.progress.$gte = filters.progressMin;
      if (filters.progressMax !== undefined) query.progress.$lte = filters.progressMax;
    }

    // Execute query
    const [data, total] = await Promise.all([
      InspectionModel.find(query)
        .sort(options.sort || { inspectionDate: -1 })
        .skip(skip)
        .limit(limit),
      InspectionModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Delete inspection (soft delete)
   */
  static async deleteInspection(
    inspectionId: string,
    tenantId: string,
    userId: string
  ): Promise<boolean> {
    const result = await InspectionModel.updateOne(
      { 
        id: inspectionId, 
        tenantId,
        deleted: { $ne: true }
      },
      {
        deleted: true,
        deleted_at: new Date(),
        deleted_by: userId
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Approve inspection
   */
  static async approveInspection(
    inspectionId: string,
    tenantId: string,
    userId: string
  ): Promise<any> {
    const inspection = await InspectionModel.findOneAndUpdate(
      {
        id: inspectionId,
        tenantId,
        status: 'completed',
        deleted: { $ne: true }
      },
      {
        status: 'approved',
        last_updated: new Date(),
        updated_by: userId
      },
      { new: true }
    );
    
    return inspection;
  }

  /**
   * Archive inspections
   */
  static async archiveInspections(
    inspectionIds: string[],
    tenantId: string,
    userId: string
  ): Promise<number> {
    const result = await InspectionModel.updateMany(
      {
        id: { $in: inspectionIds },
        tenantId,
        deleted: { $ne: true }
      },
      {
        status: 'archived',
        last_updated: new Date(),
        updated_by: userId
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get inspection statistics
   */
  static async getInspectionStats(
    tenantId: string,
    filters: any = {}
  ): Promise<any> {
    const baseMatch: any = {
      type: 'inspection',
      tenantId,
      deleted: { $ne: true }
    };

    // Apply filters
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start || end) {
        baseMatch['formData.inspectionDate'] = {};
        if (start) baseMatch['formData.inspectionDate'].$gte = new Date(start);
        if (end) baseMatch['formData.inspectionDate'].$lte = new Date(end);
      }
    }

    const stats = await InspectionModel.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          avgProgress: { $avg: '$progress' },
          totalCompletedOrApproved: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$status', 'completed'] }, { $eq: ['$status', 'approved'] }] },
                1,
                0
              ]
            }
          },
          overdue: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$status', 'completed'] },
                  { $ne: ['$status', 'approved'] },
                  { $lt: ['$progress', 100] }
                ]},
                1,
                0
              ]
            }
          },
          byType: {
            $push: {
              type: '$inspectionType',
              equipment: '$equipmentType'
            }
          }
        }
      }
    ]);

    // Calculate compliance rate
    if (stats[0]) {
      const result = stats[0];
      result.complianceRate = result.total > 0 ? (result.totalCompletedOrApproved / result.total) * 100 : 0;
      return result;
    }

    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      approved: 0,
      avgProgress: 0,
      complianceRate: 0,
      overdue: 0
    };
  }

  /**
   * Save wizard progress - fully dynamic based on metadata
   */
  static async saveWizardProgress(
    inspectionId: string,
    sectionId: string,
    sectionData: any,
    tenantId: string,
    userId: string
  ): Promise<any> {
    const inspection = await this.getInspection(inspectionId, tenantId);
    
    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Update completed sections
    const completedSections = inspection.completedSections || [];
    if (!completedSections.includes(sectionId)) {
      completedSections.push(sectionId);
    }

    // Update sections data
    const sections = inspection.sections || {};
    sections[sectionId] = {
      sectionId,
      title: sectionData.title || sectionId,
      completed: true,
      data: sectionData
    };

    // Merge all form fields into formData
    const formData = inspection.formData || {};
    
    // If section contains form fields, merge them
    if (sectionData.fields) {
      Object.assign(formData, sectionData.fields);
    }
    
    // If section contains grid data, update grids
    const grids = inspection.grids || {};
    if (sectionData.grids) {
      Object.assign(grids, sectionData.grids);
    }

    // If section contains AI analysis, update aiAnalysis
    const aiAnalysis = inspection.aiAnalysis || {};
    if (sectionData.aiAnalysis) {
      aiAnalysis[sectionId] = {
        analysisDate: new Date(),
        result: sectionData.aiAnalysis,
        model: sectionData.model,
        metadata: sectionData.metadata
      };
    }

    // Calculate progress
    const totalSections = sectionData.totalSections || 10; // Get from metadata
    const progress = Math.round((completedSections.length / totalSections) * 100);

    // Build updates object
    const updates: any = {
      completedSections,
      lastSectionCompleted: sectionId,
      sections,
      formData,
      grids,
      aiAnalysis,
      wizardState: sectionData.wizardState,
      progress,
      status: 'in_progress'
    };

    return await this.updateInspection(inspectionId, updates, tenantId, userId);
  }

  /**
   * Run aggregation on inspection documents
   */
  static async runAggregation(
    tenantId: string,
    aggregationConfig: any,
    filters: any = {}
  ): Promise<any> {
    try {
      const pipeline: any[] = [];
      
      // Base match stage - always filter by tenant and type
      const matchStage: any = {
        tenantId,
        deleted: { $ne: true }
      };

      // Add base filter from config
      if (aggregationConfig.baseFilter) {
        Object.assign(matchStage, aggregationConfig.baseFilter);
      }

      // Apply field mappings for filters
      if (aggregationConfig.fieldMappings && filters) {
        Object.entries(aggregationConfig.fieldMappings).forEach(([filterKey, dbField]) => {
          if (filters[filterKey]) {
            const fieldPath = dbField as string;
            const filterValue = filters[filterKey];
            
            // Handle date range filters
            if (filterKey === 'date_range' && Array.isArray(filterValue) && filterValue.length === 2) {
              matchStage[fieldPath] = {
                $gte: new Date(filterValue[0]),
                $lte: new Date(filterValue[1])
              };
            }
            // Handle array filters (multiselect)
            else if (Array.isArray(filterValue)) {
              matchStage[fieldPath] = { $in: filterValue };
            }
            // Handle single value filters
            else {
              matchStage[fieldPath] = filterValue;
            }
          }
        });
      }

      pipeline.push({ $match: matchStage });

      // If custom pipeline is provided, use it
      if (aggregationConfig.pipeline) {
        pipeline.push(...aggregationConfig.pipeline);
      }
      // Otherwise use groupBy configuration
      else if (aggregationConfig.groupBy) {
        const groupStage: any = {
          _id: aggregationConfig.groupBy._id
        };

        // Add field aggregations
        if (aggregationConfig.groupBy.fields) {
          Object.entries(aggregationConfig.groupBy.fields).forEach(([fieldName, fieldConfig]: [string, any]) => {
            groupStage[fieldName] = fieldConfig.expression;
          });
        }

        pipeline.push({ $group: groupStage });

        // Add sorting if specified
        if (aggregationConfig.sort) {
          pipeline.push({ $sort: aggregationConfig.sort });
        }
      }
const results = await InspectionModel.aggregate(pipeline);
      
      return {
        success: true,
        data: results,
        config: aggregationConfig.name
      };
    } catch (error: any) {
      console.error('Aggregation error:', error);
      throw new Error(`Aggregation failed: ${error.message}`);
    }
  }
}

export default InspectionService;
