import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/50">
        <h2 className="text-3xl font-semibold text-slate-900">Welcome to ትምህሪት ቋንቋ ትግርኛ ፍረ ጥበብ</h2>
        <p className="mt-4 max-w-2xl text-slate-600">
          A safe learning environment for students aged 6-17 to practice Tigrigna through videos, reading materials, and homework submissions.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Login / ግባ
          </Link>
          <Link href="/student/dashboard" className="rounded-full border border-slate-300 px-5 py-3 text-sm text-slate-700 transition hover:border-slate-500">
            Student Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Lessons</h3>
          <p className="mt-3 text-slate-600">Video lessons with Tigrigna and English support for every learner.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Reading Materials</h3>
          <p className="mt-3 text-slate-600">Download PDFs and follow curated external links from the teacher.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <h3 className="text-xl font-semibold">Homework</h3>
          <p className="mt-3 text-slate-600">Students submit video links or upload recordings directly to Supabase storage.</p>
        </div>
      </div>
    </section>
  );
}
