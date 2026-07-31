export default function Loading() {
  return (
    <section className="mx-auto flex min-h-[40vh] max-w-md flex-col gap-4 py-16">
      <div className="h-8 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="space-y-3 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-10 w-32 animate-pulse rounded-full bg-slate-200" />
      </div>
      <p className="text-center text-sm font-medium text-slate-500">Loading your page...</p>
    </section>
  );
}
