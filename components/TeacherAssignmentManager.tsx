'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { uploadTeacherAttachment } from '../lib/attachments';
import type { ClassGrade } from '../lib/classGrades';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import ClassGradeSelect from './ClassGradeSelect';
import { AttachmentActions, AttachmentFileInput, ItemRowActions } from './AttachmentField';

export type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  lesson_id: string | null;
  file_url: string | null;
  file_name: string | null;
  class_grade: string | null;
  created_at: string;
};

const ASSIGNMENT_SELECT = 'id, title, description, due_date, lesson_id, file_url, file_name, class_grade, created_at';

type TeacherAssignmentManagerProps = {
  initialAssignments: AssignmentRow[];
};

export default function TeacherAssignmentManager({ initialAssignments }: TeacherAssignmentManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade | ''>('');
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editClassGrade, setEditClassGrade] = useState<ClassGrade | ''>('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editClearAttachment, setEditClearAttachment] = useState(false);

  const handleCreate: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    if (!classGrade) {
      setStatus('Please select a class grade for this assignment.');
      setLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setStatus('You must be logged in.');
        return;
      }

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (createFile) {
        const uploaded = await uploadTeacherAttachment(createFile);
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.fileName;
      }

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          classGrade,
          fileUrl,
          fileName
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        assignment?: AssignmentRow;
        notificationMessage?: string;
      };

      if (!response.ok || !payload.assignment) {
        const hint =
          payload.error?.includes('file_url') || payload.error?.includes('file_name')
            ? ' Run supabase/FIX_ASSIGNMENT_ANNOUNCEMENT_ATTACHMENTS.sql in Supabase SQL Editor, then try again.'
            : '';
        setStatus(`Could not create assignment: ${payload.error ?? 'Unknown error'}${hint}`);
        return;
      }

      setAssignments((current) => [payload.assignment!, ...current]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setClassGrade('');
      setCreateFile(null);
      setStatus(payload.notificationMessage ?? 'Assignment created.');
      router.refresh();
    } catch (uploadError) {
      setStatus(uploadError instanceof Error ? uploadError.message : 'Could not upload the attachment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assignment? Existing submissions will stay but lose the link.')) return;

    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) {
      setStatus(`Delete failed: ${error.message}`);
      return;
    }

    setAssignments((current) => current.filter((item) => item.id !== id));
    router.refresh();
  };

  const handleDeleteAttachment = async (assignment: AssignmentRow) => {
    if (!window.confirm('Remove the attached homework file from this assignment?')) return;

    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('assignments')
        .update({ file_url: null, file_name: null })
        .eq('id', assignment.id);

      if (error) {
        setStatus(`Could not remove attachment: ${error.message}`);
        return;
      }

      setAssignments((current) =>
        current.map((item) =>
          item.id === assignment.id ? { ...item, file_url: null, file_name: null } : item
        )
      );
      setStatus('Attachment removed.');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const startEdit = (assignment: AssignmentRow) => {
    setEditingId(assignment.id);
    setEditTitle(assignment.title);
    setEditDescription(assignment.description ?? '');
    setEditDueDate(assignment.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : '');
    setEditClassGrade((assignment.class_grade as ClassGrade) ?? '');
    setEditFile(null);
    setEditClearAttachment(false);
    setOpenId(assignment.id);
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDate('');
    setEditClassGrade('');
    setEditFile(null);
    setEditClearAttachment(false);
  };

  const handleEditSave: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    if (!editClassGrade) {
      setStatus('Please select a class grade for this assignment.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const current = assignments.find((item) => item.id === editingId);
      let fileUrl = editClearAttachment ? null : (current?.file_url ?? null);
      let fileName = editClearAttachment ? null : (current?.file_name ?? null);

      if (editFile) {
        const uploaded = await uploadTeacherAttachment(editFile);
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.fileName;
      }

      const { error } = await supabase
        .from('assignments')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
          class_grade: editClassGrade,
          file_url: fileUrl,
          file_name: fileName
        })
        .eq('id', editingId);

      if (error) {
        setStatus(`Could not update assignment: ${error.message}`);
        return;
      }

      setAssignments((currentList) =>
        currentList.map((assignment) =>
          assignment.id === editingId
            ? {
                ...assignment,
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
                class_grade: editClassGrade,
                file_url: fileUrl,
                file_name: fileName
              }
            : assignment
        )
      );
      setStatus('Assignment updated.');
      cancelEdit();
      router.refresh();
    } catch (uploadError) {
      setStatus(uploadError instanceof Error ? uploadError.message : 'Could not upload the attachment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Homework Assignments</h2>
        <p className="mt-2 text-slate-600">Create structured tasks with due dates for students to submit against.</p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2" onSubmit={handleCreate}>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            required
            placeholder="Week 3 — Reading practice"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <ClassGradeSelect value={classGrade} onChange={setClassGrade} disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Due date (optional)</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.currentTarget.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
          />
        </div>
        <div className="md:col-span-2">
          <AttachmentFileInput
            label="Attach homework file (optional)"
            file={createFile}
            onFileChange={setCreateFile}
            disabled={loading}
          />
        </div>
        <div className="flex items-end md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {loading ? 'Creating...' : 'Create assignment'}
          </button>
        </div>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {assignments.length ? (
          assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                  {assignment.class_grade && (
                    <p className="mt-1 text-xs font-semibold text-blue-700">{assignment.class_grade}</p>
                  )}
                  {assignment.description && <p className="mt-1 text-sm text-slate-600">{assignment.description}</p>}
                  {assignment.file_url && (
                    <p className="mt-1 text-xs font-medium text-slate-500">Attachment: {assignment.file_name ?? 'Homework file'}</p>
                  )}
                  {assignment.due_date && (
                    <p className="mt-1 text-xs text-amber-700">Due: {new Date(assignment.due_date).toLocaleString()}</p>
                  )}
                </div>
                <ItemRowActions
                  attachment={assignment}
                  detailsOpen={openId === assignment.id}
                  onToggleDetails={() => handleOpen(assignment.id)}
                  onEdit={() => startEdit(assignment)}
                  onDelete={() => handleDelete(assignment.id)}
                />
              </div>

              {openId === assignment.id && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {editingId === assignment.id ? (
                    <form className="space-y-4" onSubmit={handleEditSave}>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Title</label>
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.currentTarget.value)}
                          required
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.currentTarget.value)}
                          rows={3}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                        />
                      </div>
                      <ClassGradeSelect value={editClassGrade} onChange={setEditClassGrade} disabled={loading} />
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Due date</label>
                        <input
                          type="datetime-local"
                          value={editDueDate}
                          onChange={(event) => setEditDueDate(event.currentTarget.value)}
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500"
                        />
                      </div>
                      {assignment.file_url && !editClearAttachment && !editFile && (
                        <AttachmentActions
                          attachment={assignment}
                          onDelete={() => setEditClearAttachment(true)}
                          busy={loading}
                        />
                      )}
                      <AttachmentFileInput
                        label={assignment.file_url && !editClearAttachment ? 'Replace homework file' : 'Attach homework file'}
                        file={editFile}
                        onFileChange={setEditFile}
                        disabled={loading}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
                        >
                          {loading ? 'Saving...' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 text-sm text-slate-700">
                      <div className="space-y-2">
                        <p>
                          <span className="font-semibold text-slate-900">Title:</span> {assignment.title}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Description:</span>{' '}
                          {assignment.description || 'No description added.'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Due date:</span>{' '}
                          {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date set.'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Created:</span>{' '}
                          {new Date(assignment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {assignment.file_url ? (
                        <AttachmentActions
                          attachment={assignment}
                          onReplace={() => startEdit(assignment)}
                          onDelete={() => handleDeleteAttachment(assignment)}
                          busy={loading}
                        />
                      ) : (
                        <p className="text-slate-500">No homework file attached.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))
        ) : (
          <p className="text-slate-600">No assignments yet. Create one above.</p>
        )}
      </div>
    </div>
  );
}
