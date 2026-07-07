'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import type { ClassGrade } from '../lib/classGrades';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import ClassGradeSelect from './ClassGradeSelect';

export type LiveClassRow = {
  id: string;
  title: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  class_grade: string | null;
  created_at: string;
};

const LIVE_CLASS_SELECT =
  'id, title, meeting_url, scheduled_at, duration_minutes, notes, class_grade, created_at';

type TeacherLiveClassManagerProps = {
  initialClasses: LiveClassRow[];
};

export default function TeacherLiveClassManager({ initialClasses }: TeacherLiveClassManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [classes, setClasses] = useState(initialClasses);
  const [title, setTitle] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade | ''>('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!classGrade) {
      setStatus('Please select a class grade for this live class.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          meetingUrl: meetingUrl.trim(),
          scheduledAt,
          durationMinutes: Number(duration) || 60,
          notes: notes.trim() || null,
          classGrade
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        liveClass?: LiveClassRow;
        notificationMessage?: string;
      };

      if (!response.ok || !payload.liveClass) {
        setStatus(`Could not schedule class: ${payload.error ?? 'Unknown error'}`);
        return;
      }

      setClasses((current) =>
        [payload.liveClass!, ...current].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      );
      setTitle('');
      setMeetingUrl('');
      setScheduledAt('');
      setNotes('');
      setClassGrade('');
      setStatus(payload.notificationMessage ?? 'Live class scheduled.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scheduled class?')) return;
    const { error } = await supabase.from('live_classes').delete().eq('id', id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setClasses((current) => current.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleCreate}>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <ClassGradeSelect value={classGrade} onChange={setClassGrade} disabled={loading} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Meeting URL</label>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Scheduled time</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
          <input type="number" min={15} value={duration} onChange={(e) => setDuration(e.currentTarget.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.currentTarget.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400">
            {loading ? 'Scheduling...' : 'Schedule live class'}
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {classes.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                {item.class_grade && <p className="mt-1 text-xs font-semibold text-blue-700">{item.class_grade}</p>}
                <p className="mt-1 text-sm text-slate-600">{new Date(item.scheduled_at).toLocaleString()} · {item.duration_minutes} min</p>
                {item.notes && <p className="mt-2 text-sm text-slate-500">{item.notes}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(item.id)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
