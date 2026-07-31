import Link from 'next/link';
import { LEGAL_CONTACT } from '../lib/legalCopy';

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-gradient-to-r from-amber-50/40 via-transparent to-sky-50/40 pt-6 text-sm text-slate-500">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contact us</p>
          <p className="mt-2 font-ethiopic text-slate-600">{LEGAL_CONTACT.organization}</p>
          <p className="font-ethiopic text-slate-600">{LEGAL_CONTACT.teacher}</p>
          <p className="mt-1">
            <span className="font-ethiopic">ኢሜል:</span>{' '}
            <a
              href={`mailto:${LEGAL_CONTACT.email}`}
              className="text-slate-700 underline-offset-2 hover:text-brand-800 hover:underline"
            >
              {LEGAL_CONTACT.email}
            </a>
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Explore</p>
          <nav className="mt-2 flex flex-col gap-2">
            <Link href="/about" className="text-slate-600 hover:text-brand-800 hover:underline">
              About Us
            </Link>
            <Link href="/resources/alphabet" className="text-slate-600 hover:text-brand-800 hover:underline">
              Tigrinya Alphabet
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-brand-800 hover:underline">
              Login
            </Link>
            <Link href="/help" className="text-slate-600 hover:text-brand-800 hover:underline">
              Help &amp; FAQ
            </Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Legal</p>
          <nav className="mt-2 flex flex-col gap-2">
            <Link href="/privacy" className="text-slate-600 hover:text-brand-800 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-600 hover:text-brand-800 hover:underline">
              Terms of Service
            </Link>
          </nav>
        </div>
      </div>

      <p className="mt-6 border-t border-slate-200/80 pt-4 text-xs text-slate-400">
        © {new Date().getFullYear()} Tigrigna Learning Portal. All rights reserved.
      </p>
    </footer>
  );
}
