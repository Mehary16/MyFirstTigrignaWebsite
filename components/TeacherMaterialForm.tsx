'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { uploadLessonMaterial } from '../lib/lessonMaterials';
import {
  DOCUMENT_ACCEPT,
  formatUploadLimit,
  getMaxUploadBytes,
  MATERIAL_CATEGORY_LABELS,
  MEDIA_ACCEPT,
  type MaterialCategory
} from '../lib/teacherMaterials';
import { prepareTeacherAccount } from '../lib/teacherUpload';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import type { ClassGrade } from '../lib/classGrades';
import ClassGradeSelect from './ClassGradeSelect';

type StatusType = 'success' | 'error' | null;

type TeacherMaterialFormProps = {
  category: MaterialCategory;
};

const FORM_COPY: Record<
  MaterialCategory,
  { heading: string; fileLabel: string; placeholder: string; uploadLabel: string; success: string; accept: string }
> = {
  document: {
    heading: 'Upload a file or add an external link. Free plan: up to 50 MB per file.',
    fileLabel: 'Upload document (PDF, Word, Excel, PowerPoint, image, text)',
    placeholder: 'Document title',
    uploadLabel: 'Upload document',
    success: 'Document successfully uploaded.',
    accept: DOCUMENT_ACCEPT
  },
  media: {
    heading: 'Upload a lesson video or audio clip. Free plan: up to 50 MB per file — use an external link for longer videos.',
    fileLabel: 'Upload video or audio (MP4, WebM, MOV, MP3, WAV, etc.)',
    placeholder: 'Video or audio title',
    uploadLabel: 'Upload video / audio',
    success: 'Video or audio successfully uploaded.',
    accept: MEDIA_ACCEPT
  }
};

export default function TeacherMaterialForm({ category }: TeacherMaterialFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const copy = FORM_COPY[category];
  const [title, setTitle] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade | ''>('');
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
        setStatus(`Upload failed: Please provide a title for this ${MATERIAL_CATEGORY_LABELS[category].toLowerCase()} item.`);
        return;
      }

      if (!file && !externalLink.trim()) {
        setStatusType('error');
        setStatus('Upload failed: Choose a file or provide an external link.');
        return;
      }

      if (!classGrade) {
        setStatusType('error');
        setStatus('Upload failed: Please select a class grade for this material.');
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatusType('error');
        setStatus('Upload failed: You must be logged in.');
        return;
      }

      await prepareTeacherAccount(supabase, user);

      let fileUrl = '';
      let fileName: string | null = null;

      if (file) {
        fileUrl = await uploadLessonMaterial(supabase, user.id, file, category);
        fileName = file.name;
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          fileUrl: fileUrl || null,
          externalLink: externalLink.trim() || null,
          fileName,
          classGrade,
          materialCategory: category
        })
      });

      const payload = (await response.json()) as { error?: string; notificationMessage?: string };

      if (!response.ok) {
        setStatusType('error');
        setStatus(`Upload failed: ${payload.error ?? 'Unknown error'}`);
        return;
      }

      setTitle('');
      setExternalLink('');
      setClassGrade('');
      setFile(null);
      setStatusType('success');
      setStatus(payload.notificationMessage ?? copy.success);
      router.refresh();
    } catch (err) {
      setStatusType('error');
      setStatus(`Upload failed: ${err instanceof Error ? err.message : 'Network error.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600">{copy.heading}</p>

      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder={copy.placeholder}
        />
      </div>

      <ClassGradeSelect value={classGrade} onChange={setClassGrade} disabled={loading} />

      <div>
        <label className="block text-sm font-medium text-slate-700">{copy.fileLabel}</label>
        <p className="mt-1 text-xs text-slate-500">Maximum file size: {formatUploadLimit(getMaxUploadBytes(category))}</p>
        <input
          type="file"
          accept={copy.accept}
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
          placeholder="YouTube, Google Drive, or other link"
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
        {loading ? 'Uploading...' : copy.uploadLabel}
      </button>
    </form>
  );
}
