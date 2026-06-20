import type { AnnouncementRow } from './TeacherAnnouncementManager';

type AnnouncementsFeedProps = {
  announcements: AnnouncementRow[];
  title?: string;
};

export default function AnnouncementsFeed({ announcements, title = 'Announcements' }: AnnouncementsFeedProps) {
  if (!announcements.length) return null;

  return (
    <section className="rounded-[2rem] border border-blue-100 bg-blue-50/50 p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {announcements.map((item) => (
          <article key={item.id} className="rounded-2xl border border-blue-100 bg-white p-4">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
