'use client';

import { useMemo } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { groupLessonsByLevel, LESSON_LEVEL_LABELS, type LessonLevel } from '../lib/lessonLevels';
import { getVideoEmbedUrl } from '../lib/videoEmbed';

type LessonItem = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  category: string | null;
  level: string | null;
  external_link: string | null;
};

type StudentLessonSectionProps = {
  lessons: LessonItem[];
  viewedLessonIds: string[];
  studentId: string;
};

const LEVEL_ORDER: (LessonLevel | 'Other')[] = ['Beginner', 'Intermediate', 'Advanced', 'Other'];

export default function StudentLessonSection({ lessons, viewedLessonIds, studentId }: StudentLessonSectionProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const viewedSet = useMemo(() => new Set(viewedLessonIds), [viewedLessonIds]);
  const grouped = groupLessonsByLevel(lessons);

  const markViewed = async (lessonId: string) => {
    if (viewedSet.has(lessonId)) return;
    await supabase.from('lesson_views').upsert(
      { student_id: studentId, lesson_id: lessonId, viewed_at: new Date().toISOString() },
      { onConflict: 'student_id,lesson_id' }
    );
  };

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
                <div className="mt-4 space-y-4">
                  {levelLessons.map((lesson) => {
                    const embedUrl = getVideoEmbedUrl(lesson.video_url);
                    const isViewed = viewedSet.has(lesson.id);

                    return (
                      <article key={lesson.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
                        {embedUrl ? (
                          <div className="aspect-video w-full bg-slate-200">
                            <iframe
                              src={embedUrl}
                              title={lesson.title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              onLoad={() => markViewed(lesson.id)}
                            />
                          </div>
                        ) : (
                          <div className="border-b border-slate-200 p-4">
                            <a
                              href={lesson.video_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => markViewed(lesson.id)}
                              className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                            >
                              Open Video
                            </a>
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-950">{lesson.title}</h4>
                            {isViewed && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Viewed</span>
                            )}
                          </div>
                          {lesson.category && <p className="mt-1 text-sm text-amber-700">{lesson.category}</p>}
                          <p className="mt-3 text-slate-600">{lesson.description}</p>
                          {lesson.external_link && (
                            <a href={lesson.external_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                              Open extra link
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
