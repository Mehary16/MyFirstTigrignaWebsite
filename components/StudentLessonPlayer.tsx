'use client';

import { useMemo } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { getVideoEmbedUrl } from '../lib/videoEmbed';

type StudentLessonPlayerProps = {
  lessonId: string;
  studentId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  category: string | null;
  externalLink: string | null;
  initiallyViewed: boolean;
};

export default function StudentLessonPlayer({
  lessonId,
  studentId,
  title,
  description,
  videoUrl,
  category,
  externalLink,
  initiallyViewed
}: StudentLessonPlayerProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const embedUrl = getVideoEmbedUrl(videoUrl);

  const markViewed = async () => {
    await supabase.from('lesson_views').upsert(
      { student_id: studentId, lesson_id: lessonId, viewed_at: new Date().toISOString() },
      { onConflict: 'student_id,lesson_id' }
    );
  };

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card-lg">
      {embedUrl ? (
        <div className="aspect-video w-full bg-slate-200">
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              void markViewed();
            }}
          />
        </div>
      ) : (
        <div className="border-b border-slate-200 p-6">
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void markViewed();
            }}
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open video
          </a>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-ethiopic-display text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h1>
          {initiallyViewed && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Viewed</span>
          )}
        </div>
        {category && <p className="mt-2 text-sm font-medium text-amber-700">{category}</p>}
        {description && <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>}
        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open extra link
          </a>
        )}
      </div>
    </article>
  );
}
