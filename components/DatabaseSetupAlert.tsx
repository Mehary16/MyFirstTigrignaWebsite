import Alert from './ui/Alert';

type DatabaseSetupAlertProps = {
  message?: string | null;
};

export default function DatabaseSetupAlert({ message }: DatabaseSetupAlertProps) {
  if (!message) return null;

  return (
    <Alert variant="warning" title="Database setup required">
      <p>{message}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
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
              , then{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5">supabase/TIER_1_AND_2_FEATURES.sql</code>
            </>
          )}{' '}
          from this project.
        </li>
        <li>Refresh this page and try again.</li>
      </ol>
    </Alert>
  );
}
