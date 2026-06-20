'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export type LiveClassRow = {
  id: string;
  title: string;
  meeting_url: string;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
};

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
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('live_classes')
        .insert([
          {
            teacher_id: userData.user.id,
            title: title.trim(),
            meeting_url: meetingUrl.trim(),
            scheduled_at: new Date(scheduledAt).toISOString(),
            duration_minutes: Number(duration) || 60,
            notes: notes.trim() || null
          }
        ])
        .select('id, title, meeting_url, scheduled_at, duration_minutes, notes, created_at')
        .single();

      if (error) {
        setStatus(`Could not schedule class: ${error.message}`);
        return;
      }

      setClasses((current) => [data as LiveClassRow, ...current].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
      setTitle('');
      setMeetingUrl('');
      setScheduledAt('');
      setNotes('');
      setStatus('Live class scheduled.');
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
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Live Classes</h2>
        <p className="mt-2 text-slate-600">Schedule Zoom or Google Meet sessions for students and parents.</p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleCreate}>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Class title</label>
          <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Meeting link</label>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.currentTarget.value)} required placeholder="https://zoom.us/j/..." className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Date & time</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
          <input type="number" min={15} max={180} value={duration} onChange={(e) => setDuration(e.currentTarget.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.currentTarget.value)} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400">
            {loading ? 'Saving...' : 'Schedule class'}
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {classes.length ? (
          classes.map((liveClass) => (
            <article key={liveClass.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{liveClass.title}</h3>
                <p className="text-sm text-slate-600">{new Date(liveClass.scheduled_at).toLocaleString()} · {liveClass.duration_minutes} min</p>
                {liveClass.notes && <p className="mt-1 text-sm text-slate-500">{liveClass.notes}</p>}
                <a href={liveClass.meeting_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Open meeting link
                </a>
              </div>
              <button type="button" onClick={() => handleDelete(liveClass.id)} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                Delete
              </button>
            </article>
          ))
        ) : (
          <p className="text-slate-600">No live classes scheduled.</p>
        )}
      </div>
    </div>
  );
}
