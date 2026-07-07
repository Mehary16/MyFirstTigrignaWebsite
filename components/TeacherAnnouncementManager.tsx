'use client';

import { useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { uploadTeacherAttachment } from '../lib/attachments';
import type { ClassGrade } from '../lib/classGrades';
import { createBrowserSupabaseClient } from '../lib/supabaseClient';
import ClassGradeSelect from './ClassGradeSelect';
import { AttachmentActions, AttachmentFileInput, ItemRowActions } from './AttachmentField';

export type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  file_url: string | null;
  file_name: string | null;
  class_grade: string | null;
  created_at: string;
};

const ANNOUNCEMENT_SELECT = 'id, title, body, file_url, file_name, class_grade, created_at';

type TeacherAnnouncementManagerProps = {
  initialAnnouncements: AnnouncementRow[];
};

export default function TeacherAnnouncementManager({ initialAnnouncements }: TeacherAnnouncementManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade | ''>('');
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editClassGrade, setEditClassGrade] = useState<ClassGrade | ''>('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editClearAttachment, setEditClearAttachment] = useState(false);

  const handleCreate: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!classGrade) {
      setStatus('Please select a class grade for this announcement.');
      setLoading(false);
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (createFile) {
        const uploaded = await uploadTeacherAttachment(createFile);
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.fileName;
      }

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          classGrade,
          fileUrl,
          fileName
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        announcement?: AnnouncementRow;
        notificationMessage?: string;
      };

      if (!response.ok || !payload.announcement) {
        const hint = payload.error?.includes('announcements')
          ? ' Run supabase/FIX_ANNOUNCEMENTS.sql in Supabase SQL Editor, then try again.'
          : payload.error?.includes('file_url') || payload.error?.includes('file_name')
            ? ' Run supabase/FIX_ASSIGNMENT_ANNOUNCEMENT_ATTACHMENTS.sql in Supabase SQL Editor, then try again.'
            : '';
        setStatus(`Could not post announcement: ${payload.error ?? 'Unknown error'}${hint}`);
        return;
      }

      setAnnouncements((current) => [payload.announcement!, ...current]);
      setTitle('');
      setBody('');
      setClassGrade('');
      setCreateFile(null);
      setStatus(payload.notificationMessage ?? 'Announcement posted.');
      router.refresh();
    } catch (uploadError) {
      setStatus(uploadError instanceof Error ? uploadError.message : 'Could not upload the attachment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      setStatus(error.message);
      return;
    }
    setAnnouncements((current) => current.filter((item) => item.id !== id));
    router.refresh();
  };

  const handleDeleteAttachment = async (item: AnnouncementRow) => {
    if (!window.confirm('Remove the attached file from this announcement?')) return;

    setLoading(true);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('announcements')
        .update({ file_url: null, file_name: null })
        .eq('id', item.id);

      if (error) {
        setStatus(`Could not remove attachment: ${error.message}`);
        return;
      }

      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === item.id ? { ...announcement, file_url: null, file_name: null } : announcement
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

  const startEdit = (item: AnnouncementRow) => {
    setEditingId(item.id);
    setOpenId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditClassGrade((item.class_grade as ClassGrade) ?? '');
    setEditFile(null);
    setEditClearAttachment(false);
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
    setEditClassGrade('');
    setEditFile(null);
    setEditClearAttachment(false);
  };

  const handleSaveEdit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    if (!editClassGrade) {
      setStatus('Please select a class grade for this announcement.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const current = announcements.find((item) => item.id === editingId);
      let fileUrl = editClearAttachment ? null : (current?.file_url ?? null);
      let fileName = editClearAttachment ? null : (current?.file_name ?? null);

      if (editFile) {
        const uploaded = await uploadTeacherAttachment(editFile);
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.fileName;
      }

      const { error } = await supabase
        .from('announcements')
        .update({
          title: editTitle.trim(),
          body: editBody.trim(),
          class_grade: editClassGrade,
          file_url: fileUrl,
          file_name: fileName
        })
        .eq('id', editingId);

      if (error) {
        const hint = error.message.includes('announcements')
          ? ' Run supabase/FIX_ANNOUNCEMENTS.sql in Supabase SQL Editor, then try again.'
          : '';
        setStatus(`Could not update announcement: ${error.message}${hint}`);
        return;
      }

      setAnnouncements((currentList) =>
        currentList.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: editTitle.trim(),
                body: editBody.trim(),
                class_grade: editClassGrade,
                file_url: fileUrl,
                file_name: fileName
              }
            : item
        )
      );
      setStatus('Announcement updated.');
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
      <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={handleCreate}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.currentTarget.value)} required className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.currentTarget.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" />
        </div>
        <ClassGradeSelect value={classGrade} onChange={setClassGrade} disabled={loading} />
        <AttachmentFileInput
          label="Attach file (optional)"
          file={createFile}
          onFileChange={setCreateFile}
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400">
          {loading ? 'Posting...' : 'Post announcement'}
        </button>
      </form>

      {status && <p className="text-sm text-slate-600">{status}</p>}

      <div className="space-y-3">
        {announcements.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                {item.class_grade && <p className="mt-1 text-xs font-semibold text-blue-700">{item.class_grade}</p>}
                <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                {item.file_url && (
                  <p className="mt-1 text-xs font-medium text-slate-500">Attachment: {item.file_name ?? 'File'}</p>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
              </div>
              <ItemRowActions
                attachment={item}
                detailsOpen={openId === item.id}
                onToggleDetails={() => handleOpen(item.id)}
                onEdit={() => startEdit(item)}
                onDelete={() => handleDelete(item.id)}
              />
            </div>

            {openId === item.id && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {editingId === item.id ? (
                  <form className="space-y-4" onSubmit={handleSaveEdit}>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Title</label>
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.currentTarget.value)}
                        required
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Message</label>
                      <textarea
                        value={editBody}
                        onChange={(event) => setEditBody(event.currentTarget.value)}
                        required
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
                      />
                    </div>
                    <ClassGradeSelect value={editClassGrade} onChange={setEditClassGrade} disabled={loading} />
                    {item.file_url && !editClearAttachment && !editFile && (
                      <AttachmentActions
                        attachment={item}
                        onDelete={() => setEditClearAttachment(true)}
                        busy={loading}
                      />
                    )}
                    <AttachmentFileInput
                      label={item.file_url && !editClearAttachment ? 'Replace attachment' : 'Attach file'}
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
                        <span className="font-semibold text-slate-900">Title:</span> {item.title}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-900">Posted:</span> {new Date(item.created_at).toLocaleString()}
                      </p>
                      <p className="whitespace-pre-wrap">
                        <span className="font-semibold text-slate-900">Message:</span> {item.body}
                      </p>
                    </div>
                    {item.file_url ? (
                      <AttachmentActions
                        attachment={item}
                        onReplace={() => startEdit(item)}
                        onDelete={() => handleDeleteAttachment(item)}
                        busy={loading}
                      />
                    ) : (
                      <p className="text-slate-500">No file attached.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
