type DatabaseSetupAlertProps = {
  message?: string | null;
};

export default function DatabaseSetupAlert({ message }: DatabaseSetupAlertProps) {
  if (!message) return null;

  return (
    <div role="alert" className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
      <p className="text-sm font-semibold uppercase tracking-[0.15em]">Database setup required</p>
      <p className="mt-2 text-sm">{message}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li>Open your Supabase project → SQL Editor.</li>
        <li>
          Copy and run{' '}
          {message?.includes('FIX_RLS_RECURSION') ? (
            <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/FIX_RLS_RECURSION.sql</code>
          ) : (
            <>
              <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/FIX_RLS_RECURSION.sql</code> if you see
              infinite recursion, otherwise{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/RUN_THIS_FIRST.sql</code>
            </>
          )}{' '}
          from this project.
        </li>
        <li>Refresh this page and try again.</li>
      </ol>
    </div>
  );
}
