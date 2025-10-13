import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { httpClient } from '../services/HttpClient';

interface WizardRecordOptions {
  documentType?: string;
  workspaceId?: string;
}

interface WizardRecordPayload {
  recordId?: string;
  documentType?: string;
  workspaceId?: string;
  sectionId?: string;
  sectionData?: any;
  wizardState?: any;
  documentSummary?: Record<string, any>;
  summary?: Record<string, any>;
  inspectionType?: string;
  inspectionTypeLabel?: string;
  detectedEquipmentType?: string;
  [key: string]: any;
}

interface SaveResult {
  id?: string;
  _id?: string;
  sections?: any[];
  wizardState?: any;
  documentSummary?: Record<string, any>;
  inspectionType?: string;
  inspectionTypeLabel?: string;
  detectedEquipmentType?: string;
  [key: string]: any;
}

const mergeSummaryFields = (target: Record<string, any>, summary?: Record<string, any>) => {
  if (!summary || typeof summary !== 'object') return;
  Object.entries(summary).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      target[key] = value;
    }
  });
};

const resolveDocumentId = (result: SaveResult | Response): string | undefined => {
  if (!result) return undefined;
  if (result instanceof Response) return undefined;
  return (result.id as string) || (result._id as string) || (result as any)?.data?.id;
};

