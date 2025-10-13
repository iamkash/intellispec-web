import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useWizardRecordSave } from '../../../../../../hooks/useWizardRecordSave';
import { useOpenAI } from '../../../../../../hooks/useOpenAI';
import { getOpenAIConfig } from '../../../../../../utils/config';
import { BaseGadget } from '../../../base';
import { AIAnalysisWizardGadget } from '../AIAnalysisWizardGadget';
import type { AIAnalysisWizardConfig, AIAnalysisWizardData } from '../AIAnalysisWizardGadget.types';
import { getStepItems } from '../utils/iconUtils';
import {
  convertRecordToWizardData,
  getStableRestoreIdFromUrl,
  tryFetchRecordFromApi
} from '../utils/restore';
import { InputStep } from './InputStep';
import { PDFStep } from './PDFStep';
import { SectionStep } from './SectionStep';
import { WizardFooter } from './WizardFooter';
import { WizardHeader } from './WizardHeader';
import { WizardSidebar } from './WizardSidebar';

const DEFAULT_RECORD_RESPONSE_SELECTOR = 'data.0';
const recordFetchCache = new Map<string, Promise<any>>();

const toPathSegments = (selector: string): string[] =>
  selector
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

const getTemplateTokenValue = (context: Record<string, any>, path: string) => {
  if (!path) return undefined;

  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<any>((acc, segment) => {
      if (acc === undefined || acc === null) return undefined;

      if (Array.isArray(acc)) {
        const index = Number(segment);
        if (Number.isNaN(index)) {
          return undefined;
        }
        return acc[index];
      }

      return acc?.[segment];
    }, context);
};

const resolveTemplateValue = (value: any, context: Record<string, any>): any => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\{[^}]+\}$/.test(trimmed)) {
      const tokenKey = trimmed.slice(1, -1).trim();
      const resolved = getTemplateTokenValue(context, tokenKey);
      return resolved ?? '';
    }

    return value.replace(/\{([^}]+)\}/g, (_match, tokenPath) => {
      const resolved = getTemplateTokenValue(context, String(tokenPath).trim());
      if (resolved === undefined || resolved === null) {
        return '';
      }

      if (typeof resolved === 'object') {
        try {
          return JSON.stringify(resolved);
        } catch {
          return '';
        }
      }

      return String(resolved);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, context));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce<Record<string, any>>((acc, [k, v]) => {
      const resolved = resolveTemplateValue(v, context);
      if (resolved !== undefined) {
        acc[k] = resolved;
      }
      return acc;
    }, {});
  }

  return value;
};

const selectResponseData = (payload: any, selector?: string) => {
  if (!selector) return payload;
  const path = toPathSegments(selector);
  return path.reduce<any>((acc, segment) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }

    if (Array.isArray(acc)) {
      const index = Number(segment);
      if (Number.isNaN(index)) {
        return undefined;
      }
      return acc[index];
    }

    return acc?.[segment];
  }, payload);
};

const getNestedValue = (data: any, path?: string) => {
  if (!path || !data) return undefined;
  const segments = toPathSegments(path);

  return segments.reduce<any>((acc, segment) => {
    if (acc === undefined || acc === null) return undefined;

    if (Array.isArray(acc)) {
      const index = Number(segment);
      if (Number.isNaN(index)) {
        return undefined;
      }
      return acc[index];
    }

    return acc?.[segment];
  }, data);
};

const collectUrlParamContext = (populationConfig: any) => {
  const emptyResult = {
    templateContext: { params: {}, query: {} } as Record<string, any>,
    hasRequiredParams: true,
    missingRequired: [] as string[]
  };

  if (typeof window === 'undefined') {
    return emptyResult;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const query: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  });

  const definitions = Array.isArray(populationConfig?.urlParams) ? populationConfig.urlParams : [];
  const params: Record<string, string | string[]> = {};
  const missingRequired: string[] = [];

  if (definitions.length > 0) {
    definitions.forEach((def: any) => {
      if (!def?.name) return;

      const queryKey = def.queryParam || def.name;
      const rawValues = searchParams.getAll(queryKey);
      let resolvedValue: any;

      if (rawValues.length > 0) {
        resolvedValue = def.allowMultiple ? rawValues : rawValues[0];
      } else if (def.defaultValue !== undefined) {
        resolvedValue = def.allowMultiple
          ? def.defaultValue
          : Array.isArray(def.defaultValue)
            ? def.defaultValue[0]
            : def.defaultValue;
      }

      if (resolvedValue !== undefined) {
        params[def.name] = resolvedValue;
      } else if (def.required) {
        missingRequired.push(def.name);
      }
    });
  }

  const templateContext: Record<string, any> = {
    params,
    query,
    searchParams,
    urlSearch: window.location.search
  };

  Object.entries(params).forEach(([key, value]) => {
    if (templateContext[key] === undefined) {
      templateContext[key] = value;
    }
  });

  templateContext.queryParams = query;

  const hasDefinitions = definitions.length > 0;
  const hasAnyParamValues =
    Object.keys(params).length > 0 ||
    definitions.every((def: any) => !def?.required);
  const hasRequiredParams =
    !hasDefinitions || (missingRequired.length === 0 && hasAnyParamValues);

  return {
    templateContext,
    hasRequiredParams,
    missingRequired
  };
};

const buildRecordFetchRequest = (
  populationConfig: any,
  templateContext: Record<string, any>
): { url: string; options: RequestInit } => {
  const requestConfig = populationConfig?.request;
  const headers: Record<string, string> = {
    ...(requestConfig?.headers || {})
  };

  Object.entries(headers).forEach(([key, value]) => {
    headers[key] = String(resolveTemplateValue(value, templateContext) ?? value);
  });

  let urlTemplate = requestConfig?.url || populationConfig?.apiEndpoint;
  if (!urlTemplate) {
    throw new Error('recordDataPopulation requires request.url or apiEndpoint');
  }

  const resolvedUrl = resolveTemplateValue(urlTemplate, templateContext);
  let url = typeof resolvedUrl === 'string' ? resolvedUrl : String(resolvedUrl ?? '');

  let method = (requestConfig?.method || 'GET').toUpperCase();
  let body: BodyInit | undefined;

  if (requestConfig?.url) {
    if (requestConfig.query) {
      const resolvedQuery = resolveTemplateValue(requestConfig.query, templateContext);
      if (resolvedQuery && typeof resolvedQuery === 'object') {
        const params = new URLSearchParams();
        Object.entries(resolvedQuery).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            return;
          }

          if (Array.isArray(value)) {
            value.forEach((entry) => {
              if (entry !== undefined && entry !== null) {
                params.append(key, String(entry));
              }
            });
          } else {
            params.append(key, String(value));
          }
        });

        const queryString = params.toString();
        if (queryString) {
          url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
        }
      }
    }

    if (method !== 'GET' && requestConfig.body !== undefined) {
      const resolvedBody = resolveTemplateValue(requestConfig.body, templateContext);

      if (typeof resolvedBody === 'string') {
        body = resolvedBody;
      } else if (resolvedBody !== undefined && resolvedBody !== null) {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
        body = JSON.stringify(resolvedBody);
      }
    }
  } else {
    const params = new URLSearchParams();
    const paramValues = templateContext.params || {};

    Object.entries(paramValues).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry !== undefined && entry !== null) {
            params.append(key, String(entry));
          }
        });
      } else {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    if (queryString) {
      url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
    }

    method = 'GET';
  }

  const options: RequestInit = {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body
  };

  return { url, options };
};

