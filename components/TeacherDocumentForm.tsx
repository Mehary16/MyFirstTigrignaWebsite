'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export default function TeacherDocumentForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [title, setTitle] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        setStatus('Please provide a document title.');
        return;
      }

      if (!file && !externalLink.trim()) {
        setStatus('Upload a PDF or provide an external link.');
        return;
      }

      let fileUrl = '';

      if (file) {
        const body = new FormData();
        body.append('file', file);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body
        });

        const payload = (await response.json()) as { fileUrl?: string; error?: string };

        if (!response.ok || !payload.fileUrl) {
          setStatus(payload.error ? `Upload failed: ${payload.error}` : 'Upload failed.');
          return;
        }

        fileUrl = payload.fileUrl;
      }

      const { error } = await supabase.from('documents').insert([
        {
          title: title.trim(),
          file_url: fileUrl || null,
          external_link: externalLink.trim() || null
        }
      ]);

      if (error) {
        setStatus(`Document save failed: ${error.message}`);
        return;
      }

      setTitle('');
      setExternalLink('');
      setFile(null);
      setStatus('Document uploaded successfully.');
      router.refresh();
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
        <p className={`text-sm ${status.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}`}>{status}</p>
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