export const useWizardRecordSave = (options?: WizardRecordOptions) => {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const documentType = useMemo(() => options?.documentType || 'inspection', [options?.documentType]);
  const workspaceId = options?.workspaceId;

  const persistDocument = useCallback(async (payload: WizardRecordPayload, id?: string) => {
    const type = payload.documentType || payload.type || documentType;
    const body = {
      ...payload,
      type,
      workspaceId: payload.workspaceId || workspaceId,
    };

    const summaryFromSection = payload.sectionData?.documentSummary;
    const summaryFromWizard = payload.wizardState?.documentSummary;
    const declaredSummary = payload.documentSummary || payload.summary;

    mergeSummaryFields(body, summaryFromSection);
    mergeSummaryFields(body, summaryFromWizard);
    mergeSummaryFields(body, declaredSummary);

    if (summaryFromSection || summaryFromWizard || declaredSummary) {
      body.documentSummary = {
        ...(summaryFromWizard || {}),
        ...(summaryFromSection || {}),
        ...(declaredSummary || {})
      };
    }

    const url = id ? `/api/documents/${id}` : '/api/documents';
    const method = id ? 'put' : 'post';

    const response = await (method === 'put'
      ? httpClient.put(url, body)
      : httpClient.post(url, body));

    if (!response.ok) {
      let errorMessage = `Failed to save record: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {}
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch {
      return {};
    }
  }, [documentType, workspaceId]);

  const saveRecord = useCallback(async (payload: WizardRecordPayload) => {
    try {
      setSaving(true);
      const targetId = payload.recordId ?? recordId ?? undefined;
      const result = await persistDocument(payload, targetId);
      const newId = resolveDocumentId(result) || targetId;
      if (newId && newId !== recordId) {
        setRecordId(newId);
      }
      message.success('Record saved successfully');
      return result;
    } catch (error) {
      console.error('[useWizardRecordSave] saveRecord failed:', error);
      message.error((error as Error)?.message || 'Failed to save record');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [persistDocument, recordId]);

  const saveRecordProgress = useCallback(async (
    sectionId: string,
    sectionData: any,
    wizardState?: any
  ) => {
    try {
      setSaving(true);

      const summaryFields: Record<string, any> = {};
      const combinedSummarySources = {
        ...(wizardState?.documentSummary || {}),
        ...(sectionData?.documentSummary || {})
      };
      Object.entries(combinedSummarySources).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          summaryFields[key] = value;
        }
      });

      const cloneSection = (data: any) => {
        if (!data) return data;
        try {
          const structuredCloneFn = (globalThis as any)?.structuredClone;
          if (typeof structuredCloneFn === 'function') {
            return structuredCloneFn(data);
          }
        } catch {}
        try {
          return JSON.parse(JSON.stringify(data));
        } catch {
          return { ...data };
        }
      };

      const sectionPayload = cloneSection(sectionData) || {};
      if (Object.keys(summaryFields).length > 0) {
        sectionPayload.documentSummary = {
          ...(sectionPayload.documentSummary || {}),
          ...summaryFields
        };
        mergeSummaryFields(sectionPayload, summaryFields);
      }

      const normalizedWizardState = {
        ...(cloneSection(wizardState) || {}),
        lastSavedSectionId: sectionId,
        updatedAt: new Date().toISOString(),
        documentSummary: Object.keys(summaryFields).length > 0
          ? {
              ...(wizardState?.documentSummary || {}),
              ...summaryFields
            }
          : wizardState?.documentSummary
      };

      if (summaryFields.inspectionType) {
        (normalizedWizardState as any).inspectionType = summaryFields.inspectionType;
      }
      if (summaryFields.inspectionTypeLabel) {
        (normalizedWizardState as any).inspectionTypeLabel = summaryFields.inspectionTypeLabel;
      }
      if (summaryFields.detectedEquipmentType) {
        (normalizedWizardState as any).detectedEquipmentType = summaryFields.detectedEquipmentType;
      }

      const payload: WizardRecordPayload = {
        recordId: recordId ?? undefined,
        documentType,
        workspaceId,
        sectionId,
        sectionData: sectionPayload,
        wizardState: normalizedWizardState,
        globalFormData: wizardState?.globalFormData,
        recordContext: wizardState?.recordContext,
        analysisData: wizardState?.analysisData,
        completedSteps: wizardState?.completedSteps,
        currentStep: wizardState?.currentStep,
      };

      if (Object.keys(summaryFields).length > 0) {
        payload.documentSummary = summaryFields;
        mergeSummaryFields(payload as Record<string, any>, summaryFields);
      }

      payload.inspectionType = payload.inspectionType
        || sectionPayload.inspectionType
        || normalizedWizardState.documentSummary?.inspectionType
        || normalizedWizardState.inspectionType
        || wizardState?.inspectionType;

      payload.inspectionTypeLabel = payload.inspectionTypeLabel
        || sectionPayload.inspectionTypeLabel
        || normalizedWizardState.documentSummary?.inspectionTypeLabel
        || normalizedWizardState.inspectionTypeLabel
        || wizardState?.inspectionTypeLabel;

      payload.detectedEquipmentType = payload.detectedEquipmentType
        || sectionPayload.detectedEquipmentType
        || normalizedWizardState.documentSummary?.detectedEquipmentType
        || normalizedWizardState.detectedEquipmentType
        || wizardState?.detectedEquipmentType;

      if (sectionPayload.grids) {
        payload.grids = {
          ...(payload.grids || {}),
          ...sectionPayload.grids
        };
      }

      const result = await persistDocument(payload, recordId ?? undefined);
      const newId = resolveDocumentId(result);
      if (newId && newId !== recordId) {
        setRecordId(newId);
      }

      const response: SaveResult = {
        ...(typeof result === 'object' ? result : {}),
        id: newId || recordId || undefined,
        sections: normalizedWizardState?.sections || [],
        wizardState: normalizedWizardState
      };

      console.debug('[useWizardRecordSave] saveRecordProgress result:', {
        id: response.id,
        sectionsCount: response.sections?.length || 0
      });

      message.success('Progress saved');
      return response;
    } catch (error) {
      console.error('[useWizardRecordSave] saveRecordProgress failed:', error);
      message.error((error as Error)?.message || 'Failed to save progress');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [documentType, persistDocument, recordId, workspaceId]);

  return {
    recordId,
    saving,
    saveRecord,
    saveRecordProgress,
    setRecordId
  };
};
