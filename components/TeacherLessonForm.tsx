'use client';

import { useState, type ComponentProps } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { LESSON_LEVELS, LESSON_LEVEL_LABELS, type LessonLevel } from '../lib/lessonLevels';

export default function TeacherLessonForm() {
  const supabase = createBrowserSupabaseClient();
  const [titleTigrigna, setTitleTigrigna] = useState('');
  const [titleEnglish, setTitleEnglish] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<LessonLevel | ''>('');
  const [videoUrl, setVideoUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const title = `${titleTigrigna.trim()} / ${titleEnglish.trim()}`.trim();

      if (!title || !videoUrl.trim()) {
        setStatus('Please provide a title and video URL.');
        return;
      }

      const { error } = await supabase.from('lessons').insert([
        {
          title,
          description,
          category,
          level: level || null,
          video_url: videoUrl,
          external_link: externalLink
        }
      ]);

      if (error) {
        setStatus(`Error creating lesson: ${error.message}`);
        return;
      }

      setTitleTigrigna('');
      setTitleEnglish('');
      setDescription('');
      setCategory('');
      setLevel('');
      setVideoUrl('');
      setExternalLink('');
      setStatus('Lesson created successfully.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-700">Lesson title (Tigrigna)</label>
        <input
          value={titleTigrigna}
          onChange={(event) => setTitleTigrigna(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="ርእሲ ትምህርቲ"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Lesson title (English)</label>
        <input
          value={titleEnglish}
          onChange={(event) => setTitleEnglish(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Lesson title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Short description for students"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Level</label>
        <select
          value={level}
          onChange={(event) => setLevel(event.currentTarget.value as LessonLevel | '')}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
        >
          <option value="">Select level (optional)</option>
          {LESSON_LEVELS.map((item) => (
            <option key={item} value={item}>
              {LESSON_LEVEL_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Topic category</label>
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="e.g. Grammar, Listening, Vocabulary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Video URL</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="https://youtube.com/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">External link (optional)</label>
        <input
          type="url"
          value={externalLink}
          onChange={(event) => setExternalLink(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
          placeholder="Optional reading or assignment link"
        />
      </div>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Creating lesson...' : 'Create lesson'}
      </button>
    </form>
  );
}
