import { message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { httpClient } from '../services/HttpClient';

type HttpMethod = 'POST' | 'PUT' | 'PATCH';

export interface EndpointConfig {
  url: string;
  method: HttpMethod;
}

type SaveMode = 'create' | 'update' | 'progress';

export interface PersistRequest {
  payload: Record<string, any>;
  /**
   * Explicit record identifier to use for update requests.
   * If omitted the hook will fall back to the last known record id.
   */
  recordId?: string;
  /**
   * Override the resolved mode (create/update/progress).
   * When omitted the hook infers the mode from endpoint availability + record id.
   */
  mode?: SaveMode;
  /**
   * Override the endpoint information for this specific request.
   */
  endpointOverride?: EndpointConfig;
}

export interface WizardRecordSaveOptions {
  endpoints: {
    create: EndpointConfig;
    update: EndpointConfig;
    progress: EndpointConfig;
  };
  /**
   * Allows the caller to resolve the canonical record identifier from the server response.
   * Returning `undefined` leaves the previously known id untouched.
   */
  resolveRecordId: (response: any, request: PersistRequest) => string | undefined;
  /**
   * Success messages by save mode. If a specific mode is not provided no toast is shown.
   */
  successMessages?: Partial<Record<SaveMode, string>>;
  /**
   * Optional override for error messages per mode.
   */
  errorMessages?: Partial<Record<SaveMode, string>>;
}

const METHOD_MAP: Record<HttpMethod, keyof HttpClientDispatch> = {
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch'
};

type HttpClientDispatch = Pick<typeof httpClient, 'post' | 'put' | 'patch'>;

const normaliseMethod = (method: HttpMethod): HttpMethod => {
  const upper = method.toUpperCase() as HttpMethod;
  if (!METHOD_MAP[upper]) {
    throw new Error(`Unsupported HTTP method "${method}" supplied to useWizardRecordSave`);
  }
  return upper;
};

const applyRecordIdToUrl = (url: string, recordId?: string): string => {
  if (!recordId) {
    return url;
  }
  return url
    .replace('{id}', recordId)
    .replace(':id', recordId);
};

const tryParseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export interface WizardRecordSaveHook {
  recordId: string | null;
  saving: boolean;
  saveRecord: (request: PersistRequest) => Promise<any>;
  saveRecordProgress: (request: PersistRequest) => Promise<any>;
  setRecordId: (id: string | null) => void;
}

export const useWizardRecordSave = (options: WizardRecordSaveOptions): WizardRecordSaveHook => {
  if (!options?.endpoints?.create || !options?.endpoints?.update || !options?.endpoints?.progress) {
    throw new Error('useWizardRecordSave requires create, update, and progress endpoints');
  }
  if (typeof options.resolveRecordId !== 'function') {
    throw new Error('useWizardRecordSave requires a resolveRecordId function');
  }

  const [recordId, setRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const endpoints = useMemo(() => ({
    create: options.endpoints.create,
    update: options.endpoints.update,
    progress: options.endpoints.progress
  }), [options.endpoints.create, options.endpoints.update, options.endpoints.progress]);

  const resolveMode = useCallback((request: PersistRequest, currentId: string | null): SaveMode => {
    if (request.mode) {
      return request.mode;
    }

    const targetId = request.recordId ?? currentId;
    return targetId ? 'update' : 'create';
  }, []);

  // Derive which endpoint to hit for a given request, respecting overrides and available metadata
  const resolveEndpoint = useCallback((
    mode: SaveMode,
    request: PersistRequest,
    currentId: string | null
  ): { endpoint: EndpointConfig; resolvedMode: SaveMode; targetId: string | null } => {
    if (request.endpointOverride) {
      return { endpoint: request.endpointOverride, resolvedMode: mode, targetId: request.recordId ?? currentId };
    }

    const targetId = request.recordId ?? currentId;

    if (mode === 'progress') {
      if (!targetId) {
        throw new Error('Cannot persist progress without a record identifier');
      }
      return { endpoint: endpoints.progress, resolvedMode: 'progress', targetId };
    }

    if (mode === 'update') {
      if (!targetId) {
        throw new Error('Attempted to update a wizard record without an identifier');
      }
      return { endpoint: endpoints.update, resolvedMode: 'update', targetId };
    }

    return { endpoint: endpoints.create, resolvedMode: 'create', targetId };
  }, [endpoints]);

  // Single persistence pipeline that normalizes HTTP method, request URL, and record id bookkeeping
  const persist = useCallback(async (request: PersistRequest, explicitMode?: SaveMode) => {
    const mode = explicitMode ?? resolveMode(request, recordId);
    const { endpoint, resolvedMode, targetId } = resolveEndpoint(mode, request, recordId);

    const method = normaliseMethod(endpoint.method);
    const dispatchKey = METHOD_MAP[method];
    const requestUrl = applyRecordIdToUrl(endpoint.url, targetId ?? request.recordId);

    try {
      setSaving(true);
      const response = await httpClient[dispatchKey](requestUrl, request.payload);
      const result = await tryParseJson(response);

      if (options.successMessages?.[resolvedMode]) {
        message.success(options.successMessages[resolvedMode]);
      }

      let nextRecordId = targetId ?? request.recordId ?? recordId;

      if (resolvedMode === 'create') {
        const resolvedId = options.resolveRecordId(result ?? (response as any), request);
        if (resolvedId === undefined || resolvedId === null || resolvedId === '') {
          throw new Error('Wizard persistence could not resolve a record identifier from the create response');
        }
        nextRecordId = resolvedId;
      }

      if (nextRecordId && nextRecordId !== recordId) {
        setRecordId(nextRecordId);
      }

      return result ?? response;
    } catch (error) {
      const err = error as Error;
      const errorMessage = options.errorMessages?.[resolvedMode] ?? err.message;
      message.error(errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [recordId, options, resolveEndpoint, resolveMode]);

  const saveRecord = useCallback((request: PersistRequest) => persist(request, request.mode), [persist]);
  const saveRecordProgress = useCallback((request: PersistRequest) => {
    const inferredRecordId = request.recordId ?? recordId;
    if (!inferredRecordId) {
      throw new Error('Cannot persist wizard progress without a record identifier');
    }
    return persist(
      { ...request, recordId: inferredRecordId, mode: 'progress' },
      'progress'
    );
  }, [persist, recordId]);

  return {
    recordId,
    saving,
    saveRecord,
    saveRecordProgress,
    setRecordId
  };
};
