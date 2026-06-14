'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLessonMaterialFile } from '../lib/lessonMaterials';
import { formatDatabaseError } from '../lib/supabaseErrors';
import { prepareTeacherAccount } from '../lib/teacherUpload';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export type DocumentRow = {
  id: string;
  title: string;
  file_url: string | null;
  external_link: string | null;
  created_at: string;
};

type TeacherDocumentListProps = {
  initialDocuments: DocumentRow[];
};

export default function TeacherDocumentList({ initialDocuments }: TeacherDocumentListProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [documents, setDocuments] = useState(initialDocuments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExternalLink, setEditExternalLink] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const startEdit = (doc: DocumentRow) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditExternalLink(doc.external_link ?? '');
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditExternalLink('');
  };

  const handleSave = async (docId: string) => {
    if (!editTitle.trim()) {
      setStatus('Document title is required.');
      return;
    }

    setBusyId(docId);
    setStatus(null);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('You must be logged in as a teacher.');
        return;
      }

      await prepareTeacherAccount(supabase, user);

      const { data, error } = await supabase
        .from('documents')
        .update({
          title: editTitle.trim(),
          external_link: editExternalLink.trim() || null
        })
        .eq('id', docId)
        .select('id, title, file_url, external_link, created_at')
        .single();

      if (error) {
        setStatus(formatDatabaseError(error.message));
        return;
      }

      setDocuments((current) => current.map((doc) => (doc.id === docId ? data : doc)));
      cancelEdit();
      setStatus('Document updated.');
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not update document.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (doc: DocumentRow) => {
    const confirmed = window.confirm(`Remove "${doc.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyId(doc.id);
    setStatus(null);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('You must be logged in as a teacher.');
        return;
      }

      await prepareTeacherAccount(supabase, user);
      await deleteLessonMaterialFile(supabase, doc.file_url);

      const { error } = await supabase.from('documents').delete().eq('id', doc.id);

      if (error) {
        setStatus(formatDatabaseError(error.message));
        return;
      }

      setDocuments((current) => current.filter((item) => item.id !== doc.id));
      if (editingId === doc.id) cancelEdit();
      setStatus('Document removed.');
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not remove document.');
    } finally {
      setBusyId(null);
    }
  };

  if (!documents.length) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h3 className="text-lg font-semibold text-slate-900">Uploaded documents</h3>
      <p className="mt-1 text-sm text-slate-600">Edit titles or links, or remove documents you no longer need.</p>

      {status && (
        <p role="status" className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {status}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {documents.map((doc) => {
          const isEditing = editingId === doc.id;
          const isBusy = busyId === doc.id;

          return (
            <li key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Document title</label>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.currentTarget.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">External link (optional)</label>
                    <input
                      type="url"
                      value={editExternalLink}
                      onChange={(event) => setEditExternalLink(event.currentTarget.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSave(doc.id)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
                    >
                      {isBusy ? 'Saving...' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={cancelEdit}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{doc.title}</p>
                    <p className="text-sm text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Download PDF
                      </a>
                    )}
                    {doc.external_link && (
                      <a
                        href={doc.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        External link
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => startEdit(doc)}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(doc)}
                      className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {isBusy ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
