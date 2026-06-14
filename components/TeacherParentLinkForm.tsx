'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, type ComponentProps } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import type { StudentOption } from './TeacherGradeManager';

type TeacherParentLinkFormProps = {
  students: StudentOption[];
};

export default function TeacherParentLinkForm({ students }: TeacherParentLinkFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [parentEmail, setParentEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!studentId || !parentEmail.trim()) {
      setStatus('Choose a student and enter the parent email.');
      return;
    }

    setLoading(true);

    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('role', 'Parent')
      .ilike('email', parentEmail.trim())
      .maybeSingle();

    if (parentError) {
      setStatus(parentError.message);
      setLoading(false);
      return;
    }

    if (!parentProfile) {
      setStatus('No parent account found with that email. Ask the parent to sign up as Parent first.');
      setLoading(false);
      return;
    }

    const { error: linkError } = await supabase.from('parent_student_links').insert({
      parent_id: parentProfile.id,
      student_id: studentId
    });

    setLoading(false);

    if (linkError) {
      setStatus(linkError.message.includes('duplicate') ? 'This parent is already linked to this student.' : linkError.message);
      return;
    }

    setParentEmail('');
    setStatus('Parent linked to student successfully.');
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Link parent to student</h3>
        <p className="text-sm text-slate-600">Connect a parent account so they can view grades and progress.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="block text-sm font-medium text-slate-700">Student</label>
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Parent email</label>
          <input
            type="email"
            value={parentEmail}
            onChange={(event) => setParentEmail(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none"
            placeholder="parent@example.com"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !students.length}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Linking...' : 'Link parent'}
          </button>
        </div>
        {status && <p className="md:col-span-3 text-sm text-slate-600">{status}</p>}
      </form>
    </div>
  );
}
