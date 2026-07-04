'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, UserPlus } from 'lucide-react';
import type { StudentListItem } from '../lib/studentList';
import { CLASS_GRADES, type ClassGrade } from '../lib/classGrades';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import TeacherStudentCreateForm from './TeacherStudentCreateForm';
import { Alert, Badge, Card, EmptyState } from './ui';
import { cn } from '../lib/cn';

type TeacherStudentListProps = {
  students: StudentListItem[];
  totalCount: number;
};

export default function TeacherStudentList({ students: initialStudents, totalCount }: TeacherStudentListProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [helpOpenId, setHelpOpenId] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);

  const activeCount = students.filter((s) => s.is_active).length;
  const suspendedCount = students.length - activeCount;

  const updateStudentGrade = async (studentId: string, classGrade: ClassGrade) => {
    setBusyId(studentId);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ class_grade: classGrade })
      .eq('id', studentId)
      .eq('role', 'Student');

    if (updateError) {
      setError(updateError.message);
      setBusyId(null);
      return;
    }

    setStudents((current) =>
      current.map((student) => (student.id === studentId ? { ...student, class_grade: classGrade } : student))
    );
    setBusyId(null);
    router.refresh();
  };

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

  const handleStudentCreated = (student: StudentListItem) => {
    setStudents((current) => [student, ...current]);
    setError(null);
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setHelpMessage(`Copied ${email} to clipboard.`);
    } catch {
      setHelpMessage('Could not copy email. Select and copy it manually.');
    }
  };

  const sendAccessHelp = async (studentId: string, action: 'reset_password' | 'resend_invite') => {
    setBusyId(studentId);
    setError(null);
    setHelpMessage(null);

    try {
      const response = await fetch('/api/students/send-access-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action })
      });

      const payload = (await response.json()) as { error?: string; message?: string; email?: string };

      if (!response.ok || payload.error) {
        setError(payload.error ?? 'Could not send login help.');
        return;
      }

      setHelpMessage(payload.message ?? 'Login help sent.');
      if (payload.email) {
        setStudents((current) =>
          current.map((student) => (student.id === studentId ? { ...student, email: payload.email! } : student))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send login help.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="default" className="overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
          aria-expanded={showCreateForm}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
              <UserPlus className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">Register Student</p>
              <p className="mt-1 text-sm text-slate-600">
                Create a student account with a temporary password or setup email.
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn('h-5 w-5 shrink-0 text-slate-500 transition', showCreateForm && 'rotate-180')}
            aria-hidden
          />
        </button>

        {showCreateForm && (
          <div className="border-t border-slate-200 p-6 pt-5">
            <TeacherStudentCreateForm onStudentCreated={handleStudentCreated} />
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Registered Students / ዝተመዝገቡ ተማሃሮ</h2>
        <p className="mt-2 text-slate-600">Monitor signups, add students yourself, and suspend accounts when needed.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card variant="muted" className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{students.length}</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{activeCount}</p>
        </Card>
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-red-700">Suspended</p>
          <p className="mt-1 text-2xl font-semibold text-red-900">{suspendedCount}</p>
        </Card>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {helpMessage ? <Alert variant="success">{helpMessage}</Alert> : null}

      {!students.length ? (
        <EmptyState title="No students registered yet." description="Add the first student above or ask them to sign up from the login page." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">First name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Last name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Grade</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Submissions</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map((student) => (
                <Fragment key={student.id}>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">{student.first_name}</td>
                  <td className="px-4 py-3 text-slate-700">{student.last_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {student.email ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="break-all">{student.email}</span>
                        <button
                          type="button"
                          onClick={() => copyEmail(student.email!)}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not on file</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={student.class_grade ?? ''}
                      disabled={busyId === student.id}
                      onChange={(event) => updateStudentGrade(student.id, event.currentTarget.value as ClassGrade)}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="">Not set</option>
                      {CLASS_GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(student.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{student.submission_count}</td>
                  <td className="px-4 py-3">
                    <Badge variant={student.is_active ? 'success' : 'danger'}>
                      {student.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setHelpOpenId((current) => (current === student.id ? null : student.id))}
                        className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50"
                      >
                        {helpOpenId === student.id ? 'Close help' : 'Login help'}
                      </button>
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
                {helpOpenId === student.id && (
                  <tr className="bg-blue-50/40">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="rounded-2xl border border-blue-100 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Help this student access their portal</p>
                        <p className="mt-1 text-sm text-slate-600">
                          Share their login email if they forgot it, then send a reset link or resend the setup invitation.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {student.email ? (
                            <button
                              type="button"
                              onClick={() => copyEmail(student.email!)}
                              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Copy email
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busyId === student.id || !student.is_active}
                            onClick={() => sendAccessHelp(student.id, 'reset_password')}
                            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === student.id ? 'Sending...' : 'Send password reset'}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === student.id || !student.is_active}
                            onClick={() => sendAccessHelp(student.id, 'resend_invite')}
                            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === student.id ? 'Sending...' : 'Resend setup email'}
                          </button>
                        </div>
                        {!student.is_active ? (
                          <p className="mt-3 text-xs text-amber-700">Activate the account before sending login help.</p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
