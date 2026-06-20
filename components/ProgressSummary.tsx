type ProgressSummaryProps = {
  lessonsViewed: number;
  totalLessons: number;
  submissionsCount: number;
  gradesCount: number;
  upcomingClasses: number;
  label?: string;
};

export default function ProgressSummary({
  lessonsViewed,
  totalLessons,
  submissionsCount,
  gradesCount,
  upcomingClasses,
  label = 'Your Progress'
}: ProgressSummaryProps) {
  const lessonPercent = totalLessons ? Math.round((lessonsViewed / totalLessons) * 100) : 0;

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-6">
      <h2 className="text-xl font-semibold text-slate-950">{label}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Lessons viewed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {lessonsViewed}/{totalLessons}
          </p>
          <p className="mt-1 text-xs text-slate-500">{lessonPercent}% of library</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Homework submitted</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{submissionsCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Grades received</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{gradesCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">Upcoming classes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{upcomingClasses}</p>
        </div>
      </div>
    </section>
  );
}
