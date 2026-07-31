import type { ReactNode } from 'react';

type DashboardHeaderActionsProps = {
  primary: ReactNode;
  secondary: ReactNode;
};

export default function DashboardHeaderActions({ primary, secondary }: DashboardHeaderActionsProps) {
  return (
    <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[16rem] md:items-end">
      <div className="flex flex-wrap items-center gap-2 md:justify-end">{primary}</div>
      <div className="flex flex-wrap items-center gap-2 border-t border-amber-100/90 pt-3 md:justify-end md:border-0 md:pt-0">
        {secondary}
      </div>
    </div>
  );
}
