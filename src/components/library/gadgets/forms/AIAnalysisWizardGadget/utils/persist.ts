/** Persistence helpers for API posting. */

export type PersistSnapshot = {
  id: string;
  gadgetId: string;
  configId: string;
  timestamp: string;
  data: unknown;
};

// Legacy API endpoints - kept for backward compatibility
// New inspection data should use the inspection API endpoints

export async function postProgressToApi(baseUrl: string, payload: PersistSnapshot): Promise<unknown> {
  const url = `${baseUrl}/api/wizard`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export async function putProgressToApi(baseUrl: string, id: string, payload: PersistSnapshot): Promise<unknown> {
  const url = `${baseUrl}/api/wizard/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}