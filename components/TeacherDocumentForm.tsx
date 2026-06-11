'use client';

import { useState, type FormEvent } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { STORAGE_BUCKETS } from '../lib/storageBuckets';

export default function TeacherDocumentForm() {
  const supabase = createBrowserSupabaseClient();
  const [title, setTitle] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        setStatus('Please provide a document title.');
        return;
      }

      let fileUrl = '';

      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.lessonMaterials)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/pdf'
          });

        if (uploadError) {
          setStatus(`Upload failed: ${uploadError.message}`);
          return;
        }

        const { data: publicUrlData } = await supabase.storage
          .from(STORAGE_BUCKETS.lessonMaterials)
          .getPublicUrl(uploadData.path);

        fileUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('documents').insert([
        {
          title,
          file_url: fileUrl || null,
          external_link: externalLink || null
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
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="PDF title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Upload PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-700 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">External link (optional)</label>
        <input
          type="url"
          value={externalLink}
          onChange={(event) => setExternalLink(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Optional reading or resource link"
        />
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}

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
