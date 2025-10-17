import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseGadget } from '../../../base';
import { getStepItems } from '../utils/iconUtils';
import { convertRecordToWizardData, getStableRestoreIdFromUrl, tryFetchRecordFromApi } from '../utils/restore';
import type {
  AIAnalysisWizardConfig,
  AIAnalysisWizardData,
  WizardIdentityConfig
} from '../AIAnalysisWizardGadget.types';
import { AIAnalysisWizardGadget } from '../AIAnalysisWizardGadget';
import { useWizardRecordSave } from '../../../../../../hooks/useWizardRecordSave';
import type {
  EndpointConfig,
  WizardRecordSaveOptions,
  PersistRequest
} from '../../../../../../hooks/useWizardRecordSave';
import { useNavigation } from '../../../../../../contexts/NavigationContext';
import { InputStep } from './InputStep';
import { PDFStep } from './PDFStep';
import { SectionStep } from './SectionStep';
import { WizardFooter } from './WizardFooter';
import { WizardHeader } from './WizardHeader';
import { WizardSidebar } from './WizardSidebar';

interface GenericWizardRendererProps {
  gadget: AIAnalysisWizardGadget;
  config: AIAnalysisWizardConfig;
}

type WizardSectionConfig = NonNullable<AIAnalysisWizardConfig['steps']['sections']>[number];

type SectionState = NonNullable<AIAnalysisWizardData['sections']>[number];

type TemplateContext = Record<string, any>;

type CanonicalMap = Record<string, any>;

interface DomainResolution {
  canonical: CanonicalMap;
  labels: CanonicalMap;
}

interface WizardRuntimePersistence {
  create: EndpointConfig;
  update: EndpointConfig;
  progress: EndpointConfig;
  recordIdPaths: string[];
  successMessages?: WizardRecordSaveOptions['successMessages'];
  errorMessages?: WizardRecordSaveOptions['errorMessages'];
}

interface WizardRuntimeContext {
  sections: WizardSectionConfig[];
  inputStep?: AIAnalysisWizardConfig['steps']['input'];
  domainConfig?: AIAnalysisWizardConfig['domainConfig'];
  recordDataPopulation?: AIAnalysisWizardConfig['recordDataPopulation'];
  persistence: WizardRuntimePersistence;
  identity: WizardIdentityConfig;
}

interface PersistencePayloadContext {
  section?: WizardSectionConfig;
  wizardData: AIAnalysisWizardData;
  summary: Record<string, any>;
  canonical: CanonicalMap;
  labels: CanonicalMap;
  mappedPayload: Record<string, any>;
  aggregate: Record<string, any>;
  identity: WizardIdentityConfig;
}

const EMPTY_OBJECT: Record<string, any> = {};

// Utility: normalize dotted/bracket path selectors into array segments
const toPathSegments = (selector: string): string[] =>
  selector
    .replace(/\[(\w+)\]/g, '.$1')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

// Utility: read nested data by selector, returning undefined when any segment is missing
const selectFromPath = (data: any, selector?: string): any => {
  if (!selector) return data;
  const segments = toPathSegments(selector);
  return segments.reduce<any>((acc, segment) => {
    if (acc === undefined || acc === null) return undefined;
    if (Array.isArray(acc)) {
      const index = Number(segment);
      if (Number.isNaN(index)) return undefined;
      return acc[index];
    }
    return acc?.[segment];
  }, data);
};

const toArray = <T,>(value: T | T[] | undefined | null): T[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => item !== undefined && item !== null);
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
};

const normaliseEndpoint = (endpoint: EndpointConfig | undefined, key: string): EndpointConfig => {
  if (!endpoint?.url) {
    throw new Error(`Wizard persistence configuration is missing a url for "${key}"`);
  }
  if (!endpoint.method) {
    throw new Error(`Wizard persistence configuration is missing an HTTP method for "${key}"`);
  }
  return {
    ...endpoint,
    url: endpoint.url,
    method: endpoint.method.toUpperCase() as EndpointConfig['method']
  };
};

