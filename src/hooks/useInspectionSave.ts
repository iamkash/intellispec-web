/**
 * Hook for saving inspection data
 */

import { message } from 'antd';
import { useCallback, useState } from 'react';

interface InspectionSaveData {
  inspectionId?: string;
  inspectionType?: string;
  workspaceId?: string;
  status?: string;
  progress?: number;
  formData?: Record<string, any>;
  sections?: any[];
  grids?: Record<string, any[]>;
  aiAnalysis?: Record<string, any>;
  attachments?: any[];
  wizardState?: any;
  completedSections?: string[];
  [key: string]: any;
}

export const useInspectionSave = () => {
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveInspection = useCallback(async (data: InspectionSaveData) => {
    try {
      setSaving(true);

      // Extract tenant ID from authenticated user (required)
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      let tenantId: string = 'default-tenant'; // Default fallback
      let userId: string = 'debug-user'; // Default fallback

      if (!userStr || !token) {
        console.error('❌ No authentication data found - cannot save inspection');
        console.error('userStr exists:', !!userStr);
        console.error('token exists:', !!token);
        console.error('Available localStorage keys:', Object.keys(localStorage));

        // For debugging, use default values
        console.warn('⚠️ Using default values for debugging');
      }

      if (userStr) {
        try {
          const user = JSON.parse(userStr);

          tenantId = user.tenantId || user.tenant_id || user.orgId || user.organizationId || user.companyId || user.tenantSlug;
          userId = user.userId || user.id || user.sub || user.user_id;
if (!tenantId) {
            console.error('❌ User authenticated but no tenant ID found');

            // For debugging, allow with default tenant
            console.warn('⚠️ Using default-tenant for debugging');
            tenantId = 'default-tenant';
          }

          if (!userId) {
            console.warn('⚠️ No user ID found, using fallback');
            userId = 'debug-user';
          }
        } catch (error) {
          console.error('❌ Failed to parse user authentication data');
          console.warn('⚠️ JSON parse failed, using default values');
          tenantId = 'default-tenant';
          userId = 'debug-user';
        }
      }

      const endpoint = data.inspectionId
        ? `/api/inspections/${data.inspectionId}`
        : '/api/inspections';

      const method = data.inspectionId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save inspection: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!data.inspectionId && result.id) {
        setInspectionId(result.id);
      }

      message.success('Inspection saved successfully');
      return result;
    } catch (error) {
      console.error('Error saving inspection:', error);
      message.error('Failed to save inspection');
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveSectionProgress = useCallback(async (
    sectionId: string,
    sectionData: any,
    wizardData?: any
  ) => {
    console.log('[saveSectionProgress] Called with:', { sectionId, sectionData, wizardData });
    try {
      setSaving(true);

      // Extract tenant ID from authenticated user (required)
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      let tenantId: string = 'default-tenant'; // Default fallback
      let userId: string = 'debug-user'; // Default fallback

      if (!userStr || !token) {
        console.error('❌ No authentication data found - cannot save progress');
        console.error('userStr exists:', !!userStr);
        console.error('token exists:', !!token);
        console.error('Available localStorage keys:', Object.keys(localStorage));

        // For debugging, use default values
        console.warn('⚠️ Using default values for debugging');
      }

      if (userStr) {
        try {
          const user = JSON.parse(userStr);

          tenantId = user.tenantId || user.tenant_id || user.orgId || user.organizationId || user.companyId || user.tenantSlug;
          userId = user.userId || user.id || user.sub || user.user_id;
if (!tenantId) {
            console.error('❌ User authenticated but no tenant ID found');

            // For debugging, allow with default tenant
            console.warn('⚠️ Using default-tenant for debugging');
            tenantId = 'default-tenant';
          }

          if (!userId) {
            console.warn('⚠️ No user ID found, using fallback');
            userId = 'debug-user';
          }
        } catch (error) {
          console.error('❌ Failed to parse user authentication data');
          console.warn('⚠️ JSON parse failed, using default values');
          tenantId = 'default-tenant';
          userId = 'debug-user';
        }
      }

      // Use the progress endpoint which handles both create and update
      const endpoint = '/api/inspections/progress';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-User-ID': userId
        },
        body: JSON.stringify({
          inspectionId,
          sectionId,
          sectionData,
          wizardData
        })
      });

      if (!response.ok) {
        let errorMessage = `Failed to save progress: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON (like 413 errors), use status text
          if (response.status === 413) {
            errorMessage = 'Request too large - please reduce image size or remove some images';
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Update inspection ID if this was a new inspection
      if (!inspectionId && result.id) {
        setInspectionId(result.id);
      }
      
      console.log(`[saveSectionProgress] Backend returned processed data:`, {
        hasResult: !!result,
        resultKeys: Object.keys(result || {}),
        hasSections: !!result?.sections,
        sectionsCount: result?.sections?.length || 0,
        hasWizardState: !!result?.wizardState,
        wizardStateSectionsCount: result?.wizardState?.sections?.length || 0,
        sampleSection: result?.sections?.[0] ? {
          id: result.sections[0].id,
          hasImages: !!result.sections[0].images,
          imagesCount: result.sections[0].images?.length || 0,
          sampleImage: result.sections[0].images?.[0] ? {
            hasGridfsId: !!result.sections[0].images[0].gridfsId,
            urlType: result.sections[0].images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
          } : null
        } : null
      });
      
      message.success('Progress saved');
      return result;
    } catch (error) {
      console.error('Error saving progress:', error);
      message.error('Failed to save progress');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [inspectionId]);

  return {
    inspectionId,
    saving,
    saveInspection,
    saveSectionProgress,
    setInspectionId
  };
};