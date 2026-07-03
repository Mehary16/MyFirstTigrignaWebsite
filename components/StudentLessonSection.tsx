'use client';

import Link from 'next/link';
import { groupLessonsByLevel, LESSON_LEVEL_LABELS, type LessonLevel } from '../lib/lessonLevels';

type LessonItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
};

type StudentLessonSectionProps = {
  lessons: LessonItem[];
  viewedLessonIds: string[];
};

const LEVEL_ORDER: (LessonLevel | 'Other')[] = ['Beginner', 'Intermediate', 'Advanced', 'Other'];

export default function StudentLessonSection({ lessons, viewedLessonIds }: StudentLessonSectionProps) {
  const viewedSet = new Set(viewedLessonIds);
  const grouped = groupLessonsByLevel(lessons);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-950">Video Lessons</h2>
        <a href="/resources/alphabet" className="text-sm font-semibold text-amber-800 hover:underline">
          Practice Tigrinya Alphabet →
        </a>
      </div>

      {!lessons.length ? (
        <p className="mt-5 text-slate-600">No lessons assigned yet. Please check back later.</p>
      ) : (
        <div className="mt-5 space-y-8">
          {LEVEL_ORDER.map((levelKey) => {
            const levelLessons = grouped[levelKey];
            if (!levelLessons.length) return null;

            return (
              <div key={levelKey}>
                <h3 className="text-lg font-semibold text-amber-800">
                  {levelKey === 'Other' ? 'Other Lessons' : LESSON_LEVEL_LABELS[levelKey as LessonLevel]}
                </h3>
                <ul className="mt-4 space-y-3">
                  {levelLessons.map((lesson) => {
                    const isViewed = viewedSet.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/student/lessons/${lesson.id}`}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-200 hover:bg-amber-50/50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950">{lesson.title}</span>
                              {isViewed && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  Viewed
                                </span>
                              )}
                            </div>
                            {lesson.category && (
                              <p className="mt-1 text-sm text-amber-700">{lesson.category}</p>
                            )}
                            {lesson.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lesson.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-amber-800">Open lesson →</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