const buildWizardRuntimeContext = (config: AIAnalysisWizardConfig): WizardRuntimeContext => {
  if (!config) {
    throw new Error('GenericWizardRenderer requires configuration metadata');
  }

  const sections = Array.isArray(config.steps?.sections) ? config.steps.sections : [];
  if (sections.length === 0) {
    throw new Error('Wizard configuration must define at least one section in steps.sections');
  }

  const identityConfig = (config as any).identity as WizardIdentityConfig | undefined;
  if (!identityConfig) {
    throw new Error('Wizard configuration is missing identity metadata (config.identity)');
  }

  const { recordType, domain, domainSubType } = identityConfig;
  if (!recordType || !domain || !domainSubType) {
    throw new Error('Wizard identity metadata must include recordType, domain, and domainSubType');
  }

  const persistenceMeta = (config as any).persistence as Partial<WizardRuntimePersistence> & {
    recordIdPath?: string | string[];
  };
  if (!persistenceMeta) {
    throw new Error('Wizard configuration is missing persistence metadata (config.persistence)');
  }

  const recordIdPaths = toArray(persistenceMeta.recordIdPath ?? []);
  if (recordIdPaths.length === 0) {
    throw new Error('Wizard persistence metadata must provide at least one recordIdPath entry');
  }

  const persistence: WizardRuntimePersistence = {
    create: normaliseEndpoint(persistenceMeta.create, 'create'),
    update: normaliseEndpoint(persistenceMeta.update, 'update'),
    progress: normaliseEndpoint(persistenceMeta.progress, 'progress'),
    recordIdPaths: recordIdPaths.map((entry) => entry.trim()),
    successMessages: persistenceMeta.successMessages,
    errorMessages: persistenceMeta.errorMessages
  };

  return {
    sections,
    inputStep: config.steps?.input,
    domainConfig: config.domainConfig,
    recordDataPopulation: config.recordDataPopulation,
    persistence,
    identity: {
      recordType,
      domain,
      domainLabel: identityConfig.domainLabel,
      domainSubType,
      domainTypeLabel: identityConfig.domainTypeLabel,
      domainSubTypeLabel:
        identityConfig.domainSubTypeLabel ??
        identityConfig.domainTypeLabel ??
        identityConfig.label
    }
  };
};

// Resolve templated strings/objects using a metadata-provided context map
const resolveTemplateValue = (value: any, context: TemplateContext): any => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\{[^}]+\}$/.test(trimmed)) {
      const tokenKey = trimmed.slice(1, -1).trim();
      return selectFromPath(context, tokenKey);
    }
    return value.replace(/\{([^}]+)\}/g, (_match, token) => {
      const resolved = selectFromPath(context, String(token).trim());
      if (resolved === undefined || resolved === null) return '';
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
    return Object.entries(value).reduce<Record<string, any>>((acc, [key, v]) => {
      const resolved = resolveTemplateValue(v, context);
      if (resolved !== undefined) {
        acc[key] = resolved;
      }
      return acc;
    }, {});
  }

  return value;
};

