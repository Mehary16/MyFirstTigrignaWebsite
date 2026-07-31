export default function Loading() {
  return (
    <section className="flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-900"
        role="status"
        aria-label="Loading"
      />
      <p className="mt-4 text-sm font-medium text-slate-600">Loading...</p>
      <p className="mt-1 font-ethiopic text-xs text-slate-500">ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ</p>
    </section>
  );
}
