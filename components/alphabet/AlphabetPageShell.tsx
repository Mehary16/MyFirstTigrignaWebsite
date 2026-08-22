import Link from 'next/link';
import AlphabetLearningStudio from './AlphabetLearningStudio';
import TeacherAlphabetActivity from './TeacherAlphabetActivity';

type AlphabetPageShellProps = {
  role: 'Student' | 'Teacher';
  dashboardHref: string;
};

export default function AlphabetPageShell({ role, dashboardHref }: AlphabetPageShellProps) {
  return (
    <section className="space-y-8">
      <div className="surface-panel p-8">
        <p className="section-eyebrow">ፊደል · Alphabet</p>
        <h1 className="font-ethiopic-display mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
          ፊደላት ትግርኛ · Tigrinya Alphabet
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Click to hear each letter, trace it to practice writing, then test yourself in quiz mode. Your progress is
          saved to your account.
        </p>
        <Link href={dashboardHref} className="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:underline">
          ← Back to {role === 'Teacher' ? 'teacher' : 'student'} dashboard
        </Link>
      </div>

      {role === 'Teacher' ? <TeacherAlphabetActivity /> : null}

      <AlphabetLearningStudio showTeacherTools={role === 'Teacher'} />
    </section>
  );
}
