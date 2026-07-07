'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, UserPlus } from 'lucide-react';
import type { StudentListItem } from '../lib/studentList';
import { filterStudentsByGradeView, groupStudentsByGrade } from '../lib/studentList';
import { CLASS_GRADES, type ClassGrade } from '../lib/classGrades';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import TeacherStudentCreateForm from './TeacherStudentCreateForm';
import { Alert, Badge, Card, EmptyState } from './ui';
import { cn } from '../lib/cn';

type TeacherStudentListProps = {
  students: StudentListItem[];
  totalCount: number;
};

type GradeView = 'all' | ClassGrade | 'unassigned';

const GRADE_SECTION_STYLES: Record<ClassGrade, string> = {
  'Grade 1': 'border-blue-200 bg-blue-50/60 text-blue-900',
  'Grade 2': 'border-amber-200 bg-amber-50/60 text-amber-900',
  'Grade 3': 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
};

export default function TeacherStudentList({ students: initialStudents, totalCount }: TeacherStudentListProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [helpOpenId, setHelpOpenId] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [excelBusy, setExcelBusy] = useState<'export' | 'import' | 'template' | null>(null);
  const [excelStatus, setExcelStatus] = useState<string | null>(null);
  const [gradeView, setGradeView] = useState<GradeView>('all');

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const activeCount = students.filter((s) => s.is_active).length;
  const suspendedCount = students.length - activeCount;

  const { groups, unassigned } = useMemo(() => groupStudentsByGrade(students), [students]);

  const gradeCounts = useMemo(
    () => ({
      'Grade 1': groups['Grade 1'].length,
      'Grade 2': groups['Grade 2'].length,
      'Grade 3': groups['Grade 3'].length,
      unassigned: unassigned.length
    }),
    [groups, unassigned]
  );

  const filteredStudents = useMemo(
    () => filterStudentsByGradeView(students, gradeView),
    [students, gradeView]
  );

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

  const downloadExcelFile = async (url: string, fallbackName: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? 'Could not download Excel file.');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? fallbackName;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleExportExcel = async () => {
    setExcelBusy('export');
    setExcelStatus(null);
    setError(null);

    try {
      const gradeParam =
        gradeView === 'Grade 1' || gradeView === 'Grade 2' || gradeView === 'Grade 3'
          ? `?grade=${encodeURIComponent(gradeView)}`
          : '';
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadExcelFile(`/api/students/export${gradeParam}`, `students-${stamp}.xlsx`);
      setExcelStatus(
        gradeView === 'Grade 1' || gradeView === 'Grade 2' || gradeView === 'Grade 3'
          ? `${gradeView} students exported to Excel.`
          : 'Student roster exported to Excel.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export students.');
    } finally {
      setExcelBusy(null);
    }
  };

  const handleDownloadTemplate = async () => {
    setExcelBusy('template');
    setExcelStatus(null);
    setError(null);

    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadExcelFile('/api/students/export?template=1', `student-import-template-${stamp}.xlsx`);
      setExcelStatus('Import template downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download template.');
    } finally {
      setExcelBusy(null);
    }
  };

  const handleImportExcel = async (event: { currentTarget: HTMLInputElement }) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setExcelBusy('import');
    setExcelStatus(null);
    setError(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body
      });

      const payload = (await response.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        errors?: string[];
      };

      if (!response.ok || payload.error) {
        setError(payload.error ?? 'Could not import students.');
        if (payload.errors?.length) {
          setExcelStatus(payload.errors.slice(0, 3).join(' '));
        }
        return;
      }

      const parts = [
        payload.created ? `${payload.created} created` : null,
        payload.updated ? `${payload.updated} updated` : null
      ].filter(Boolean);

      setExcelStatus(
        parts.length
          ? `Import complete: ${parts.join(', ')}.`
          : 'Import complete.'
      );

      if (payload.errors?.length) {
        setExcelStatus(
          `${parts.length ? `Import complete: ${parts.join(', ')}. ` : ''}${payload.errors.slice(0, 3).join(' ')}`
        );
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import students.');
    } finally {
      setExcelBusy(null);
    }
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

  const renderStudentRows = (rows: StudentListItem[], showGradeColumn: boolean) =>
    rows.map((student) => (
      <Fragment key={student.id}>
        <tr className="hover:bg-slate-50/80">
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
          {showGradeColumn ? (
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
          ) : null}
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
            <td colSpan={showGradeColumn ? 8 : 7} className="px-4 py-4">
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
    ));

  const renderStudentTable = (rows: StudentListItem[], showGradeColumn: boolean) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">First name</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Last name</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
            {showGradeColumn ? (
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Grade</th>
            ) : null}
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Joined</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Submissions</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{renderStudentRows(rows, showGradeColumn)}</tbody>
      </table>
    </div>
  );

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
        <p className="mt-2 text-slate-600">
          Students are grouped by class grade. Export the roster to Excel, edit grades in bulk, or import new students.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={excelBusy !== null}
            onClick={handleExportExcel}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {excelBusy === 'export' ? 'Exporting...' : 'Export to Excel'}
          </button>
          <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            {excelBusy === 'import' ? 'Importing...' : 'Import from Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              disabled={excelBusy !== null}
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
          <button
            type="button"
            disabled={excelBusy !== null}
            onClick={handleDownloadTemplate}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {excelBusy === 'template' ? 'Downloading...' : 'Download import template'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Keep the <strong>Student ID</strong> column when updating existing students. Leave it empty for new students
          and include a <strong>Temporary Password</strong> (8+ characters). Use <strong>Class Grade</strong>: Grade 1,
          Grade 2, or Grade 3.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card variant="muted" className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{students.length}</p>
        </Card>
        {CLASS_GRADES.map((grade) => (
          <Card key={grade} className="border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{grade}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{gradeCounts[grade]}</p>
          </Card>
        ))}
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">{activeCount}</p>
        </Card>
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-red-700">Suspended</p>
          <p className="mt-1 text-2xl font-semibold text-red-900">{suspendedCount}</p>
        </Card>
      </div>

      {!students.length ? null : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGradeView('all')}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition',
              gradeView === 'all'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            )}
          >
            All grades ({students.length})
          </button>
          {CLASS_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => setGradeView(grade)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                gradeView === grade
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              {grade} ({gradeCounts[grade]})
            </button>
          ))}
          {gradeCounts.unassigned > 0 ? (
            <button
              type="button"
              onClick={() => setGradeView('unassigned')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                gradeView === 'unassigned'
                  ? 'border-amber-700 bg-amber-700 text-white'
                  : 'border-amber-300 text-amber-800 hover:bg-amber-50'
              )}
            >
              No grade ({gradeCounts.unassigned})
            </button>
          ) : null}
        </div>
      )}

      {error ? <Alert variant="error">{error}</Alert> : null}
      {excelStatus ? <Alert variant="success">{excelStatus}</Alert> : null}
      {helpMessage ? <Alert variant="success">{helpMessage}</Alert> : null}

      {!students.length ? (
        <EmptyState title="No students registered yet." description="Add the first student above or ask them to sign up from the login page." />
      ) : gradeView === 'all' ? (
        <div className="space-y-8">
          {CLASS_GRADES.map((grade) =>
            groups[grade].length ? (
              <section key={grade} className="space-y-3">
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3',
                    GRADE_SECTION_STYLES[grade]
                  )}
                >
                  <div>
                    <h3 className="text-lg font-semibold">{grade}</h3>
                    <p className="text-sm opacity-80">
                      {groups[grade].length} student{groups[grade].length === 1 ? '' : 's'} · sorted by last name
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGradeView(grade)}
                    className="rounded-full border border-current/20 bg-white/70 px-4 py-1.5 text-sm font-semibold hover:bg-white"
                  >
                    View {grade} only
                  </button>
                </div>
                {renderStudentTable(groups[grade], false)}
              </section>
            ) : null
          )}
          {unassigned.length ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-amber-900">
                <div>
                  <h3 className="text-lg font-semibold">No grade assigned</h3>
                  <p className="text-sm opacity-80">Assign a grade so these students can see class content.</p>
                </div>
              </div>
              {renderStudentTable(unassigned, true)}
            </section>
          ) : null}
        </div>
      ) : filteredStudents.length ? (
        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {gradeView === 'unassigned' ? 'Students without a grade' : gradeView}
            </h3>
            <p className="text-sm text-slate-600">
              {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'} · sorted by last name
            </p>
          </div>
          {renderStudentTable(filteredStudents, true)}
        </section>
      ) : (
        <EmptyState
          title={`No students in ${gradeView === 'unassigned' ? 'this group' : gradeView}.`}
          description="Register a student with this grade or change an existing student's grade from All grades."
        />
      )}
    </div>
  );
}
