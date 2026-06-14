import LogoutButton from '../../components/LogoutButton';

export default function SuspendedPage() {
  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.25em] text-red-600">Account suspended</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-950">Access restricted / መእተዊ ተዓጽዩ</h1>
      <p className="mt-4 text-slate-600">
        Your student account has been suspended by your teacher. You cannot access lessons, materials, or homework until
        your account is reactivated.
      </p>
      <p className="mt-2 text-slate-600">ኣካውንትኹም ብመምህርኩም ተዓጽዩ ኣሎ።  ዳግማይ ኣገልግሎት ንምርካብ ሓገዝ ሓተቱ።</p>
      <div className="mt-8 flex justify-center">
        <LogoutButton className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800" />
      </div>
    </section>
  );
}
