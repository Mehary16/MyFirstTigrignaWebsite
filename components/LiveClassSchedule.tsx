import type { LiveClassRow } from './TeacherLiveClassManager';

type LiveClassScheduleProps = {
  classes: LiveClassRow[];
  title?: string;
};

export default function LiveClassSchedule({ classes, title = 'Upcoming Live Classes' }: LiveClassScheduleProps) {
  const now = Date.now();
  const upcoming = classes.filter((item) => new Date(item.scheduled_at).getTime() >= now - item.duration_minutes * 60 * 1000);
  const sorted = [...upcoming].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  return (
    <section id="student-live-classes" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      {!sorted.length ? (
        <p className="mt-4 text-slate-600">No upcoming live classes scheduled.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((liveClass) => (
            <article key={liveClass.id} id={`live-class-${liveClass.id}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{liveClass.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(liveClass.scheduled_at).toLocaleString()} · {liveClass.duration_minutes} minutes
              </p>
              {liveClass.notes && <p className="mt-2 text-sm text-slate-500">{liveClass.notes}</p>}
              <a
                href={liveClass.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Join class
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
