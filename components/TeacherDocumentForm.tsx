'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';

type StatusType = 'success' | 'error' | null;

export default function TeacherDocumentForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setStatusType(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        setStatusType('error');
        setStatus('Document upload failed: Please provide a document title.');
        return;
      }

      if (!file && !externalLink.trim()) {
        setStatusType('error');
        setStatus('Document upload failed: Upload a PDF or provide an external link.');
        return;
      }

      const body = new FormData();
      body.append('title', title.trim());
      body.append('externalLink', externalLink.trim());
      if (file) body.append('file', file);

      const response = await fetch('/api/documents/publish', {
        method: 'POST',
        body
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || payload.error) {
        setStatusType('error');
        setStatus(`Document upload failed: ${payload.error ?? 'Unknown error.'}`);
        return;
      }

      setTitle('');
      setExternalLink('');
      setFile(null);
      setStatusType('success');
      setStatus(payload.message ?? 'Document successfully uploaded.');
      router.refresh();
    } catch (err) {
      setStatusType('error');
      setStatus(`Document upload failed: ${err instanceof Error ? err.message : 'Network error.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-700">Document title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="PDF title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Upload PDF</label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-700 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">External link (optional)</label>
        <input
          type="url"
          value={externalLink}
          onChange={(event) => setExternalLink(event.currentTarget.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Optional reading or resource link"
        />
      </div>

      {status && (
        <p
          role="alert"
          className={`rounded-2xl px-4 py-3 text-sm ${
            statusType === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {status}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Uploading document...' : 'Upload document'}
      </button>
    </form>
  );
}
