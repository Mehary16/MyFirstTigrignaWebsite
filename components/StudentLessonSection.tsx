'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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
  gradeLabel?: string | null;
};

export default function StudentLessonSection({ lessons, viewedLessonIds, gradeLabel }: StudentLessonSectionProps) {
  const viewedSet = new Set(viewedLessonIds);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [viewedFilter, setViewedFilter] = useState<'all' | 'viewed' | 'not_viewed'>('all');

  const levels = useMemo(() => {
    const uniq = new Set<string>();
    for (const lesson of lessons) {
      if (lesson.level) uniq.add(lesson.level);
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const categories = useMemo(() => {
    const uniq = new Set<string>();
    for (const lesson of lessons) {
      if (lesson.category) uniq.add(lesson.category);
    }
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();

    return lessons.filter((lesson) => {
      if (levelFilter && lesson.level !== levelFilter) return false;
      if (categoryFilter && lesson.category !== categoryFilter) return false;

      if (viewedFilter !== 'all') {
        const isViewed = viewedSet.has(lesson.id);
        if (viewedFilter === 'viewed' && !isViewed) return false;
        if (viewedFilter === 'not_viewed' && isViewed) return false;
      }

      if (!q) return true;

      const haystack = [
        lesson.title,
        lesson.description ?? '',
        lesson.category ?? '',
        lesson.level ?? ''
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [lessons, query, levelFilter, categoryFilter, viewedFilter, viewedSet]);

  return (
    <section id="student-lessons" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Video Lessons</h2>
          {gradeLabel ? <p className="mt-1 text-sm text-amber-800">{gradeLabel} lessons only</p> : null}
        </div>
        <a href="/resources/alphabet" className="text-sm font-semibold text-amber-800 hover:underline">
          Practice Tigrinya Alphabet →
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="sr-only" htmlFor="lesson-search">
            Search lessons
          </label>
          <input
            id="lesson-search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search lessons..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-500"
          />
        </div>

        <div className="flex gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="viewed-filter">
            Viewed filter
          </label>
          <select
            id="viewed-filter"
            value={viewedFilter}
            onChange={(e) => setViewedFilter(e.currentTarget.value as typeof viewedFilter)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-500"
          >
            <option value="all">All</option>
            <option value="viewed">Viewed</option>
            <option value="not_viewed">Not viewed</option>
          </select>
        </div>

        <div>
          <label className="sr-only" htmlFor="level-filter">
            Level filter
          </label>
          <select
            id="level-filter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.currentTarget.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-500"
          >
            <option value="">All levels</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="sr-only" htmlFor="category-filter">
            Category filter
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.currentTarget.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-500"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Showing <span className="font-semibold text-slate-900">{filteredLessons.length}</span> lesson
        {filteredLessons.length === 1 ? '' : 's'}
      </p>

      {!lessons.length ? (
        <p className="mt-5 text-slate-600">No lessons for your class yet. Please check back later.</p>
      ) : filteredLessons.length === 0 ? (
        <p className="mt-5 text-slate-600">No lessons match your search/filters. Try a different keyword.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filteredLessons.map((lesson) => {
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
                    {lesson.category && <p className="mt-1 text-sm text-amber-700">{lesson.category}</p>}
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
      )}
    </section>
  );
}
