import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">404</p>
      <h1 className="mt-3 font-ethiopic-display text-3xl font-semibold text-slate-950 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="link-button-primary px-6 py-3 text-sm">
          Go home
        </Link>
        <Link href="/login" className="link-button-secondary px-6 py-3 text-sm">
          Login
        </Link>
        <Link href="/help" className="link-button-secondary px-6 py-3 text-sm">
          Help &amp; FAQ
        </Link>
      </div>
    </section>
  );
}
