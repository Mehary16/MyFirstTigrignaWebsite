import Link from 'next/link';
import { Trophy } from 'lucide-react';

type DashboardKahootCardProps = {
  href: string;
  roleLabel: 'Student' | 'Teacher';
};

export default function DashboardKahootCard({ href, roleLabel }: DashboardKahootCardProps) {
  const isTeacher = roleLabel === 'Teacher';

  return (
    <div className="surface-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-900">
          <Trophy className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="section-eyebrow">Live quiz · Kahoot-style</p>
          <h2 className="text-xl font-semibold text-slate-950">
            {isTeacher ? 'Host a Fidel competition' : 'Join a live Fidel quiz'}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Questions follow <span className="font-medium">ቋንቋ ትግርኛ መጽሓፍ ፊደል ን 1ይ ክፍሊ</span> (letters, sounds, and
            example words). {isTeacher ? 'Share a PIN so students can join on their devices.' : 'Enter the PIN your teacher shows on the board.'}
          </p>
        </div>
      </div>
      <Link href={href} className="link-button-primary shrink-0 px-6 py-3 text-sm">
        {isTeacher ? 'Host live quiz' : 'Join with PIN'}
      </Link>
    </div>
  );
}