const collectUrlParamContext = (populationConfig: NonNullable<AIAnalysisWizardConfig['recordDataPopulation']>) => {
  if (typeof window === 'undefined') {
    return { templateContext: {}, hasRequiredParams: true };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const definitions = Array.isArray(populationConfig.urlParams) ? populationConfig.urlParams : [];
  const params: Record<string, string | string[]> = {};

  definitions.forEach((definition) => {
    if (!definition?.name) return;
    const queryKey = definition.queryParam || definition.name;
    const values = searchParams.getAll(queryKey);
    if (values.length > 0) {
      params[definition.name] = definition.allowMultiple ? values : values[0];
    } else if (definition.defaultValue !== undefined) {
      params[definition.name] = definition.defaultValue as any;
    } else if (definition.required) {
      params[definition.name] = undefined as any;
    }
  });

  const hasRequiredParams = definitions
    .filter((definition) => definition.required)
    .every((definition) => {
      const value = params[definition.name];
      return value !== undefined && value !== null && value !== '';
    });

  return {
    templateContext: {
      params,
      query: Object.fromEntries(searchParams.entries()),
      urlSearch: window.location.search
    },
    hasRequiredParams
  };
};

const buildRecordFetchRequest = (
  populationConfig: NonNullable<AIAnalysisWizardConfig['recordDataPopulation']>,
  context: TemplateContext
) => {
  const request = populationConfig.request;
  if (!request?.url && !populationConfig.apiEndpoint) {
    throw new Error('recordDataPopulation requires a request.url or apiEndpoint');
  }

  const urlTemplate = request?.url || populationConfig.apiEndpoint!;
  const resolvedUrl = resolveTemplateValue(urlTemplate, context);
  let url = typeof resolvedUrl === 'string' ? resolvedUrl : String(resolvedUrl ?? '');
  const headers = resolveTemplateValue(request?.headers || {}, context);
  const method = (request?.method || 'GET').toUpperCase();
  let body: BodyInit | undefined;

  if (request?.query) {
    const resolvedQuery = resolveTemplateValue(request.query, context);
    if (resolvedQuery && typeof resolvedQuery === 'object') {
      const params = new URLSearchParams();
      Object.entries(resolvedQuery).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
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

  if (request?.body !== undefined) {
    const resolvedBody = resolveTemplateValue(request.body, context);
    if (typeof resolvedBody === 'string') {
      body = resolvedBody;
    } else if (resolvedBody !== undefined && resolvedBody !== null) {
      body = JSON.stringify(resolvedBody);
    }
  }

  return {
    url,
    options: {
      method,
      headers: headers as HeadersInit | undefined,
      body
    } as RequestInit
  };
};

interface SectionFieldPopulation {
  sectionId: string;
  fieldId: string;
  sourcePath: string;
}

// Precompute (sectionId, fieldId, sourcePath) tuples for asset-based auto-population
const buildPopulationDescriptors = (sections: WizardSectionConfig[]): SectionFieldPopulation[] => {
  const descriptors: SectionFieldPopulation[] = [];
  sections.forEach((section) => {
    section?.form?.groups?.forEach((group) => {
      group.fields?.forEach((field) => {
        if (field?.populateFromAsset) {
          descriptors.push({
            sectionId: section.id,
            fieldId: field.id,
            sourcePath: field.populateFromAsset
          });
        }
      });
    });
  });
  return descriptors;
};

const aggregateFormData = (wizardData: AIAnalysisWizardData): Record<string, any> => {
  const aggregate: Record<string, any> = {
    ...(wizardData.globalFormData || {})
  };

  wizardData.sections?.forEach((section) => {
    if (section?.formData) {
      Object.assign(aggregate, section.formData);
    }
  });

  return aggregate;
};

// Drop upload-only metadata before persisting any image reference
const sanitiseImage = (image: any) => {
  if (!image) return image;
  const {
    originFileObj,
    preview,
    thumbUrl,
    status,
    percent,
    ...rest
  } = image;
  return rest;
};

const sanitiseSection = (section: SectionState): SectionState => {
  if (!section) return section;
  const images = Array.isArray(section.images) ? section.images.map(sanitiseImage) : section.images;
  return {
    ...section,
    images
  };
};

const sanitiseSections = (sections: SectionState[] = []): SectionState[] =>
  sections.map(sanitiseSection);

// Project domainConfig fields onto canonical/label maps for downstream payload mapping
const buildDomainResolution = (
  config: AIAnalysisWizardConfig['domainConfig'],
  aggregate: Record<string, any>
): DomainResolution => {
  const fields = config?.fields ?? EMPTY_OBJECT;
  const typeMap = config?.typeMap ?? EMPTY_OBJECT;

  const canonicalEntries = Object.entries(fields).reduce<Record<string, any>>((acc, [key, fieldId]) => {
    if (!fieldId) return acc;
    const value = aggregate[fieldId];
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (config?.defaultType && canonicalEntries.type === undefined) {
    canonicalEntries.type = config.defaultType;
  }

  const labels: Record<string, any> = {};
  if (canonicalEntries.type && typeMap[canonicalEntries.type]) {
    labels.typeLabel = typeMap[canonicalEntries.type];
  }
  if (canonicalEntries.documentType && typeMap[canonicalEntries.documentType]) {
    labels.documentTypeLabel = typeMap[canonicalEntries.documentType];
  }

  return {
    canonical: canonicalEntries,
    labels
  };
};

const applyMappings = (
  target: Record<string, any>,
  mappings: Record<string, string> | undefined,
  values: CanonicalMap
) => {
  if (!mappings) return;
  Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
    if (!targetKey) return;
    if (values[sourceKey] !== undefined) {
      target[targetKey] = values[sourceKey];
    }
  });
};

// Summaries are derived from current wizard data plus mapped canonical values
const buildSummary = (
  wizardData: AIAnalysisWizardData,
  aggregate: Record<string, any>,
  domainResolution: DomainResolution,
  config: AIAnalysisWizardConfig,
  identity: WizardIdentityConfig
) => {
  const summary: Record<string, any> = {
    ...(wizardData.summary || {}),
    ...aggregate
  };

  const combinedValues = {
    ...domainResolution.canonical,
    ...domainResolution.labels
  };

  applyMappings(summary, config.domainConfig?.outputKeys, combinedValues);

  summary.type = identity.recordType;
  summary.domain = identity.domain;
  if (identity.domainLabel) {
    summary.domainLabel = identity.domainLabel;
  }
  summary.domainType = identity.domainSubType;
  summary.domainSubType = identity.domainSubType;
  if (identity.domainTypeLabel) {
    summary.domainTypeLabel = identity.domainTypeLabel;
  }
  if (identity.domainSubTypeLabel) {
    summary.domainSubTypeLabel = identity.domainSubTypeLabel;
  }
  if (wizardData.detectedType) {
    summary.detectedType = wizardData.detectedType;
  }

  return summary;
};

const buildMappedPayload = (
  domainResolution: DomainResolution,
  config: AIAnalysisWizardConfig
): Record<string, any> => {
  const payload: Record<string, any> = {};
  const combinedValues = {
    ...domainResolution.canonical,
    ...domainResolution.labels
  };
  applyMappings(payload, config.domainConfig?.payloadKeys, combinedValues);
  if (config.domainConfig?.payloadType) {
    payload.type = config.domainConfig.payloadType;
  }
  return payload;
};

// Assemble the persistence contract: sanitized state snapshot + domain metadata
const buildPersistencePayload = ({
  section,
  wizardData,
  summary,
  canonical,
  labels,
  mappedPayload,
  aggregate,
  identity
}: PersistencePayloadContext) => {
  const combinedSections = sanitiseSections(wizardData.sections || []);
  const completedSteps = Array.isArray(wizardData.completedSteps)
    ? Array.from(new Set(wizardData.completedSteps))
    : [];
  const totalSections = combinedSections.length;
  const progressValue = totalSections > 0 ? Math.round((completedSteps.length / totalSections) * 100) : 0;
  const derivedStatus =
    wizardData.status ?? (progressValue >= 100 ? 'completed' : 'in_progress');

  const snapshot: AIAnalysisWizardData = {
    ...wizardData,
    recordType: identity.recordType,
    domain: identity.domain,
    domainLabel: identity.domainLabel ?? wizardData.domainLabel,
    domainSubType: identity.domainSubType,
    domainSubTypeLabel: identity.domainSubTypeLabel ?? wizardData.domainSubTypeLabel,
    domainType: identity.domainSubType,
    domainTypeLabel: identity.domainTypeLabel ?? identity.domainSubTypeLabel ?? wizardData.domainTypeLabel,
    summary,
    sections: combinedSections,
    progress: progressValue,
    status: derivedStatus
  };

  return {
    type: identity.recordType,
    domain: identity.domain,
    domainLabel: identity.domainLabel,
    domainSubType: identity.domainSubType,
    domainSubTypeLabel: identity.domainSubTypeLabel ?? identity.domainTypeLabel,
    sectionId: section?.id,
    sectionTitle: section?.title,
    wizardState: snapshot,
    summary,
    domainType: identity.domainSubType,
    domainTypeLabel: identity.domainTypeLabel ?? identity.domainSubTypeLabel,
    detectedType: wizardData.detectedType,
    status: derivedStatus,
    progress: progressValue,
    canonicalValues: canonical,
    canonicalLabels: labels,
    payload: mappedPayload,
    analysisData: wizardData.analysisData,
    voiceData: wizardData.voiceData,
    imageData: Array.isArray(wizardData.imageData)
      ? wizardData.imageData.map(sanitiseImage)
      : wizardData.imageData,
    recordContext: wizardData.recordContext,
    recordParams: wizardData.recordParams,
    globalFormData: wizardData.globalFormData,
    formData: aggregate
  };
};

const createInitialWizardData = (sections: WizardSectionConfig[], identity: WizardIdentityConfig): AIAnalysisWizardData => ({
  currentStep: 0,
  completedSteps: [],
  sections: sections.map((section) => ({
    id: section.id,
    title: section.title,
    formData: {}
  })),
  voiceData: {},
  imageData: [],
  analysisData: {},
  summary: {},
  recordType: identity.recordType,
  domain: identity.domain,
  domainLabel: identity.domainLabel,
  domainType: identity.domainSubType,
  domainTypeLabel: identity.domainTypeLabel ?? identity.domainSubTypeLabel,
  domainSubType: identity.domainSubType,
  domainSubTypeLabel: identity.domainSubTypeLabel ?? identity.domainTypeLabel,
  status: 'in_progress',
  progress: 0,
  globalFormData: {},
  recordContext: {},
  recordParams: {}
});

// Translate wizard-level persistence metadata into hook configuration
const createPersistenceOptions = (persistence: WizardRuntimePersistence): WizardRecordSaveOptions => {
  return {
    endpoints: {
      create: persistence.create,
      update: persistence.update,
      progress: persistence.progress
    },
    resolveRecordId: (response) => {
      for (const pathSelector of persistence.recordIdPaths) {
        const value = selectFromPath(response, pathSelector);
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
      return undefined;
    },
    successMessages: persistence.successMessages,
    errorMessages: persistence.errorMessages
  };
};

const getSectionIndexForStep = (
  stepIndex: number,
  sections: WizardSectionConfig[],
  visibleSections: WizardSectionConfig[],
  hasInputStep: boolean
) => {
  const offset = hasInputStep ? 1 : 0;
  const visibleIndex = stepIndex - offset;
  if (visibleIndex < 0 || visibleIndex >= visibleSections.length) return undefined;
  const sectionId = visibleSections[visibleIndex]?.id;
  if (!sectionId) return undefined;
  const fullIndex = sections.findIndex((section) => section.id === sectionId);
  return fullIndex >= 0 ? fullIndex : undefined;
};

export const GenericWizardRenderer: React.FC<GenericWizardRendererProps> = ({ gadget, config }) => {
  const runtime = useMemo(() => buildWizardRuntimeContext(config), [config]);
  const {
    sections: sectionDefinitions,
    identity,
    domainConfig,
    recordDataPopulation,
    persistence,
    inputStep
  } = runtime;

  const domainTypeMap = useMemo(() => domainConfig?.typeMap ?? EMPTY_OBJECT, [domainConfig?.typeMap]);
  const [wizardData, setWizardData] = useState<AIAnalysisWizardData>(() => createInitialWizardData(sectionDefinitions, identity));
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const persistenceOptions = useMemo(() => createPersistenceOptions(persistence), [persistence]);
  const { recordId: persistedRecordId, saveRecord, saveRecordProgress, setRecordId } = useWizardRecordSave(persistenceOptions);

  const populationDescriptors = useMemo(() => buildPopulationDescriptors(sectionDefinitions), [sectionDefinitions]);

  const navigation = useNavigation();
  const currentWorkspaceId = navigation.currentWorkspaceId;

  const navigateBackOrFallback = useCallback(() => {
    if (navigation.navigateBack()) {
      return;
    }

    const moduleId = currentWorkspaceId?.split('/')?.[0];
    if (moduleId) {
      const fallback = navigation.getLastWorkspaceForModule(moduleId);
      if (fallback && fallback !== currentWorkspaceId) {
        navigation.openWorkspace(fallback, { replace: true });
        return;
      }
    }

    if (window.history.length > 1) {
      window.history.back();
    }
  }, [navigation, currentWorkspaceId]);

  const closeWizard = useCallback(() => {
    navigateBackOrFallback();
  }, [navigateBackOrFallback]);

  useEffect(() => {
    if (typeof gadget.updateWizardData === 'function') {
      gadget.updateWizardData(wizardData);
    }
  }, [gadget, wizardData]);

  useEffect(() => {
    const id = wizardData.analysisData?.previousResponseId;
    if (typeof window !== 'undefined' && id) {
      try {
        (window as any).__previousResponseId = id;
      } catch {}
    }
  }, [wizardData.analysisData?.previousResponseId]);

  useEffect(() => {
    setWizardData((prev) => {
      const nextDomainType = prev.domainType ?? identity.domainSubType;
      const nextDomainTypeLabel =
        prev.domainTypeLabel ??
        identity.domainSubTypeLabel ??
        (nextDomainType ? domainTypeMap[nextDomainType] : undefined);

      return {
        ...prev,
        recordType: identity.recordType,
        domain: identity.domain,
        domainLabel: identity.domainLabel ?? prev.domainLabel,
        domainType: nextDomainType,
        domainTypeLabel: nextDomainTypeLabel,
        domainSubType: identity.domainSubType,
        domainSubTypeLabel: identity.domainSubTypeLabel ?? nextDomainTypeLabel
      };
    });
  }, [identity, domainTypeMap]);

  useEffect(() => {
    if (!wizardData.domainType) return;
    const mappedLabel = domainTypeMap[wizardData.domainType];
    if (mappedLabel && wizardData.domainTypeLabel !== mappedLabel) {
      setWizardData((prev) => ({
        ...prev,
        domainTypeLabel: mappedLabel,
        domainSubTypeLabel: mappedLabel
      }));
    }
  }, [domainTypeMap, wizardData.domainType, wizardData.domainTypeLabel]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const restoreId = getStableRestoreIdFromUrl();
        if (restoreId) {
          const payload = await tryFetchRecordFromApi(restoreId);
          const recordPayload = payload?.data ?? payload;
          const converted = convertRecordToWizardData(recordPayload, config);
          if (!cancelled && converted) {
            setWizardData((prev) => {
              const nextDomainType = converted.domainType ?? identity.domainSubType;
              const nextDomainTypeLabel =
                converted.domainTypeLabel ??
                identity.domainTypeLabel ??
                identity.domainSubTypeLabel ??
                (nextDomainType ? domainTypeMap[nextDomainType] : undefined);

              return {
                ...prev,
                ...converted,
                recordType: identity.recordType,
                domain: identity.domain,
                domainLabel: identity.domainLabel ?? converted.domainLabel ?? prev.domainLabel,
                domainType: nextDomainType,
                domainTypeLabel: nextDomainTypeLabel,
                domainSubType: identity.domainSubType,
                domainSubTypeLabel: identity.domainSubTypeLabel ?? nextDomainTypeLabel
              };
            });
            if (recordPayload?.id || recordPayload?._id) {
              setRecordId(recordPayload.id || recordPayload._id);
            }
          }
          return;
        }

        if (recordDataPopulation?.enabled) {
          const populationConfig = recordDataPopulation as NonNullable<AIAnalysisWizardConfig['recordDataPopulation']>;
          const { templateContext, hasRequiredParams } = collectUrlParamContext(populationConfig);
          if (!hasRequiredParams) {
            return;
          }

          const { url, options } = buildRecordFetchRequest(populationConfig, templateContext);
          const response = await BaseGadget.makeAuthenticatedFetch(url, options);
          if (!response.ok) {
            throw new Error(`Failed to populate record data: ${response.statusText}`);
          }

          const payload = await response.json();
          const recordData =
            selectFromPath(payload, populationConfig.responseSelector) ?? payload?.data ?? payload;

          if (!cancelled && recordData) {
            setWizardData((prev) => {
              const populatedIds = new Set<string>();

              const nextSections = (prev.sections || []).map((sectionState) => {
                const sectionConfig = sectionDefinitions.find((section) => section.id === sectionState.id);
                if (!sectionConfig) return sectionState;

                const descriptors = populationDescriptors.filter(
                  (descriptor) => descriptor.sectionId === sectionConfig.id
                );
                if (descriptors.length === 0) return sectionState;

                const formData = { ...(sectionState.formData || {}) };
                descriptors.forEach((descriptor) => {
                  const value = selectFromPath(recordData, descriptor.sourcePath);
                  if (value !== undefined && value !== null && value !== '') {
                    formData[descriptor.fieldId] = value;
                    populatedIds.add(descriptor.fieldId);
                  }
                });

                return {
                  ...sectionState,
                  formData
                };
              });

              return {
                ...prev,
                sections: nextSections,
                globalFormData: { ...(prev.globalFormData || {}), ...recordData },
                recordContext: recordData,
                recordParams: templateContext.params || {},
                disabledFields: populationConfig.disablePopulatedFields
                  ? Array.from(new Set([...(prev.disabledFields || []), ...Array.from(populatedIds)]))
                  : prev.disabledFields
              };
            });
          }
        }
      } catch (error) {
        console.error('[GenericWizardRenderer] Initialization failed', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    config,
    domainTypeMap,
    identity,
    populationDescriptors,
    recordDataPopulation,
    sectionDefinitions,
    setRecordId
  ]);

  const aggregatedFormData = useMemo(() => aggregateFormData(wizardData), [wizardData]);

  // Visibility and flow decisions are driven entirely by metadata expressions
  const evaluateSectionVisibility = useCallback(
    (section: WizardSectionConfig) => {
      const metadata = section as Record<string, any>;
      const watchField = metadata.watchField as string | undefined;
      const condition = metadata.showWhen;

      if (!watchField || condition === undefined || condition === null) {
        return true;
      }

      const value = aggregatedFormData[watchField];
      if (Array.isArray(condition)) {
        return condition.includes(value);
      }
      return value === condition;
    },
    [aggregatedFormData]
  );

  const visibleSections = useMemo(
    () => sectionDefinitions.filter(evaluateSectionVisibility),
    [sectionDefinitions, evaluateSectionVisibility]
  );

  const hasInputStep = Boolean(inputStep);
  const totalSteps = visibleSections.length + 1 + (hasInputStep ? 1 : 0);
  const currentStep = wizardData.currentStep ?? 0;

  const handleStepChange = useCallback((step: number) => {
    if (!Number.isFinite(step)) return;
    setWizardData((prev) => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const goPrev = useCallback(() => {
    setWizardData((prev) => ({
      ...prev,
      currentStep: Math.max((prev.currentStep ?? 0) - 1, 0)
    }));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleDataUpdate = useCallback((next: Partial<AIAnalysisWizardData>) => {
    setWizardData((prev) => ({
      ...prev,
      ...next
    }));
  }, []);

  const updateSectionData = useCallback((sectionIndex: number, update: Partial<SectionState>) => {
    setWizardData((prev) => {
      const sections = prev.sections ? [...prev.sections] : [];
      if (!sections[sectionIndex]) return prev;
      sections[sectionIndex] = {
        ...sections[sectionIndex],
        ...update
      };
      return {
        ...prev,
        sections
      };
    });
  }, []);

  const updateAnalysisContext = useCallback(
    (responseId?: string | null, patch?: Partial<AIAnalysisWizardData['analysisData']>) => {
      if (!responseId && !patch) return;

      if (responseId) {
        try {
          (window as any).__previousResponseId = responseId;
        } catch {}
      }

      setWizardData((prev) => {
        const nextAnalysis = {
          ...(prev.analysisData || {}),
          ...(patch || {})
        };

        if (responseId) {
          nextAnalysis.previousResponseId = responseId;
        }

        return {
          ...prev,
          analysisData: nextAnalysis
        };
      });
    },
    []
  );

  const handleStepComplete = useCallback(async () => {
    const sectionIndex = getSectionIndexForStep(currentStep, sectionDefinitions, visibleSections, hasInputStep);
    const currentSection = typeof sectionIndex === 'number' ? sectionDefinitions[sectionIndex] : undefined;
    const isFinalStep = currentStep >= totalSteps - 1;

    const domainResolution = buildDomainResolution(domainConfig, aggregatedFormData);
    const summary = buildSummary(wizardData, aggregatedFormData, domainResolution, config, identity);
    const mappedPayload = buildMappedPayload(domainResolution, config);

    const payload = buildPersistencePayload({
      section: currentSection,
      wizardData,
      summary,
      canonical: domainResolution.canonical,
      labels: domainResolution.labels,
      mappedPayload,
      aggregate: aggregatedFormData,
      identity
    });

    if (isFinalStep) {
      payload.progress = 100;
      payload.status = 'completed';
      if (payload.wizardState) {
        payload.wizardState.progress = 100;
        payload.wizardState.status = 'completed';
      }
    }

    const request: PersistRequest = {
      payload,
      ...(persistedRecordId ? { recordId: persistedRecordId } : {})
    };

    const result = persistedRecordId
      ? await saveRecordProgress({ ...request, mode: 'progress' })
      : await saveRecord({ ...request, mode: 'create' });

    setWizardData((prev) => {
      const nextCompleted = new Set(prev.completedSteps || []);
      nextCompleted.add(prev.currentStep ?? currentStep);

      const nextWizardStateRaw = result?.wizardState as AIAnalysisWizardData | undefined;
      const nextDomainType = nextWizardStateRaw?.domainType ?? identity.domainSubType;
      const nextDomainTypeLabel =
        nextWizardStateRaw?.domainTypeLabel ??
        identity.domainSubTypeLabel ??
        (nextDomainType ? domainTypeMap[nextDomainType] : undefined);

      const nextWizardState = nextWizardStateRaw
        ? {
            ...nextWizardStateRaw,
            recordType: identity.recordType,
            domain: identity.domain,
            domainLabel: identity.domainLabel ?? nextWizardStateRaw.domainLabel,
            domainType: nextDomainType,
            domainTypeLabel: nextDomainTypeLabel,
            domainSubType: identity.domainSubType,
            domainSubTypeLabel: identity.domainSubTypeLabel ?? nextDomainTypeLabel
          }
        : undefined;

      const baseState = nextWizardState || prev;

      if (isFinalStep) {
        return {
          ...baseState,
          currentStep: totalSteps - 1,
          completedSteps: Array.from(nextCompleted),
          summary: nextWizardState?.summary || summary,
          progress: 100,
          status: 'completed'
        };
      }

      return {
        ...baseState,
        currentStep: Math.min((prev.currentStep ?? currentStep) + 1, totalSteps - 1),
        completedSteps: Array.from(nextCompleted),
        summary: nextWizardState?.summary || summary
      };
    });

    if (isFinalStep) {
      closeWizard();
    }
  }, [
    aggregatedFormData,
    config,
    currentStep,
    domainConfig,
    domainTypeMap,
    closeWizard,
    hasInputStep,
    identity,
    persistedRecordId,
    saveRecord,
    saveRecordProgress,
    sectionDefinitions,
    totalSteps,
    visibleSections,
    wizardData
  ]);


  const stepItems = useMemo(() => getStepItems(config, visibleSections), [config, visibleSections]);

  const menuItems = stepItems.map((step, index) => {
    const isActive = currentStep === index;
    const isDone = (wizardData.completedSteps || []).includes(index);
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
          <div className="sidebar-menu-title">{step.title}</div>
          <div className="sidebar-menu-meta" />
        </div>
      ),
      className: `sidebar-menu-item ${isDone ? 'completed' : ''} ${isActive ? 'active' : ''}`
    };
  });

  const renderBodyForCurrent = () => {
    const stepSectionIndex = getSectionIndexForStep(currentStep, sectionDefinitions, visibleSections, hasInputStep);

    return (
      <>
        {hasInputStep && currentStep === 0 && (
          <InputStep
            config={config}
            wizardData={wizardData}
            handleDataUpdate={handleDataUpdate}
            handleStepComplete={handleStepComplete}
          />
        )}
        {typeof stepSectionIndex === 'number' && (
          <SectionStep
            section={sectionDefinitions[stepSectionIndex]}
            sectionIndex={stepSectionIndex}
            sections={sectionDefinitions}
            wizardData={wizardData}
            updateSectionData={updateSectionData}
            config={config}
            getFormFieldValue={(fieldId) => aggregatedFormData[fieldId]}
            disabledFields={wizardData.disabledFields || []}
            onUpdateResponseId={updateAnalysisContext}
          />
        )}
        {!hasInputStep && currentStep === visibleSections.length && (
          <PDFStep config={config} sections={sectionDefinitions} wizardData={wizardData} />
        )}
        {hasInputStep && currentStep === visibleSections.length + 1 && (
          <PDFStep config={config} sections={sectionDefinitions} wizardData={wizardData} />
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: 'hsl(var(--muted-foreground))'
        }}
      >
        Loading wizard...
      </div>
    );
  }
  return (
    <div className={`ai-analysis-wizard ${isFullscreen ? 'fullscreen' : ''}`} style={{ height: '100%', minHeight: 0, padding: 0 }}>
      <WizardHeader
        config={config}
        currentStep={currentStep}
        totalSteps={stepItems.length}
        isFullscreen={isFullscreen}
        onClose={closeWizard}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <div className="wizard-doc-layout">
        <WizardSidebar menuItems={menuItems} currentStep={currentStep} handleStepChange={handleStepChange} />
        <main className="wizard-content" role="region" aria-label="Wizard content" style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
          {renderBodyForCurrent()}
        </main>
      </div>

      <WizardFooter
        gadget={gadget}
        currentStep={currentStep}
        totalSteps={stepItems.length}
        isAtLast={currentStep >= stepItems.length - 1}
        goPrev={goPrev}
        handleStepComplete={handleStepComplete}
        wizardData={wizardData}
      />
    </div>
  );
};
