import { act, renderHook } from '@testing-library/react';
import { message } from 'antd';
import { useWizardRecordSave } from '../../../../../../hooks/useWizardRecordSave';

jest.mock('../../../../../../services/HttpClient', () => ({
  httpClient: {
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn()
  }
}));

const mockHttpClient = require('../../../../../../services/HttpClient').httpClient as {
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
};

describe('useWizardRecordSave', () => {
  beforeEach(() => {
    mockHttpClient.post.mockReset();
    mockHttpClient.put.mockReset();
    mockHttpClient.patch.mockReset();
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('persists create requests and records identifiers generically', async () => {
    const payloadResult = { id: 'abc-123' };
    mockHttpClient.post.mockResolvedValue({
      json: jest.fn().mockResolvedValue(payloadResult)
    });

    const { result } = renderHook(() =>
      useWizardRecordSave({
        endpoints: {
          create: { url: '/api/wizard-records', method: 'POST' },
          update: { url: '/api/wizard-records/{id}', method: 'PUT' },
          progress: { url: '/api/wizard-records/{id}', method: 'PATCH' }
        },
        resolveRecordId: (response) => response?.id,
        successMessages: {
          create: 'Saved'
        }
      })
    );

    await act(async () => {
      await result.current.saveRecord({
        payload: { foo: 'bar' }
      });
    });

    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/wizard-records', { foo: 'bar' });
    expect(result.current.recordId).toBe('abc-123');
    expect(message.success).toHaveBeenCalledWith('Saved');
  });

  it('routes progress updates through PATCH when configured', async () => {
    const createResponse = { id: 'xyz-789' };
    mockHttpClient.post.mockResolvedValue({
      json: jest.fn().mockResolvedValue(createResponse)
    });
    const progressResponse = { id: 'xyz-789', stage: 'mid' };
    mockHttpClient.patch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(progressResponse)
    });

    const { result } = renderHook(() =>
      useWizardRecordSave({
        endpoints: {
          create: { url: '/api/wizard-records', method: 'POST' },
          update: { url: '/api/wizard-records/{id}', method: 'PUT' },
          progress: { url: '/api/wizard-records/{id}/progress', method: 'PATCH' }
        },
        resolveRecordId: (response) => response?.id
      })
    );

    await act(async () => {
      await result.current.saveRecord({
        payload: { seed: true }
      });
    });

    expect(result.current.recordId).toBe('xyz-789');

    await act(async () => {
      await result.current.saveRecordProgress({
        payload: { partial: true }
      });
    });

    expect(mockHttpClient.patch).toHaveBeenCalledWith('/api/wizard-records/xyz-789/progress', { partial: true });
    expect(result.current.recordId).toBe('xyz-789');
  });
});
