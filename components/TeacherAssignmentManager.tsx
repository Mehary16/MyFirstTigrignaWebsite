'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  lesson_id: string | null;
  created_at: string;
};

type TeacherAssignmentManagerProps = {
  initialAssignments: AssignmentRow[];
};

export default function TeacherAssignmentManager({ initialAssignments }: TeacherAssignmentManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setStatus('You must be logged in.');
        return;
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            teacher_id: userData.user.id,
            title: title.trim(),
            description: description.trim() || null,
            due_date: dueDate ? new Date(dueDate).toISOString() : null
          }
        ])
        .select('id, title, description, due_date, lesson_id, created_at')
        .single();

      if (error) {
        setStatus(`Could not create assignment: ${error.message}`);
        return;
      }

      setAssignments((current) => [data as AssignmentRow, ...current]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('Assignment created.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assignment? Existing submissions will stay but lose the link.')) return;

    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      setStatus(`Delete failed: ${error.message}`);
      return;
    }

    setAssignments((current) => current.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Homework Assignments</h2>
        <p className="mt-2 text-slate-600">Create structured tasks with due dates for students to submit against.</p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleCreate}>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            required
            placeholder="Week 3 — Reading practice"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Due date (optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {loading ? 'Creating...' : 'Create assignment'}
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {assignments.length ? (
          assignments.map((assignment) => (
            <article key={assignment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                {assignment.description && <p className="mt-1 text-sm text-slate-600">{assignment.description}</p>}
                {assignment.due_date && (
                  <p className="mt-1 text-xs text-amber-700">
                    Due: {new Date(assignment.due_date).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(assignment.id)}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </article>
          ))
        ) : (
          <p className="text-slate-600">No assignments yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
