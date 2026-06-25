'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';

export type StudentListItem = {
  id: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
  suspended_reason: string | null;
  submission_count: number;
};

type TeacherStudentListProps = {
  students: StudentListItem[];
  totalCount: number;
};

export default function TeacherStudentList({ students: initialStudents, totalCount }: TeacherStudentListProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCount = students.filter((s) => s.is_active).length;
  const suspendedCount = students.length - activeCount;

  const updateStudentStatus = async (studentId: string, suspend: boolean) => {
    setBusyId(studentId);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const reason = suspend ? 'Suspended by teacher for improper use of the website.' : null;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_active: !suspend,
        suspended_reason: reason,
        suspended_at: suspend ? new Date().toISOString() : null
      })
      .eq('id', studentId)
      .eq('role', 'Student');

    if (updateError) {
      setError(updateError.message);
      setBusyId(null);
      return;
    }

    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, is_active: !suspend, suspended_reason: reason }
          : student
      )
    );
    setBusyId(null);
    router.refresh();
  };

  const deleteStudent = async (student: StudentListItem) => {
    const confirmed = window.confirm(
      `Delete ${student.full_name}? This removes their profile, submissions, and grades. This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(student.id);
    setError(null);

    try {
      const response = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok || payload.error) {
        setError(payload.error ?? 'Could not delete student.');
        return;
      }

      setStudents((current) => current.filter((item) => item.id !== student.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete student.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Registered Students / ዝተመዝገቡ ተማሃሮ</h2>
        <p className="mt-2 text-slate-600">Monitor signups, activity, and suspend students when needed.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-red-700">Suspended</p>
          <p className="mt-1 text-2xl font-semibold text-red-900">{suspendedCount}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!students.length ? (
        <p className="text-slate-600">No students registered yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Submissions</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(student.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{student.submission_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        student.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {student.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {student.is_active ? (
                        <button
                          type="button"
                          disabled={busyId === student.id}
                          onClick={() => updateStudentStatus(student.id, true)}
                          className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === student.id ? 'Saving...' : 'Suspend'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === student.id}
                          onClick={() => updateStudentStatus(student.id, false)}
                          className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyId === student.id ? 'Saving...' : 'Activate'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === student.id}
                        onClick={() => deleteStudent(student)}
                        className="rounded-full border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === student.id ? 'Working...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