const extractPopulatableFields = (sections: any[] = []) => {
  const fields: any[] = [];

  sections.forEach((section: any) => {
    const groups = section?.form?.groups || [];
    groups.forEach((group: any) => {
      const groupFields = group?.fields || [];
      groupFields.forEach((field: any) => {
        if (field?.populateFromAsset) {
          fields.push(field);
        }
      });
    });
  });

  return fields;
};

const getNestedValueSafe = (source: any, path: string): any => {
  if (!source || !path) return undefined;
  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean);
  let current: any = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key];
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[Number(index)];
    } else {
      current = current?.[segment];
    }
  }

  return current;
};

const pickFirstAvailableValue = (sources: Array<Record<string, any>>, candidatePaths: string[]): any => {
  for (const path of candidatePaths) {
    for (const source of sources) {
      const value = getNestedValueSafe(source, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  return undefined;
};

const normalizeDateValue = (value: any): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
};

const toTitleCase = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const lookupTypeMapValue = (type?: string, typeMap?: Record<string, string>): string | undefined => {
  if (!typeMap || !type) return undefined;
  if (typeMap[type]) return typeMap[type];
  const lower = type.toLowerCase();
  const matchedKey = Object.keys(typeMap).find((key) => key.toLowerCase() === lower);
  return matchedKey ? typeMap[matchedKey] : undefined;
};

const normalizeInspectionTypeValue = (
  rawType?: string,
  typeMap?: Record<string, string>,
  defaultType?: string
): string | undefined => {
  if (rawType) {
    const trimmed = rawType.trim();
    const lower = trimmed.toLowerCase();

    if (typeMap) {
      const directMatch = Object.keys(typeMap).find((key) => key.toLowerCase() === lower);
      if (directMatch) {
        return directMatch;
      }

      const partialMatch = Object.keys(typeMap).find((key) => lower.startsWith(key.toLowerCase()));
      if (partialMatch) {
        return partialMatch;
      }
    }

    return lower;
  }

  return defaultType;
};

const resolveInspectionTypeLabel = (
  normalizedType?: string,
  rawType?: string,
  typeMap?: Record<string, string>,
  fallbackLabel?: string
): string | undefined => {
  const fromNormalized = lookupTypeMapValue(normalizedType, typeMap);
  if (fromNormalized) {
    return fromNormalized;
  }

  const fromRaw = lookupTypeMapValue(rawType, typeMap);
  if (fromRaw) {
    return fromRaw;
  }

  return fallbackLabel || toTitleCase(normalizedType || rawType);
};

interface BuildInspectionSummaryParams {
  recordContext?: Record<string, any>;
  globalFormData?: Record<string, any>;
  finalFormData?: Record<string, any>;
  previousSummary?: Record<string, any>;
  rawTypeValue?: string;
  mappedTypeValue?: string;
  normalizedType?: string;
  typeLabel?: string;
  resolvedIdValue?: string;
  resolvedOwnerValue?: string;
  resolvedDateValue?: any;
  defaultDomainType?: string;
  domainTypeMap?: Record<string, string>;
  sectionsCount: number;
  currentStep: number;
  completedSteps: number[];
}

const buildInspectionSummary = ({
  recordContext = {},
  globalFormData = {},
  finalFormData = {},
  previousSummary = {},
  rawTypeValue,
  mappedTypeValue,
  normalizedType,
  typeLabel,
  resolvedIdValue,
  resolvedOwnerValue,
  resolvedDateValue,
  defaultDomainType,
  domainTypeMap,
  sectionsCount,
  currentStep,
  completedSteps
}: BuildInspectionSummaryParams): Record<string, any> => {
  const sources = [finalFormData, globalFormData, recordContext, previousSummary].filter(Boolean);
  const summary: Record<string, any> = { ...(previousSummary || {}) };

  const ensureValue = (key: string, value: any) => {
    if (value !== undefined && value !== null && value !== '') {
      summary[key] = value;
    }
  };

  const canonicalType = normalizedType ||
    normalizeInspectionTypeValue(rawTypeValue, domainTypeMap, defaultDomainType) ||
    pickFirstAvailableValue(sources, ['inspectionType', 'inspection_type']) ||
    defaultDomainType;
  ensureValue('inspectionType', canonicalType);

  const resolvedTypeLabel = resolveInspectionTypeLabel(
    canonicalType,
    rawTypeValue,
    domainTypeMap,
    typeLabel || mappedTypeValue
  ) ||
    pickFirstAvailableValue(sources, ['inspectionTypeLabel', 'equipmentTypeLabel', 'equipmentType']);

  if (resolvedTypeLabel) {
    ensureValue('inspectionTypeLabel', resolvedTypeLabel);
    ensureValue('equipmentType', resolvedTypeLabel);
    ensureValue('equipmentTypeLabel', resolvedTypeLabel);
  }

  if (rawTypeValue) {
    ensureValue('detectedEquipmentType', rawTypeValue);
    ensureValue('equipmentSubtype', rawTypeValue);
  }

  ensureValue('equipmentId',
    resolvedIdValue ||
    pickFirstAvailableValue(sources, ['equipmentId', 'equipment_id', 'equipment.id', 'assetId', 'asset_id']));

  const equipmentName =
    pickFirstAvailableValue(sources, ['equipmentName', 'equipment_name', 'assetName', 'asset_name', 'name', 'asset.name']);
  ensureValue('equipmentName', equipmentName);
  ensureValue('assetName', equipmentName);

  ensureValue('assetId',
    pickFirstAvailableValue(sources, ['assetId', 'asset_id', 'asset.id']));

  ensureValue('assetGroupId',
    pickFirstAvailableValue(sources, ['assetGroupId', 'asset_group_id', 'assetGroup.id']));

  ensureValue('assetGroupName',
    pickFirstAvailableValue(sources, ['assetGroupName', 'asset_group_name', 'assetGroup.name']));

  ensureValue('company_id',
    pickFirstAvailableValue(sources, ['company_id', 'companyId', 'company.id']));

  ensureValue('companyName',
    pickFirstAvailableValue(sources, ['companyName', 'company_name', 'company.name']));

  ensureValue('facilityName',
    pickFirstAvailableValue(sources, [
      'facilityName',
      'facility_name',
      'siteName',
      'site_name',
      'site.name',
      'location.facility.name'
    ]));

  ensureValue('site_id',
    pickFirstAvailableValue(sources, ['site_id', 'siteId', 'site.id']));

  ensureValue('siteName',
    pickFirstAvailableValue(sources, ['siteName', 'site_name', 'site.name']));

  ensureValue('inspectorName',
    resolvedOwnerValue ||
    pickFirstAvailableValue(sources, ['inspectorName', 'inspector_name', 'inspector.name']));

  const inspectionDate =
    normalizeDateValue(resolvedDateValue) ||
    normalizeDateValue(pickFirstAvailableValue(sources, ['inspectionDate', 'inspection_date', 'date']));
  ensureValue('inspectionDate', inspectionDate);

  const totalSteps = Math.max(sectionsCount, 1);
  const completedSet = new Set(completedSteps || []);
  if (!completedSet.has(currentStep)) {
    completedSet.add(currentStep);
  }
  const progress = Math.round((completedSet.size / totalSteps) * 100);
  ensureValue('progress', progress);

  if (!summary.status) {
    ensureValue('status', progress >= 100 ? 'completed' : 'in_progress');
  } else if (progress >= 100 && summary.status !== 'completed') {
    summary.status = 'completed';
  }

  return summary;
};

interface GenericWizardRendererProps { 
  gadget: AIAnalysisWizardGadget; 
  config: AIAnalysisWizardConfig; 
}

export const GenericWizardRenderer: React.FC<GenericWizardRendererProps> = ({ gadget, config }) => {
  const { user } = useAuth();
  const stepsSections = config?.steps?.sections;
  const sections = useMemo(() => stepsSections ?? [], [stepsSections]);
  const populatableFields = useMemo(() => extractPopulatableFields(sections), [sections]);
  const domainConfig = useMemo(() => config.domainConfig || {}, [config.domainConfig]);
  const domainFields = useMemo(() => domainConfig.fields || {}, [domainConfig.fields]);
  const domainOutputKeys = useMemo(() => domainConfig.outputKeys || {}, [domainConfig.outputKeys]);
  const domainPayloadKeys = useMemo(() => domainConfig.payloadKeys || {}, [domainConfig.payloadKeys]);
  const domainTypeMap = useMemo(() => domainConfig.typeMap || {}, [domainConfig.typeMap]);
  const navigationConfig = useMemo(() => domainConfig.navigation || {}, [domainConfig.navigation]);
  const expectedPayloadType = domainConfig.payloadType;
  const defaultDomainType = domainConfig.defaultType || '';
  
  console.log('[GenericWizardRenderer] Config analysis:', {
    hasConfig: !!config,
    hasSteps: !!config.steps,
    hasSections: !!config.steps?.sections,
    sectionsCount: sections.length,
    sampleSections: sections.slice(0, 5).map((s: any) => ({
      id: s?.id,
      title: s?.title,
      hasForm: !!s?.form,
      formGroupsCount: s?.form?.groups?.length || 0,
      hasGrid: !!(s as any)?.grid,
      gridTitle: (s as any)?.grid?.title
    }))
  });
  
  // SIMPLE STATE MANAGEMENT - React owns all state
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wizardData, setWizardData] = useState<AIAnalysisWizardData>({
    currentStep: 0,
    completedSteps: [],
    sections: [],
    voiceData: {},
    imageData: [],
    analysisData: {},
    documentSummary: {}
  });
  const hasInitialisedRef = useRef(false);

  const { saveRecordProgress, setRecordId } = useWizardRecordSave();
  const openAI = useOpenAI(getOpenAIConfig());

  // Asset data population function
  const populateRecordData = useCallback(
    async (populationConfig: any, templateContext: Record<string, any>) => {
      try {
        const { url, options } = buildRecordFetchRequest(populationConfig, templateContext);
        const shouldCache = populationConfig?.cache !== false;
        const cacheKey = shouldCache ? `${url}|${JSON.stringify(templateContext.params || {})}` : undefined;

        let payload: any;

        if (shouldCache && cacheKey && recordFetchCache.has(cacheKey)) {
          payload = await recordFetchCache.get(cacheKey)!;
        } else {
          const fetchPromise = (async () => {
            try {
              const response = await BaseGadget.makeAuthenticatedFetch(url, options);

              if (!response.ok) {
                throw new Error(`Failed to fetch record data: ${response.statusText}`);
              }

              return await response.json();
            } catch (error) {
              if (shouldCache && cacheKey) {
                recordFetchCache.delete(cacheKey);
              }
              throw error;
            }
          })();

          if (shouldCache && cacheKey) {
            recordFetchCache.set(cacheKey, fetchPromise);
          }

          payload = await fetchPromise;
        }

        const selector = populationConfig?.responseSelector || DEFAULT_RECORD_RESPONSE_SELECTOR;
        const selected = selectResponseData(payload, selector);
        const recordData = selected ?? payload?.data ?? payload;

        if (recordData) {
          console.log('[Wizard] Record data loaded:', recordData);

          const populatedFormData: Record<string, any> = {};
          const disabledFields: string[] = [];

          populatableFields.forEach((field: any) => {
            const fieldPath = field?.populateFromAsset;
            if (!fieldPath) return;

            const recordValue =
              getNestedValue(recordData, fieldPath) ?? recordData?.[fieldPath];

            if (recordValue !== undefined && recordValue !== null && recordValue !== '') {
              populatedFormData[field.id] = recordValue;
              if (populationConfig?.disablePopulatedFields) {
                disabledFields.push(field.id);
              }
            }
          });

          setWizardData(prev => {
            const nextDisabledFields = populationConfig?.disablePopulatedFields
              ? Array.from(new Set([...(prev.disabledFields || []), ...disabledFields]))
              : prev.disabledFields;

            const nextData = {
              ...prev,
              globalFormData: {
                ...prev.globalFormData,
                ...populatedFormData
              },
              disabledFields: nextDisabledFields,
              recordContext: recordData,
              recordParams: templateContext.params || {}
            };

            if (typeof gadget.updateWizardData === 'function') {
              gadget.updateWizardData(nextData);
            }
            return nextData;
          });

          console.log('[Wizard] Form populated with record data:', populatedFormData);
          if (populationConfig?.disablePopulatedFields) {
            console.log('[Wizard] Disabled fields:', disabledFields);
          }
        } else {
          console.warn(
            '[Wizard] Record data population returned empty result.',
            selector ? `selector=${selector}` : undefined
          );
        }
      } catch (error) {
        console.error('[Wizard] Error populating record data:', error);
      }
    },
    [gadget, populatableFields]
  );

  // SIMPLE DATA LOADING - Load data first, then render
  useEffect(() => {
    if (hasInitialisedRef.current) return;
    hasInitialisedRef.current = true;

    const loadData = async () => {
      try {
        // Check if we need to restore an existing record
        const restoreRecordId = getStableRestoreIdFromUrl();
        
        if (restoreRecordId) {
          console.log('[Wizard] Loading existing record:', restoreRecordId);
          const payload = await tryFetchRecordFromApi(restoreRecordId);
          const recordPayload = payload?.data ? payload.data : payload;
          
          const recordType = recordPayload?.type || recordPayload?.documentType;
          if (recordPayload && (!expectedPayloadType || recordType === expectedPayloadType)) {
            // Convert stored data to wizard format
            const converted = convertRecordToWizardData(recordPayload);
            
            const wizardDataToSet = {
              currentStep: converted.currentStep || 0,
              completedSteps: converted.completedSteps || [],
              sections: converted.sections || [],
              voiceData: converted.voiceData || {},
              imageData: converted.imageData || [],
              analysisData: converted.analysisData || {},
              inspectionType: converted.inspectionType,
              inspectionTypeLabel: converted.inspectionTypeLabel,
              detectedEquipmentType: converted.detectedEquipmentType,
              // CRITICAL FIX: Include globalFormData for field value lookup
              globalFormData: (converted as any).globalFormData
            } as any;
            
            
            setWizardData(wizardDataToSet);
            setCurrentStep(converted.currentStep || 0);
            setRecordId(recordPayload.id || recordPayload._id);
            
            // CRITICAL: Also update the gadget's internal state
            gadget.updateWizardData(wizardDataToSet);
            
          }
        } else {
          // Populate initial record data using URL parameters if configured
          const populationConfig = config.recordDataPopulation;
          if (populationConfig?.enabled) {
            const autoPopulate = populationConfig.populateOnLoad !== false;
            if (autoPopulate) {
              const { templateContext, hasRequiredParams, missingRequired } = collectUrlParamContext(populationConfig);

              if (hasRequiredParams) {
                console.log('[Wizard] Populating record data with URL context:', templateContext.params);
                await populateRecordData(populationConfig, templateContext);
              } else if (missingRequired.length > 0) {
                console.warn(
                  '[Wizard] Skipping record data population due to missing required params:',
                  missingRequired
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('[Wizard] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [config, gadget, populateRecordData, setRecordId, expectedPayloadType]);

  // Helper function to get form field value
  const getFormFieldValue = useCallback((fieldId: string): any => {
    // First, check individual section formData
    if (wizardData?.sections) {
      for (const section of wizardData.sections) {
        if (section?.formData && section.formData[fieldId] !== undefined) {
          console.log(`[getFormFieldValue] Found ${fieldId} in section ${section.id}:`, section.formData[fieldId]);
          return section.formData[fieldId];
        }
      }
    }
    
    // CRITICAL FIX: Also check global formData from restored record
    if ((wizardData as any)?.globalFormData && (wizardData as any).globalFormData[fieldId] !== undefined) {
      console.log(`[getFormFieldValue] Found ${fieldId} in globalFormData:`, (wizardData as any).globalFormData[fieldId]);
      return (wizardData as any).globalFormData[fieldId];
    }
    
    console.log(`[getFormFieldValue] Field ${fieldId} not found anywhere:`, {
      sectionsCount: wizardData?.sections?.length || 0,
      hasGlobalFormData: !!((wizardData as any)?.globalFormData),
      globalFormDataKeys: (wizardData as any)?.globalFormData ? Object.keys((wizardData as any).globalFormData).slice(0, 5) : []
    });
    
    return undefined;
  }, [wizardData]);

         // Update section data with loop prevention
         const updateSectionData = useCallback((sectionIndex: number, update: any) => {
           // Prevent infinite loops by checking if update is actually different
           setWizardData(prev => {
             const currentSection = (prev.sections || [])[sectionIndex];
             
             // Check if update would actually change anything
             if (currentSection && update) {
               const hasActualChanges = Object.keys(update).some(key => {
                 const currentValue = (currentSection as any)[key];
                 const newValue = (update as any)[key];
                 
                 // Deep comparison for arrays (like images)
                 if (Array.isArray(currentValue) && Array.isArray(newValue)) {
                   return JSON.stringify(currentValue) !== JSON.stringify(newValue);
                 }
                 
                 return currentValue !== newValue;
               });
               
               if (!hasActualChanges) {
                 console.log(`[updateSectionData] No changes detected for section ${sectionIndex}, skipping update`);
                 return prev; // Return same reference to prevent re-render
               }
             }
             
             const next = { ...prev };
             next.sections = [...(next.sections || [])];
             
             // Ensure we have a section at the index
             while (next.sections.length <= sectionIndex) {
               const newSectionIndex = next.sections.length;
               next.sections.push({
                 id: sections[newSectionIndex]?.id || `section_${newSectionIndex}`,
                 title: sections[newSectionIndex]?.title || `Section ${newSectionIndex}`,
                 formData: {}
               });
             }
             
             const base = next.sections[sectionIndex] || { 
               id: sections[sectionIndex]?.id || `section_${sectionIndex}`, 
               title: sections[sectionIndex]?.title || `Section ${sectionIndex}` 
             };
             
             next.sections[sectionIndex] = { ...base, ...update };
             
             return next;
           });
         }, [sections]);

         // Navigation handlers
         const handleStepChange = useCallback((step: number) => {
           setCurrentStep(step);
           setWizardData(prev => ({ ...prev, currentStep: step }));
         }, []);

  const handleDataUpdate = useCallback((data: Partial<AIAnalysisWizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  const goPrev = useCallback(() => {
    const prev = Math.max(0, currentStep - 1);
    handleStepChange(prev);
  }, [currentStep, handleStepChange]);

  // Fullscreen and navigation handlers
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    // Navigate back to previous screen with intelligent fallback
    console.log('[Wizard] Close requested - navigating back');
    
    // Get current URL to understand context
    const currentUrl = new URL(window.location.href);
    const currentWorkspace = currentUrl.searchParams.get('workspace');
    const listingSuffix = navigationConfig.listingSuffix;
    const homeSuffix = navigationConfig.homeSuffix || 'home';
    
    // Try to determine the appropriate back navigation
    let targetUrl = null;
    
    // If we're in a wizard workspace, try to navigate to the configured listing workspace
    if (currentWorkspace && currentWorkspace.includes('wizard') && listingSuffix) {
      // Extract the base workspace path (e.g., prefix + configured listing suffix)
      const workspaceParts = currentWorkspace.split('/');
      if (workspaceParts.length >= 2) {
        const baseWorkspace = `${workspaceParts[0]}/${listingSuffix}`;
        const homeWorkspace = `${workspaceParts[0]}/${homeSuffix}`;
        
        // Check if configured listing workspace exists by trying to fetch it
        const checkWorkspaceExists = async (workspace: string) => {
          try {
            const response = await fetch(`/data/workspaces/${workspace}.json`);
            return response.ok;
          } catch {
            return false;
          }
        };
        
        // Use async IIFE to handle the check
        (async () => {
          const listingExists = await checkWorkspaceExists(baseWorkspace);
          const finalWorkspace = listingExists ? baseWorkspace : homeWorkspace;
          const finalUrl = `${window.location.origin}/?workspace=${encodeURIComponent(finalWorkspace)}`;
          
          console.log(`[Wizard] Workspace check - listing exists: ${listingExists}, using: ${finalWorkspace}`);
          
          // Add a temporary flag to prevent the auto-default menu selection
          sessionStorage.setItem('wizard-close-navigation', 'true');
          
          // Navigate to the final workspace
          window.location.replace(finalUrl);
        })();
        
        return; // Exit early since we're handling navigation asynchronously
      }
    }
    
    // Fallback to referrer if no specific target determined
    if (!targetUrl) {
      const referrer = document.referrer;
      if (referrer && referrer !== window.location.href) {
        // Check if referrer is the home page, try to improve it
        const referrerUrl = new URL(referrer);
        const referrerWorkspace = referrerUrl.searchParams.get('workspace');

        if (referrerWorkspace && referrerWorkspace.endsWith(`/${homeSuffix}`) && currentWorkspace && listingSuffix) {
          // If referrer is home but we're in a specific module, go to that module's main page
          const workspaceParts = currentWorkspace.split('/');
          if (workspaceParts.length >= 2) {
            const moduleWorkspace = `${workspaceParts[0]}/${listingSuffix}`;
            targetUrl = `${window.location.origin}/?workspace=${encodeURIComponent(moduleWorkspace)}`;
            console.log(`[Wizard] Improved navigation from home to: ${moduleWorkspace}`);
          }
        } else {
          targetUrl = referrer;
        }
      }
    }
    
    // Execute navigation with a flag to prevent auto-redirect
    if (targetUrl) {
      console.log(`[Wizard] Navigating to: ${targetUrl}`);
      
      // Add a temporary flag to prevent the auto-default menu selection
      sessionStorage.setItem('wizard-close-navigation', 'true');
      
      // Use window.location.replace instead of href to avoid history issues
      window.location.replace(targetUrl);
    } else if (window.history.length > 1) {
      // Use history.back() but force a page reload
      console.log('[Wizard] Using history.back() with reload');
      sessionStorage.setItem('wizard-close-navigation', 'true');
      window.history.back();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Final fallback: navigate to root
      console.log('[Wizard] Fallback to root');
      const rootPath = window.location.origin + '/';
      window.location.replace(rootPath);
    }
  }, [navigationConfig.listingSuffix, navigationConfig.homeSuffix]);

  // Helper function to get logged-in user's full name
  const getLoggedInUserName = useCallback(() => {
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user && user.email) {
      return user.email.split('@')[0];
    }
    return 'Unknown User';
  }, [user]);

         // Step completion handler with loop prevention
         const handleStepComplete = useCallback(async () => {
           // Prevent multiple simultaneous executions
           if ((window as any).__stepCompleting) {
             console.log('[Wizard] Step completion already in progress, skipping');
             return;
           }
           
           // Debounce rapid clicks
           const now = Date.now();
           if ((window as any).__lastStepCompleteTime && now - (window as any).__lastStepCompleteTime < 1000) {
             console.log('[Wizard] Step completion called too quickly, debouncing');
             return;
           }
           (window as any).__lastStepCompleteTime = now;
           
           (window as any).__stepCompleting = true;
           console.log('[Wizard] Step complete:', currentStep);
           
           try {
             const allFormData: any = {};
             wizardData.sections?.forEach((section: any) => {
               if (section?.formData) {
                 Object.assign(allFormData, section.formData);
               }
             });

             const rawTypeValue =
               (domainFields.detectedType && allFormData[domainFields.detectedType]) ||
               (domainFields.type && allFormData[domainFields.type]) ||
               defaultDomainType ||
               '';
            const mappedTypeValue = rawTypeValue
              ? domainTypeMap[rawTypeValue] || lookupTypeMapValue(rawTypeValue, domainTypeMap) || toTitleCase(rawTypeValue) || rawTypeValue
              : rawTypeValue;
            const normalizedInspectionType = normalizeInspectionTypeValue(rawTypeValue, domainTypeMap, defaultDomainType) || defaultDomainType || rawTypeValue || 'inspection';
            const inspectionTypeLabel = resolveInspectionTypeLabel(normalizedInspectionType, rawTypeValue, domainTypeMap, mappedTypeValue) || mappedTypeValue;
             const resolvedIdValue =
               (domainFields.id && allFormData[domainFields.id]) ||
               (domainFields.name && allFormData[domainFields.name]) ||
               '';
             const resolvedOwnerValue =
               (domainFields.owner && allFormData[domainFields.owner]) ||
               getLoggedInUserName();
             const resolvedDateValue =
               (domainFields.date && allFormData[domainFields.date]) ||
               new Date();

             console.log('[Wizard] Form data collected:', {
               allFormDataKeys: Object.keys(allFormData),
               rawTypeValue,
               mappedTypeValue,
               resolvedIdValue,
               resolvedOwnerValue,
               resolvedDateValue
             });

             const finalFormData: Record<string, any> = {
               ...allFormData
             };

             if (domainOutputKeys.id) {
               finalFormData[domainOutputKeys.id] = resolvedIdValue;
             }
            if (domainOutputKeys.type) {
              finalFormData[domainOutputKeys.type] = normalizedInspectionType;
              if (inspectionTypeLabel) {
                finalFormData[`${domainOutputKeys.type}Label`] = inspectionTypeLabel;
              }
            }
            if (domainOutputKeys.owner) {
              finalFormData[domainOutputKeys.owner] = resolvedOwnerValue;
            }
            if (domainOutputKeys.date) {
              finalFormData[domainOutputKeys.date] = resolvedDateValue;
            }

            finalFormData.inspectionType = normalizedInspectionType;
            if (inspectionTypeLabel) {
              finalFormData.inspectionTypeLabel = inspectionTypeLabel;
              finalFormData.equipmentType = inspectionTypeLabel;
              finalFormData.equipmentTypeLabel = inspectionTypeLabel;
              if (domainOutputKeys.type) {
                finalFormData[`${domainOutputKeys.type}Label`] = inspectionTypeLabel;
              }
            }
            if (rawTypeValue) {
              finalFormData.detectedEquipmentType = rawTypeValue;
            }

            const documentSummary = buildInspectionSummary({
              recordContext: (wizardData as any)?.recordContext,
              globalFormData: (wizardData as any)?.globalFormData,
              finalFormData,
              previousSummary: (wizardData as any)?.documentSummary,
              rawTypeValue,
              mappedTypeValue: inspectionTypeLabel || mappedTypeValue,
              normalizedType: normalizedInspectionType,
              typeLabel: inspectionTypeLabel,
              resolvedIdValue,
              resolvedOwnerValue,
              resolvedDateValue,
              defaultDomainType,
              domainTypeMap,
              sectionsCount: sections.length,
              currentStep,
              completedSteps: wizardData.completedSteps || []
            });

            console.log('[Wizard] Derived document summary:', documentSummary);

      // Get current section data only (prevents processing images from other sections)
      const currentSectionData = (wizardData.sections || [])[currentStep] || {};
      const currentSection = sections[currentStep];
      
      console.log(`[handleStepComplete] Preparing section data for ${currentSection?.id}:`, {
        sectionId: currentSection?.id,
        sectionIndex: currentStep,
        sectionType: (currentSection as any)?.sectionType,
        hasCurrentSectionData: !!currentSectionData,
        currentSectionKeys: Object.keys(currentSectionData),
        hasImages: !!(currentSectionData as any)?.images,
        imagesCount: ((currentSectionData as any)?.images || []).length,
        sampleImage: ((currentSectionData as any)?.images || [])[0] ? {
          name: ((currentSectionData as any).images)[0].name,
          url: ((currentSectionData as any).images)[0].url,
          hasGridfsId: !!((currentSectionData as any).images)[0].gridfsId
        } : null
      });
      
             // CRITICAL FIX: Filter out base64 images from current section before sending
             const cleanCurrentSectionData = currentSectionData ? {
               ...currentSectionData,
               images: (currentSectionData.images || []).filter((img: any) => {
                 const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                 const isGridFS = img?.url && img.url.startsWith('/api/uploads/image/');
                 const hasGridfsId = !!img?.gridfsId;
                 
                 console.log(`🔍 FRONTEND: Checking image in sectionData:`, {
                   name: img?.name,
                   urlStart: img?.url?.substring(0, 50),
                   isBase64,
                   isGridFS,
                   hasGridfsId,
                   willKeep: !isBase64 && (isGridFS || hasGridfsId)
                 });
                 
                 if (isBase64) {
                   console.log(`🚫 FRONTEND: Blocking base64 image from sectionData:`, {
                     name: img.name,
                     urlStart: img.url?.substring(0, 50) + '...'
                   });
                   return false;
                 }
                 
                 // Keep GridFS images
                 return isGridFS || hasGridfsId;
               })
             } : null;
             
             console.log(`🔍 FRONTEND: cleanCurrentSectionData result:`, {
               hasCurrentSectionData: !!currentSectionData,
               originalImagesCount: currentSectionData?.images?.length || 0,
               cleanedImagesCount: cleanCurrentSectionData?.images?.length || 0,
               cleanedImages: cleanCurrentSectionData?.images?.map((img: any) => ({
                 name: img?.name,
                 hasGridfsId: !!img?.gridfsId,
                 urlType: img?.url?.startsWith('/api/') ? 'gridfs' : 'unknown'
               })) || []
             });

             // CRITICAL FIX: Filter out base64 images from wizard sections before sending
             const cleanWizardSections = (wizardData.sections || []).map((s: any) => {
               if (!s) return null;
               
               const cleanImages = (s.images || []).filter((img: any) => {
                 const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                 const isGridFS = img?.url && img.url.startsWith('/api/uploads/image/');
                 const hasGridfsId = !!img?.gridfsId;
                 
                 console.log(`🔍 FRONTEND: Checking image in wizardState section ${s.id}:`, {
                   name: img?.name,
                   urlStart: img?.url?.substring(0, 50),
                   isBase64,
                   isGridFS,
                   hasGridfsId,
                   willKeep: !isBase64 && (isGridFS || hasGridfsId)
                 });
                 
                 if (isBase64) {
                   console.log(`🚫 FRONTEND: Blocking base64 image from wizardState section ${s.id}:`, {
                     name: img.name,
                     urlStart: img.url?.substring(0, 50) + '...'
                   });
                   return false;
                 }
                 
                 // Keep GridFS images
                 return isGridFS || hasGridfsId;
               });

               return {
                 id: s.id,
                 title: s.title,
                 // CRITICAL: Only include GridFS images, no base64
                 images: cleanImages,
                 imageAnalysis: s.imageAnalysis,
                 formData: s.formData || {},
                 textData: s.textData || '',
                 voiceData: s.voiceData || {}
               };
             });
             
             console.log(`🔍 FRONTEND: cleanWizardSections result:`, {
               sectionsCount: cleanWizardSections.length,
               sectionsWithImages: cleanWizardSections.filter((s: any) => s?.images?.length > 0).map((s: any) => ({
                 id: s.id,
                 imagesCount: s.images?.length || 0,
                 sampleImage: s.images?.[0] ? {
                   name: s.images[0].name,
                   hasGridfsId: !!s.images[0].gridfsId,
                   urlType: s.images[0].url?.startsWith('/api/') ? 'gridfs' : 'unknown'
                 } : null
               }))
             });

            const sanitizedGlobalImages = (wizardData.imageData || [])
              .filter((img: any) => {
                const isBase64 = img?.url && (img.url.startsWith('data:') || img.url.includes('base64'));
                return !isBase64 && img.gridfsId;
              })
              .map((img: any) => ({
                uid: img.uid,
                name: img.name,
                url: img.url,
                gridfsId: img.gridfsId,
                type: img.type || 'gridfs',
                metadata: img.metadata,
                fileHash: img.fileHash,
                deduplicated: img.deduplicated
              }));

            const sectionData: Record<string, any> = {
              sectionId: currentSection?.id || `step_${currentStep}`,
               workspaceId: (config as any)?.id,
               isStepCompletion: true,
               formData: finalFormData,
               sections: cleanCurrentSectionData ? [cleanCurrentSectionData] : [],
               grids: {},
               aiAnalysis: {
                 voice: wizardData.voiceData || {},
                 images: (currentSection as any)?.sectionType === 'image' ? sanitizedGlobalImages : [],
                 results: wizardData.analysisData?.analysisResults || [],
                 markdownReport: wizardData.analysisData?.markdownReport || 
                                // CRITICAL FIX: Also check section-specific imageAnalysis
                                (wizardData.sections || []).find((s: any) => s?.imageAnalysis?.overview)?.imageAnalysis?.overview || '',
                 transcription: wizardData.voiceData?.transcription || '',
                 previousResponseId: wizardData.analysisData?.previousResponseId || (window as any)?.__previousResponseId
               },
               // CRITICAL FIX: Only send GridFS attachments for image sections
               attachments: (currentSection as any)?.sectionType === 'image'
                ? sanitizedGlobalImages.map((img: any) => ({
                    type: 'image',
                    url: img.url,
                    metadata: { uploadDate: new Date(), originalName: img.name },
                    gridfsId: img.gridfsId
                  }))
                : [],
            };

            sectionData.inspectionType = normalizedInspectionType;
            if (inspectionTypeLabel) {
              sectionData.inspectionTypeLabel = inspectionTypeLabel;
            }
            if (rawTypeValue) {
              sectionData.detectedEquipmentType = rawTypeValue;
            }

            if (documentSummary && Object.keys(documentSummary).length > 0) {
              sectionData.documentSummary = documentSummary;
              Object.assign(sectionData, documentSummary);
            }

            sectionData.wizardState = {
                 currentStep,
                 completedSteps: wizardData.completedSteps || [],
                 // CRITICAL FIX: Send cleaned wizard sections (no base64 images)
                 sections: cleanWizardSections
               };

            [
              { key: domainPayloadKeys.type, value: normalizedInspectionType },
              { key: domainPayloadKeys.id, value: resolvedIdValue },
              { key: domainPayloadKeys.owner, value: resolvedOwnerValue },
              { key: domainPayloadKeys.date, value: resolvedDateValue }
            ].forEach(({ key, value }) => {
              if (key && value !== undefined && value !== null) {
                sectionData[key] = value;
              }
            });

            if (inspectionTypeLabel && domainPayloadKeys.type) {
              sectionData[`${domainPayloadKeys.type}Label`] = inspectionTypeLabel;
            }

             console.log(`🛡️ FRONTEND: Sending cleaned sectionData:`, {
               sectionId: sectionData.sectionId,
               sectionsCount: sectionData.sections?.length || 0,
               wizardSectionsCount: sectionData.wizardState?.sections?.length || 0,
               currentSectionImages: sectionData.sections?.[0]?.images?.length || 0,
               sampleCurrentSectionImage: sectionData.sections?.[0]?.images?.[0] ? {
                 hasGridfsId: !!(sectionData.sections[0].images[0] as any).gridfsId,
                 urlType: sectionData.sections[0].images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
               } : null,
               wizardSectionWithImages: (() => {
                 const sectionWithImages = sectionData.wizardState?.sections?.find((s: any) => s?.images?.length > 0);
                 if (!sectionWithImages) return null;
                 
                 return {
                   id: sectionWithImages.id,
                   imagesCount: sectionWithImages.images?.length || 0,
                   sampleImage: sectionWithImages.images?.[0] ? {
                     hasGridfsId: !!(sectionWithImages.images[0] as any).gridfsId,
                     urlType: sectionWithImages.images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
                   } : null
                 };
               })()
             });

            // CRITICAL FIX: Create lightweight wizard data with sanitized images/info only
            const lightweightWizardData = {
              currentStep,
              completedSteps: wizardData.completedSteps || [],
              sections: cleanWizardSections,
              voiceData: wizardData.voiceData ? {
                transcription: wizardData.voiceData.transcription
              } : {},
              imageData: sanitizedGlobalImages,
              analysisData: wizardData.analysisData ? {
                previousResponseId: wizardData.analysisData.previousResponseId,
                markdownReport: wizardData.analysisData.markdownReport,
                analysisResults: wizardData.analysisData.analysisResults || []
              } : {},
              recordContext: (wizardData as any)?.recordContext || {},
              globalFormData: (wizardData as any)?.globalFormData || {},
              documentSummary,
              inspectionType: normalizedInspectionType,
              inspectionTypeLabel,
              detectedEquipmentType: rawTypeValue
            };
             
            console.log('[Wizard] Lightweight payload prepared (sanitized):', {
              sectionsCount: lightweightWizardData.sections?.length || 0,
              sanitizedImageCount: sanitizedGlobalImages.length,
              sampleSectionWithImages: lightweightWizardData.sections?.find((s: any) => s?.images?.length > 0) ? {
                id: lightweightWizardData.sections.find((s: any) => s?.images?.length > 0)?.id,
                images: lightweightWizardData.sections.find((s: any) => s?.images?.length > 0)?.images?.slice(0, 1)
              } : null
            });

      const saveResult = await saveRecordProgress(sectionData.sectionId, sectionData, lightweightWizardData);
      
      console.log(`[handleStepComplete] Save completed, updating wizard state with processed data:`, {
        hasSaveResult: !!saveResult,
        resultSections: saveResult?.sections?.length || 0,
        resultWizardState: !!saveResult?.wizardState
      });
      
      // CRITICAL FIX: Update wizard state with processed data from backend
      if (saveResult?.sections || saveResult?.wizardState?.sections) {
        setWizardData(prev => {
          const next = { ...prev };
          
          // CRITICAL FIX: Replace sections with processed data (GridFS references)
          if (saveResult.sections && Array.isArray(saveResult.sections)) {
            saveResult.sections.forEach((processedSection: any) => {
              if (processedSection?.id) {
                const sectionIndex = (next.sections || []).findIndex((s: any) => s?.id === processedSection.id);
                if (sectionIndex >= 0) {
                  next.sections = next.sections || [];
                  // CRITICAL: Completely replace section data, don't merge
                  next.sections[sectionIndex] = processedSection;
                  console.log(`🔄 Replaced frontend section ${processedSection.id} with processed data:`, {
                    hasImages: !!processedSection.images,
                    imagesCount: processedSection.images?.length || 0,
                    sampleImage: processedSection.images?.[0] ? {
                      hasGridfsId: !!processedSection.images[0].gridfsId,
                      urlType: processedSection.images[0].url?.startsWith('/api/') ? 'gridfs' : 'base64'
                    } : null
                  });
                }
              }
            });
          }

          // CRITICAL FIX: Replace global imageData with only processed GridFS references
          if (saveResult.sections?.some((s: any) => s?.images?.length > 0)) {
            const processedImages: any[] = [];
            saveResult.sections.forEach((s: any) => {
              if (s?.images) {
                // Only include images that have GridFS references
                const gridfsImages = s.images.filter((img: any) => img.gridfsId && img.type === 'gridfs');
                processedImages.push(...gridfsImages);
              }
            });
            
            if (processedImages.length > 0) {
              next.imageData = processedImages; // Replace, don't merge
              console.log(`🔄 Replaced global imageData with ${processedImages.length} GridFS images`);
            }
          }
          
          if (documentSummary && Object.keys(documentSummary).length > 0) {
            next.documentSummary = {
              ...(next.documentSummary || {}),
              ...documentSummary
            };
            Object.entries(documentSummary).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                (next as any)[key] = value;
              }
            });
            if (documentSummary.inspectionType) {
              next.inspectionType = documentSummary.inspectionType;
            }
            if (documentSummary.inspectionTypeLabel) {
              (next as any).inspectionTypeLabel = documentSummary.inspectionTypeLabel;
            }
            if (documentSummary.detectedEquipmentType) {
              (next as any).detectedEquipmentType = documentSummary.detectedEquipmentType;
            }
          }

          if (saveResult.grids && typeof saveResult.grids === 'object') {
            next.grids = {
              ...(next.grids || {}),
              ...saveResult.grids
            };
          }

          return next;
        });
      }
      
      // Move to next step
      const nextStep = currentStep + 1;
      const newCompletedSteps = [...(wizardData.completedSteps || [])];
      if (!newCompletedSteps.includes(currentStep)) {
        newCompletedSteps.push(currentStep);
      }
      
      setWizardData(prev => {
        const updated: any = {
          ...prev,
          currentStep: nextStep,
          completedSteps: newCompletedSteps,
          inspectionType: normalizedInspectionType,
          inspectionTypeLabel: inspectionTypeLabel || prev?.inspectionTypeLabel,
          detectedEquipmentType: rawTypeValue || prev?.detectedEquipmentType
        };
        if (documentSummary && Object.keys(documentSummary).length > 0) {
          updated.documentSummary = {
            ...(prev as any)?.documentSummary,
            ...documentSummary
          };
          Object.entries(documentSummary).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              updated[key] = value;
            }
          });
          if (documentSummary.inspectionType) {
            updated.inspectionType = documentSummary.inspectionType;
          }
          if (documentSummary.inspectionTypeLabel) {
            updated.inspectionTypeLabel = documentSummary.inspectionTypeLabel;
          }
          if (documentSummary.detectedEquipmentType) {
            updated.detectedEquipmentType = documentSummary.detectedEquipmentType;
          }
        }
        return updated;
      });
      setCurrentStep(nextStep);
      
      // Auto-populate next step if it's a form section and not completed
      setTimeout(async () => {
        const nextSection = sections[nextStep];
        const isNextStepCompleted = newCompletedSteps.includes(nextStep);
        const hasAnalysisData = wizardData.analysisData || 
          wizardData.sections?.some((s: any) => s?.imageAnalysis || s?.analysisData);
        
        // Check for different types of promptRef (form sections vs grid sections)
        const formPromptRef = (nextSection as any)?.promptRef;
        const gridPromptRef = (nextSection as any)?.grid?.promptRef || (nextSection as any)?.grid?.populate?.promptRef;
        const hasAnyPromptRef = formPromptRef || gridPromptRef;
        const hasFormGroups = !!(nextSection as any)?.form?.groups;
        const hasGrid = !!(nextSection as any)?.grid;
        
        console.log(`🔍 Auto-populate check for step ${nextStep}:`, {
          hasNextSection: !!nextSection,
          nextSectionTitle: nextSection?.title,
          nextSectionId: nextSection?.id,
          isNextStepCompleted,
          hasFormPromptRef: !!formPromptRef,
          hasGridPromptRef: !!gridPromptRef,
          hasAnyPromptRef: !!hasAnyPromptRef,
          formPromptRef,
          gridPromptRef,
          hasAnalysisData,
          sectionType: (nextSection as any)?.sectionType,
          hasFormGroups,
          hasGrid
        });
        
        if (nextSection && 
            !isNextStepCompleted && 
            hasAnyPromptRef && 
            hasAnalysisData &&
            (nextSection as any)?.sectionType !== 'ai_analysis' &&
            (hasFormGroups || hasGrid)) {
          
          console.log(`🤖 Auto-populating next step: ${nextSection.title} (${nextSection.id})`);
          
          // Trigger AI populate for the next step
          const populateEvent = new CustomEvent('wizard-auto-populate', {
            detail: { 
              sectionIndex: nextStep,
              sectionId: nextSection.id,
              promptRef: formPromptRef || gridPromptRef,
              isGrid: !!hasGrid,
              isForm: !!hasFormGroups
            }
          });
          window.dispatchEvent(populateEvent);
        } else {
          console.log(`⏭️ Skipping auto-populate for step ${nextStep} - conditions not met`);
        }
      }, 500); // Small delay to ensure UI has updated
           } catch (error) {
             console.error('[Wizard] Error in step completion:', error);
           } finally {
             // Always clear the lock
             (window as any).__stepCompleting = false;
           }
}, [
  currentStep,
  wizardData,
  sections,
  config,
  saveRecordProgress,
  getLoggedInUserName,
  domainFields,
  domainOutputKeys,
  domainPayloadKeys,
  domainTypeMap,
  defaultDomainType
]);

  // Conditional section logic
  const shouldShowSection = useCallback((section: any) => {
    if (!section.watchField || !section.showWhen) return true;
    
    let watchedValue = '';
    wizardData.sections?.forEach((sectionData: any) => {
      if (sectionData?.formData?.[section.watchField]) {
        watchedValue = sectionData.formData[section.watchField];
      }
    });
    
    return watchedValue === section.showWhen;
  }, [wizardData.sections]);

  const visibleSections = useMemo(() => {
    return sections.filter(shouldShowSection);
  }, [sections, shouldShowSection]);

  const isAtLast = useMemo((): boolean => {
    return (!config?.steps?.input && currentStep === visibleSections.length)
      || (Boolean(config?.steps?.input) && currentStep === visibleSections.length + 1);
  }, [currentStep, visibleSections.length, config?.steps?.input]);

  const stepItems = useMemo(() => {
    return getStepItems(config, visibleSections);
  }, [config, visibleSections]);

  // Show loading state until data is ready
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: 'hsl(var(--muted-foreground))'
      }}>
        Loading record data...
      </div>
    );
  }

  const menuItems = stepItems.map((step, index) => {
    const isActive = currentStep === index;
    const isDone = wizardData.completedSteps.includes(index);
    
    return {
      key: String(index),
      icon: (
        <div className={`sidebar-icon-wrapper ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
          {step.icon as any}
          {isDone && (
            <div className="sidebar-icon-check-overlay">
              <span>✓</span>
            </div>
          )}
        </div>
      ),
      label: (
        <div className="sidebar-menu-label">
          <div className="sidebar-menu-title">
            {step.title}
          </div>
          <div className="sidebar-menu-meta">
          </div>
        </div>
      ),
      className: `sidebar-menu-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`
    };
  });

  const renderBodyForCurrent = () => {
    const getSectionIndex = (step: number) => {
      const adjustedStep = config.steps.input ? step - 1 : step;
      if (adjustedStep < 0 || adjustedStep >= visibleSections.length) return -1;
      
      const visibleSection = visibleSections[adjustedStep];
      return sections.findIndex(s => s.id === visibleSection.id);
    };

    const sectionIndex = getSectionIndex(currentStep);

    return (
      <>
        {config.steps.input && currentStep === 0 && (
          <InputStep 
            config={config}
            wizardData={wizardData}
            handleDataUpdate={handleDataUpdate}
            handleStepComplete={handleStepComplete}
          />
        )}
        {sectionIndex >= 0 && (() => {
          const section = sections[sectionIndex];
          const currentSectionData = (wizardData.sections || [])[sectionIndex];
          
          // Only log once per section to prevent infinite loops
          if (!(window as any).__loggedSections) (window as any).__loggedSections = new Set();
          if (!(window as any).__loggedSections.has(`${section?.id}-${sectionIndex}`)) {
            (window as any).__loggedSections.add(`${section?.id}-${sectionIndex}`);
            console.log(`[GenericWizardRenderer] Rendering section ${section?.id}:`, {
              sectionIndex,
              sectionId: section?.id,
              sectionType: (section as any)?.sectionType,
              wizardDataSectionsCount: wizardData.sections?.length || 0,
              currentSectionData,
              currentSectionDataKeys: currentSectionData ? Object.keys(currentSectionData) : [],
              hasImages: !!(currentSectionData as any)?.images,
              imagesCount: (currentSectionData as any)?.images?.length || 0,
              sampleImage: (currentSectionData as any)?.images?.[0] ? {
                name: (currentSectionData as any).images[0].name,
                url: (currentSectionData as any).images[0].url,
                hasGridfsId: !!(currentSectionData as any).images[0].gridfsId
              } : null
            });
          }
          
          return (
            <SectionStep
              section={section}
              sectionIndex={sectionIndex}
              sections={sections}
              wizardData={wizardData}
              updateSectionData={updateSectionData}
              openAI={openAI}
              config={config}
              getFormFieldValue={getFormFieldValue}
              disabledFields={wizardData.disabledFields || []}
            />
          );
        })()}
        {(!config.steps.input && currentStep === visibleSections.length) && (
          <PDFStep 
            config={config}
            sections={sections}
            wizardData={wizardData}
          />
        )}
        {(config.steps.input && currentStep === visibleSections.length + 1) && (
          <PDFStep 
            config={config}
            sections={sections}
            wizardData={wizardData}
          />
        )}
      </>
    );
  };

  return (
    <div className={`ai-analysis-wizard ${isFullscreen ? 'fullscreen' : ''}`} style={{ height: '100%', minHeight: 0, padding: 0 }}>
      <WizardHeader 
        config={config}
        currentStep={currentStep}
        totalSteps={visibleSections.length}
        isFullscreen={isFullscreen}
        onClose={handleClose}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <div className="wizard-doc-layout">
        <WizardSidebar 
          menuItems={menuItems}
          currentStep={currentStep}
          handleStepChange={handleStepChange}
        />
        <main className="wizard-content" role="region" aria-label="Wizard content" style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
          {renderBodyForCurrent()}
        </main>
      </div>
      
      <WizardFooter 
        gadget={gadget}
        currentStep={currentStep}
        totalSteps={stepItems.length}
        isAtLast={isAtLast}
        goPrev={goPrev}
        handleStepComplete={handleStepComplete}
        wizardData={wizardData}
      />
    </div>
  );
};
