'use client';

import { useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LESSON_LEVELS, LESSON_LEVEL_LABELS, type LessonLevel } from '../lib/lessonLevels';

export type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  category: string | null;
  level: string | null;
  external_link: string | null;
  created_at: string;
};

type TeacherLessonListProps = {
  initialLessons: LessonRow[];
};

export default function TeacherLessonList({ initialLessons }: TeacherLessonListProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLevel, setEditLevel] = useState<LessonLevel | ''>('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editExternalLink, setEditExternalLink] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const startEdit = (lesson: LessonRow) => {
    setEditingId(lesson.id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description ?? '');
    setEditCategory(lesson.category ?? '');
    setEditLevel((lesson.level as LessonLevel) ?? '');
    setEditVideoUrl(lesson.video_url);
    setEditExternalLink(lesson.external_link ?? '');
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setStatus(null);
  };

  const handleSave: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    setBusyId(editingId);
    setStatus(null);

    const response = await fetch(`/api/lessons/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
        level: editLevel || null,
        videoUrl: editVideoUrl.trim(),
        externalLink: editExternalLink.trim() || null
      })
    });

    const payload = (await response.json()) as { error?: string };
    setBusyId(null);

    if (!response.ok) {
      setStatus(payload.error ?? 'Update failed.');
      return;
    }

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === editingId
          ? {
              ...lesson,
              title: editTitle.trim(),
              description: editDescription.trim() || null,
              category: editCategory.trim() || null,
              level: editLevel || null,
              video_url: editVideoUrl.trim(),
              external_link: editExternalLink.trim() || null
            }
          : lesson
      )
    );
    setEditingId(null);
    setStatus('Lesson updated.');
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this lesson?')) return;

    setBusyId(id);
    const response = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
    const payload = (await response.json()) as { error?: string };
    setBusyId(null);

    if (!response.ok) {
      setStatus(payload.error ?? 'Delete failed.');
      return;
    }

    setLessons((current) => current.filter((lesson) => lesson.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Lesson Library</h2>
        <p className="mt-2 text-slate-600">Edit or remove lessons. Set a level so students can find the right content.</p>
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      {!lessons.length && <p className="text-slate-600">No lessons yet.</p>}

      <div className="space-y-4">
        {lessons.map((lesson) =>
          editingId === lesson.id ? (
            <form key={lesson.id} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4" onSubmit={handleSave}>
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.currentTarget.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.currentTarget.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
                placeholder="Description"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={editLevel}
                  onChange={(event) => setEditLevel(event.currentTarget.value as LessonLevel | '')}
                  className="rounded-xl border border-slate-300 bg-white p-3"
                >
                  <option value="">No level</option>
                  {LESSON_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {LESSON_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
                <input
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.currentTarget.value)}
                  className="rounded-xl border border-slate-300 bg-white p-3"
                  placeholder="Topic (Grammar, Vocabulary...)"
                />
              </div>
              <input
                value={editVideoUrl}
                onChange={(event) => setEditVideoUrl(event.currentTarget.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
                placeholder="Video URL"
              />
              <input
                value={editExternalLink}
                onChange={(event) => setEditExternalLink(event.currentTarget.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3"
                placeholder="External link (optional)"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={busyId === lesson.id} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
                <button type="button" onClick={cancelEdit} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <article key={lesson.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{lesson.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {lesson.level && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-800">{lesson.level}</span>
                    )}
                    {lesson.category && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">{lesson.category}</span>
                    )}
                  </div>
                  {lesson.description && <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/student/lessons/${lesson.id}`}
                    target="_blank"
                    className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    Preview
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(lesson)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyId === lesson.id}
                    onClick={() => handleDelete(lesson.id)}
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}
