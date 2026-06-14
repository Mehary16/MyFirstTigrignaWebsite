export async function readJsonResponse<T extends { error?: string; message?: string }>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.includes('Request Entity Too Large') || response.status === 413) {
      throw new Error('File is too large for the server to accept. Try a smaller PDF (under 15 MB).');
    }

    throw new Error(text.slice(0, 200));
  }
}
