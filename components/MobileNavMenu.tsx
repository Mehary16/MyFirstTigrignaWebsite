'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type MobileNavMenuProps = {
  children: ReactNode;
  className?: string;
};

export default function MobileNavMenu({ children, className }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className={cn('lg:hidden', className)}>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-slate-950/30"
            onClick={() => setOpen(false)}
          />
          <nav
            id={menuId}
            className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+5.5rem)] z-50 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-card-lg"
          >
            <div className="flex flex-col gap-2" onClick={() => setOpen(false)}>
              {children}
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
