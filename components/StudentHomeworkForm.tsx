'use client';

import { useState, type ComponentProps } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import { STORAGE_BUCKETS } from '../lib/storageBuckets';

interface StudentHomeworkFormProps {
  studentId: string;
}

export default function StudentHomeworkForm({ studentId }: StudentHomeworkFormProps) {
  const supabase = createBrowserSupabaseClient();
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      let storedUrl = videoUrl;

      if (file) {
        const fileName = `${studentId}-${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.studentSubmissions)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'video/mp4'
          });

        if (uploadError) {
          setStatus(`Upload failed: ${uploadError.message}`);
          return;
        }

        const { data: publicData } = await supabase.storage
          .from(STORAGE_BUCKETS.studentSubmissions)
          .getPublicUrl(uploadData.path);

        storedUrl = publicData.publicUrl;
      }

      const { error: submissionError } = await supabase.from('submissions').insert([
        {
          student_id: studentId,
          video_url: storedUrl,
          notes
        }
      ]);

      if (submissionError) {
        setStatus(`Submission failed: ${submissionError.message}`);
        return;
      }

      setVideoUrl('');
      setNotes('');
      setFile(null);
      setStatus('Homework submitted successfully!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-700">Video URL</label>
        <input
          type="url"
          placeholder="https://youtube.com/..."
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Upload short clip</label>
        <input
          type="file"
          accept="video/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-slate-700 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Notes / ማስታወሻ</label>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 outline-none transition focus:border-slate-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Submitting...' : 'Submit Homework'}
      </button>

      {status && <p className="text-sm text-slate-600">{status}</p>}
    </form>
  );
}
