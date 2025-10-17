import type {
  AIAnalysisWizardConfig,
  AIAnalysisWizardData,
  WizardIdentityConfig
} from '../AIAnalysisWizardGadget.types';

/** Determine a stable id from URL params if present. */
export function getStableRestoreIdFromUrl(
  paramKeys: string[] = ['documentId', 'restoreId', 'id', 'planId', 'recordId', 'wizardId']
): string | null {
  try {
    const url = new URL(window.location.href);
    for (const key of paramKeys) {
      const value = url.searchParams.get(key);
      if (value) {
        return value;
      }
    }
  } catch {
    // ignore errors triggered by malformed URLs
  }
  return null;
}

// Removed localStorage reading - all data should come from the database via API

export async function tryFetchRecordFromApi(id: string): Promise<any | null> {
  const tryFetch = async (base: string, endpoint: string) => {
    const { BaseGadget } = await import('../../../base');
    const response = await BaseGadget.makeAuthenticatedFetch(`${base}${endpoint}`);
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Invalid content-type');
    }
    return response.json();
  };

  const endpoint = `/api/wizard/${encodeURIComponent(id)}`;

  try {
    return await tryFetch('', endpoint);
  } catch {
    const origin = `${window.location.protocol}//localhost:4000`;
    try {
      return await tryFetch(origin, endpoint);
    } catch {
      return null;
    }
  }
}

const isPlainObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object';

const normaliseNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
};

const normaliseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (entry == null ? null : String(entry)))
    .filter((entry): entry is string => Boolean(entry));
};

type SectionState = NonNullable<AIAnalysisWizardData['sections']>[number];
type SectionSnapshot = Partial<SectionState> & { id?: string };

const toFormData = (value: unknown): Record<string, any> =>
  isPlainObject(value) ? (value as Record<string, any>) : {};

const sanitiseConfiguredSection = (
  sectionConfig: NonNullable<AIAnalysisWizardConfig['steps']['sections']>[number],
  snapshotSection?: SectionSnapshot
): SectionState => {
  if (!sectionConfig?.id) {
    throw new Error('Wizard section metadata requires an id for restoration');
  }

  const base: SectionState = {
    id: sectionConfig.id,
    title: snapshotSection?.title ?? sectionConfig.title ?? sectionConfig.id,
    formData: toFormData(snapshotSection?.formData)
  };

  if (snapshotSection?.imagesCollapsed !== undefined) {
    base.imagesCollapsed = snapshotSection.imagesCollapsed;
  }
  if (isPlainObject(snapshotSection?.voiceData)) {
    base.voiceData = snapshotSection?.voiceData;
  }
  if (snapshotSection?.textData !== undefined) {
    base.textData = snapshotSection.textData;
  }
  const snapshotImages = snapshotSection?.images;
  if (Array.isArray(snapshotImages)) {
    base.images = snapshotImages;
  }
  const snapshotImageAnalysis = snapshotSection?.imageAnalysis;
  if (snapshotImageAnalysis) {
    base.imageAnalysis = snapshotImageAnalysis;
  }
  const snapshotAnalysisData = snapshotSection?.analysisData;
  if (snapshotAnalysisData) {
    base.analysisData = snapshotAnalysisData;
  }

  return base;
};

const sanitiseAdhocSection = (snapshotSection: SectionSnapshot): SectionState => {
  if (!snapshotSection?.id) {
    throw new Error('Persisted wizard state contains a section without an id. Ensure persistence payloads include section identifiers.');
  }

  const base: SectionState = {
    id: snapshotSection.id,
    title: snapshotSection.title ?? snapshotSection.id,
    formData: toFormData(snapshotSection.formData)
  };

  if (snapshotSection.imagesCollapsed !== undefined) {
    base.imagesCollapsed = snapshotSection.imagesCollapsed;
  }
  if (isPlainObject(snapshotSection.voiceData)) {
    base.voiceData = snapshotSection.voiceData;
  }
  if (snapshotSection.textData !== undefined) {
    base.textData = snapshotSection.textData;
  }
  const additionalImages = snapshotSection.images;
  if (Array.isArray(additionalImages)) {
    base.images = additionalImages;
  }
  const additionalImageAnalysis = snapshotSection.imageAnalysis;
  if (additionalImageAnalysis) {
    base.imageAnalysis = additionalImageAnalysis;
  }
  const additionalAnalysisData = snapshotSection.analysisData;
  if (additionalAnalysisData) {
    base.analysisData = additionalAnalysisData;
  }

  return base;
};

