'use client';

import { useRouter } from 'next/navigation';
import { useState, type ComponentProps } from 'react';

export type GradeRow = {
  id: string;
  student_id: string;
  title: string;
  grade: string;
  feedback: string | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

export type StudentOption = {
  id: string;
  full_name: string;
};

type TeacherGradeManagerProps = {
  students: StudentOption[];
  initialGrades: GradeRow[];
};

function studentNameFromGrade(grade: GradeRow) {
  if (!grade.profiles) return 'Student';
  if (Array.isArray(grade.profiles)) return grade.profiles[0]?.full_name ?? 'Student';
  return grade.profiles.full_name;
}

function toDateInputValue(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TeacherGradeManager({ students, initialGrades }: TeacherGradeManagerProps) {
  const router = useRouter();
  const [grades, setGrades] = useState(initialGrades);
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [excelBusy, setExcelBusy] = useState<'export' | 'import' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGradeValue, setEditGradeValue] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const startEdit = (grade: GradeRow) => {
    setEditingId(grade.id);
    setEditTitle(grade.title);
    setEditGradeValue(grade.grade);
    setEditFeedback(grade.feedback ?? '');
    setEditDate(toDateInputValue(grade.created_at));
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditGradeValue('');
    setEditFeedback('');
    setEditDate('');
  };

  const handleEditSave = async (gradeId: string) => {
    if (!editTitle.trim() || !editGradeValue.trim() || !editDate) {
      setStatus('Assignment, grade, and date are required.');
      return;
    }

    setSavingId(gradeId);
    setStatus(null);

    try {
      const response = await fetch(`/api/grades/${gradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          grade: editGradeValue.trim(),
          feedback: editFeedback.trim() || null,
          gradedAt: editDate
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        grade?: GradeRow;
        notificationMessage?: string;
      };

      if (!response.ok || !payload.grade) {
        setStatus(payload.error ?? 'Could not update grade.');
        return;
      }

      setGrades((current) =>
        current.map((grade) =>
          grade.id === gradeId
            ? {
                ...grade,
                title: payload.grade!.title,
                grade: payload.grade!.grade,
                feedback: payload.grade!.feedback,
                created_at: payload.grade!.created_at
              }
            : grade
        )
      );
      cancelEdit();
      setStatus(payload.notificationMessage ?? 'Grade updated.');
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  const handleExportExcel = async () => {
    setExcelBusy('export');
    setStatus(null);

    try {
      const response = await fetch('/api/grades/export');
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setStatus(payload.error ?? 'Could not export grades.');
        return;
      }

      const blob = await response.blob();
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-grades-${stamp}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Grades exported to Excel.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not export grades.');
    } finally {
      setExcelBusy(null);
    }
  };

  const handleImportExcel = async (event: { currentTarget: HTMLInputElement }) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setExcelBusy('import');
    setStatus(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/grades/import', {
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
        setStatus(payload.error ?? 'Could not import grades.');
        return;
      }

      const summary = `Import complete: ${payload.updated ?? 0} updated, ${payload.created ?? 0} added.`;
      const detail = payload.errors?.length ? ` ${payload.errors.slice(0, 3).join(' ')}` : '';
      setStatus(summary + detail);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not import grades.');
    } finally {
      setExcelBusy(null);
    }
  };

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);

    if (!studentId || !title.trim() || !gradeValue.trim()) {
      setStatus('Student, assignment title, and grade are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          title: title.trim(),
          grade: gradeValue.trim(),
          feedback: feedback.trim() || null
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        grade?: GradeRow;
        notificationMessage?: string;
      };

      if (!response.ok || !payload.grade) {
        setStatus(payload.error ?? 'Could not save grade.');
        return;
      }

      const studentName = students.find((student) => student.id === studentId)?.full_name ?? 'Student';
      setGrades((current) => [
        {
          ...payload.grade!,
          profiles: { full_name: studentName }
        },
        ...current
      ]);
      setTitle('');
      setGradeValue('');
      setFeedback('');
      setStatus(payload.notificationMessage ?? 'Grade saved.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Student grades /  ነጥብታት ተማሃሮ</h2>
        <p className="mt-2 text-slate-600">
          Record grades by student name, export to Excel to edit in bulk, then import the file back.
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
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Keep the <strong>Grade ID</strong> column when editing existing rows. Leave Grade ID empty to add new grades.
          Use <strong>Student Name</strong> or <strong>Student ID</strong> for each row.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <div className="md:col-span-2">
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
          <label className="block text-sm font-medium text-slate-700">Assignment / lesson</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none"
            placeholder="Homework 1, Reading test..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Grade</label>
          <input
            value={gradeValue}
            onChange={(event) => setGradeValue(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none"
            placeholder="A, 95%, Pass..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Feedback (optional)</label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.currentTarget.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading || !students.length}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Saving...' : 'Save grade'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Student</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Assignment</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Grade</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Feedback</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {grades.length ? (
              grades.map((grade) => {
                const isEditing = editingId === grade.id;
                const isSaving = savingId === grade.id;

                return (
                  <tr key={grade.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{studentNameFromGrade(grade)}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.currentTarget.value)}
                          className="w-full min-w-[8rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                          placeholder="Assignment"
                        />
                      ) : (
                        <span className="text-slate-600">{grade.title}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editGradeValue}
                          onChange={(event) => setEditGradeValue(event.currentTarget.value)}
                          className="w-full min-w-[5rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                          placeholder="Grade"
                        />
                      ) : (
                        <span className="font-semibold text-amber-800">{grade.grade}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editFeedback}
                          onChange={(event) => setEditFeedback(event.currentTarget.value)}
                          className="w-full min-w-[10rem] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                          placeholder="Feedback (optional)"
                        />
                      ) : (
                        <span className="text-slate-600">{grade.feedback ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(event) => setEditDate(event.currentTarget.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                        />
                      ) : (
                        <span className="text-slate-500">{new Date(grade.created_at).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleEditSave(grade.id)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(grade)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No grades recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </div>
  );
}
