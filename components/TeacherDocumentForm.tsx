'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { uploadLessonMaterialPdf } from '../lib/lessonMaterials';
import { formatDatabaseError } from '../lib/supabaseErrors';
import { prepareTeacherAccount } from '../lib/teacherUpload';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

type StatusType = 'success' | 'error' | null;

export default function TeacherDocumentForm() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
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

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatusType('error');
        setStatus('Document upload failed: You must be logged in to upload materials.');
        return;
      }

      await prepareTeacherAccount(supabase, user);

      let fileUrl = '';

      if (file) {
        fileUrl = await uploadLessonMaterialPdf(supabase, user.id, file);
      }

      const { error: insertError } = await supabase.from('documents').insert([
        {
          title: title.trim(),
          file_url: fileUrl || null,
          external_link: externalLink.trim() || null
        }
      ]);

      if (insertError) {
        setStatusType('error');
        setStatus(`Document upload failed: ${formatDatabaseError(insertError.message)}`);
        return;
      }

      setTitle('');
      setExternalLink('');
      setFile(null);
      setStatusType('success');
      setStatus('Document successfully uploaded.');
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