const mergeSummary = (
  snapshotSummary: unknown,
  recordSummary: unknown,
  identity: WizardIdentityConfig,
  detectedTypeFallback: unknown
): Record<string, any> => {
  const merged: Record<string, any> = {
    ...(isPlainObject(snapshotSummary) ? snapshotSummary : {}),
    ...(isPlainObject(recordSummary) ? recordSummary : {})
  };

  merged.type = identity.recordType;
  merged.domain = identity.domain;
  if (identity.domainLabel) {
    merged.domainLabel = identity.domainLabel;
  }
  merged.domainType = identity.domainSubType;
  merged.domainSubType = identity.domainSubType;
  if (identity.domainTypeLabel) {
    merged.domainTypeLabel = identity.domainTypeLabel;
  }
  if (identity.domainSubTypeLabel) {
    merged.domainSubTypeLabel = identity.domainSubTypeLabel;
  }
  if (!merged.detectedType && detectedTypeFallback) {
    merged.detectedType = detectedTypeFallback;
  }

  return merged;
};

export function convertRecordToWizardData(
  recordData: any,
  config: AIAnalysisWizardConfig
): AIAnalysisWizardData {
  if (!isPlainObject(recordData)) {
    throw new Error('Wizard restore requires persisted record data');
  }

  const sectionDefinitions = Array.isArray(config?.steps?.sections) ? config.steps.sections : [];
  if (sectionDefinitions.length === 0) {
    throw new Error('Wizard configuration missing steps.sections metadata required for restoration');
  }

  const identity = (config as any).identity as WizardIdentityConfig | undefined;
  if (!identity) {
    throw new Error('Wizard configuration missing identity metadata required for restoration');
  }

  const snapshot = recordData.wizardState;
  if (!isPlainObject(snapshot)) {
    throw new Error('Wizard record payload missing wizardState snapshot');
  }

  const snapshotSections = Array.isArray(snapshot.sections) ? snapshot.sections : [];
  const configuredSections = sectionDefinitions.map((sectionConfig) => {
    const matched = snapshotSections.find((section: SectionSnapshot) => section?.id === sectionConfig.id);
    return sanitiseConfiguredSection(sectionConfig, matched);
  });

  const configuredIds = new Set(configuredSections.map((section) => section.id));
  const extraSections = snapshotSections
    .filter((section: SectionSnapshot) => section?.id && !configuredIds.has(section.id))
    .map((section: SectionSnapshot) => sanitiseAdhocSection(section));

  const resolvedSections = [...configuredSections, ...extraSections];

  const summary = mergeSummary(
    snapshot.summary,
    recordData.summary,
    identity,
    snapshot.detectedType ?? recordData.detectedType
  );

  const currentStep = Number.isFinite(snapshot.currentStep)
    ? Number(snapshot.currentStep)
    : Number(recordData.currentStep ?? 0) || 0;

  const completedSteps = normaliseNumberArray(snapshot.completedSteps ?? recordData.completedSteps);
  const disabledFields = normaliseStringArray(snapshot.disabledFields ?? recordData.disabledFields);

  const globalFormData = isPlainObject(snapshot.globalFormData)
    ? snapshot.globalFormData
    : isPlainObject(recordData.formData)
      ? recordData.formData
      : {};

  const voiceData = isPlainObject(snapshot.voiceData) ? snapshot.voiceData : {};
  const analysisData = isPlainObject(snapshot.analysisData) ? snapshot.analysisData : {};
  const grids = isPlainObject(snapshot.grids) ? snapshot.grids : {};
  const recordContext = isPlainObject(snapshot.recordContext)
    ? snapshot.recordContext
    : isPlainObject(recordData.recordContext)
      ? recordData.recordContext
      : {};
  const recordParams = isPlainObject(snapshot.recordParams)
    ? snapshot.recordParams
    : isPlainObject(recordData.recordParams)
      ? recordData.recordParams
      : {};

  const imageData = Array.isArray(snapshot.imageData) ? snapshot.imageData : [];

  return {
    recordType: identity.recordType,
    domain: identity.domain,
    domainLabel: identity.domainLabel,
    domainType: identity.domainSubType,
    domainTypeLabel: identity.domainTypeLabel ?? identity.domainSubTypeLabel,
    domainSubType: identity.domainSubType,
    domainSubTypeLabel: identity.domainSubTypeLabel ?? identity.domainTypeLabel,
    currentStep,
    completedSteps,
    sections: resolvedSections,
    voiceData,
    textData: snapshot.textData,
    imageData,
    analysisData,
    summary,
    grids,
    globalFormData,
    disabledFields,
    recordContext,
    recordParams,
    detectedType: summary.detectedType
  };
}
