'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

type TeacherAnnouncementManagerProps = {
  initialAnnouncements: AnnouncementRow[];
};

export default function TeacherAnnouncementManager({ initialAnnouncements }: TeacherAnnouncementManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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
        .from('announcements')
        .insert([{ teacher_id: userData.user.id, title: title.trim(), body: body.trim() }])
        .select('id, title, body, created_at')
        .single();

      if (error) {
        setStatus(`Could not post announcement: ${error.message}`);
        return;
      }

      setAnnouncements((current) => [data as AnnouncementRow, ...current]);
      setTitle('');
      setBody('');
      setStatus('Announcement posted.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setAnnouncements((current) => current.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Announcements</h2>
        <p className="mt-2 text-slate-600">Share updates with all students and parents.</p>
      </div>

      <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreate}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.currentTarget.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400">
          {loading ? 'Posting...' : 'Post announcement'}
        </button>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {announcements.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
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
