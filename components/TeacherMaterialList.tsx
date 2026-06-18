'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLessonMaterialFile } from '../lib/lessonMaterials';
import {
  getMaterialDownloadLabel,
  inferMediaKind,
  MATERIAL_CATEGORY_LABELS,
  normalizeMaterialCategory,
  type MaterialCategory,
  type MaterialRow
} from '../lib/teacherMaterials';
import { formatDatabaseError } from '../lib/supabaseErrors';
import { prepareTeacherAccount } from '../lib/teacherUpload';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

type TeacherMaterialListProps = {
  category: MaterialCategory;
  initialMaterials: MaterialRow[];
};

function MaterialPreview({ material }: { material: MaterialRow }) {
  if (!material.file_url) return null;

  const mediaKind = inferMediaKind(undefined, material.file_url, material.file_name);

  if (material.material_category === 'media' && mediaKind === 'video') {
    return (
      <video controls className="mt-3 w-full max-w-xl rounded-2xl border border-slate-200 bg-black" src={material.file_url}>
        Your browser does not support video playback.
      </video>
    );
  }

  if (material.material_category === 'media' && mediaKind === 'audio') {
    return (
      <audio controls className="mt-3 w-full max-w-xl" src={material.file_url}>
        Your browser does not support audio playback.
      </audio>
    );
  }

  return null;
}

export default function TeacherMaterialList({ category, initialMaterials }: TeacherMaterialListProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const filteredMaterials = useMemo(
    () => initialMaterials.filter((item) => normalizeMaterialCategory(item.material_category) === category),
    [initialMaterials, category]
  );
  const [materials, setMaterials] = useState(filteredMaterials);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExternalLink, setEditExternalLink] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const materialsSignature = useMemo(
    () =>
      filteredMaterials
        .map((item) => `${item.id}|${item.title}|${item.external_link ?? ''}|${item.file_url ?? ''}`)
        .join(';'),
    [filteredMaterials]
  );

  useEffect(() => {
    setMaterials(filteredMaterials);
  }, [materialsSignature, filteredMaterials]);

  const startEdit = (material: MaterialRow) => {
    setEditingId(material.id);
    setEditTitle(material.title);
    setEditExternalLink(material.external_link ?? '');
    setStatus(null);
    setEditFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditExternalLink('');
    setEditFeedback(null);
  };

  const handleSave = async (materialId: string) => {
    if (!editTitle.trim()) {
      setEditFeedback({ type: 'error', message: 'Title is required.' });
      return;
    }

    setBusyId(materialId);
    setStatus(null);
    setEditFeedback(null);

    try {
      const response = await fetch('/api/documents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: materialId,
          title: editTitle.trim(),
          externalLink: editExternalLink.trim() || null
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        material?: MaterialRow;
      };

      if (!response.ok || payload.error || !payload.material) {
        setEditFeedback({
          type: 'error',
          message: payload.error ?? 'Could not save changes.'
        });
        return;
      }

      const updated = payload.material;

      setMaterials((items) => items.map((item) => (item.id === materialId ? updated : item)));
      cancelEdit();
      setStatus('Updated successfully.');
      router.refresh();
    } catch (err) {
      setEditFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not update item.'
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (material: MaterialRow) => {
    const confirmed = window.confirm(`Remove "${material.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyId(material.id);
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
      await deleteLessonMaterialFile(supabase, material.file_url);

      const { error } = await supabase.from('documents').delete().eq('id', material.id);

      if (error) {
        setStatus(formatDatabaseError(error.message));
        return;
      }

      setMaterials((current) => current.filter((item) => item.id !== material.id));
      if (editingId === material.id) cancelEdit();
      setStatus('Removed successfully.');
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not remove item.');
    } finally {
      setBusyId(null);
    }
  };

  if (!materials.length) {
    return (
      <p className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-600">
        No {MATERIAL_CATEGORY_LABELS[category].toLowerCase()} uploaded yet.
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h3 className="text-lg font-semibold text-slate-900">Uploaded {MATERIAL_CATEGORY_LABELS[category].toLowerCase()}</h3>
      <p className="mt-1 text-sm text-slate-600">Edit titles or links, or remove items you no longer need.</p>

      {status && (
        <p role="status" className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {status}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {materials.map((material) => {
          const isEditing = editingId === material.id;
          const isBusy = busyId === material.id;

          return (
            <li key={material.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Title</label>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.currentTarget.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">External link (optional)</label>
                    <input
                      value={editExternalLink}
                      onChange={(event) => setEditExternalLink(event.currentTarget.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  {editFeedback && (
                    <p
                      role="alert"
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        editFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {editFeedback.message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSave(material.id)}
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
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{material.title}</p>
                      {material.file_name && <p className="text-sm text-slate-500">{material.file_name}</p>}
                      <p className="text-sm text-slate-500">{new Date(material.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                        >
                          {getMaterialDownloadLabel(material)}
                        </a>
                      )}
                      {material.external_link && (
                        <a
                          href={material.external_link}
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
                        onClick={() => startEdit(material)}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(material)}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {isBusy ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                  <MaterialPreview material={material} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
