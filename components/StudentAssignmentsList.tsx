'use client';

import { useState } from 'react';
import { getAttachmentDownloadHref, getAttachmentOpenHref } from '../lib/attachments';
import type { AssignmentRow } from './TeacherAssignmentManager';
import { getFileExtension, inferMediaKind } from '../lib/teacherMaterials';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

function isImageAssignment(assignment: AssignmentRow) {
  const extension = getFileExtension(assignment.file_name ?? assignment.file_url ?? '');
  return IMAGE_EXTENSIONS.has(extension);
}

function isPdfAssignment(assignment: AssignmentRow) {
  return getFileExtension(assignment.file_name ?? assignment.file_url ?? '') === 'pdf';
}

function AssignmentOpenPanel({ assignment }: { assignment: AssignmentRow }) {
  if (!assignment.file_url) return null;

  const mediaKind = inferMediaKind(undefined, assignment.file_url, assignment.file_name);

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
      {mediaKind === 'video' && (
        <video controls className="w-full rounded-2xl border border-slate-200 bg-black" src={assignment.file_url}>
          Your browser does not support video playback.
        </video>
      )}

      {mediaKind === 'audio' && (
        <audio controls className="w-full" src={assignment.file_url}>
          Your browser does not support audio playback.
        </audio>
      )}

      {mediaKind === 'file' && isImageAssignment(assignment) && (
        <img
          src={assignment.file_url}
          alt={assignment.file_name ?? assignment.title}
          className="max-h-[28rem] w-full rounded-2xl border border-slate-200 bg-white object-contain"
        />
      )}

      {mediaKind === 'file' && isPdfAssignment(assignment) && (
        <iframe
          title={assignment.title}
          src={assignment.file_url}
          className="h-[28rem] w-full rounded-2xl border border-slate-200 bg-white"
        />
      )}

      {mediaKind === 'file' && !isImageAssignment(assignment) && !isPdfAssignment(assignment) && (
        <p className="text-sm text-slate-600">
          Preview is not available for this file type.{' '}
          <a href={assignment.file_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">
            Open file in a new tab
          </a>
          .
        </p>
      )}
    </div>
  );
}

type StudentAssignmentsListProps = {
  assignments: AssignmentRow[];
  submittedAssignmentIds: string[];
};

export default function StudentAssignmentsList({ assignments, submittedAssignmentIds }: StudentAssignmentsListProps) {
  const submittedSet = new Set(submittedAssignmentIds);
  const now = Date.now();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!assignments.length) return null;

  return (
    <section id="student-assignments" className="rounded-[2rem] border border-amber-100 bg-amber-50/40 p-6">
      <h2 className="text-xl font-semibold text-slate-950">Assigned Homework</h2>
      <p className="mt-1 text-sm text-slate-600">Submit your work using the form below and select the matching assignment.</p>
      <div className="mt-4 space-y-3">
        {assignments.map((assignment) => {
          const isSubmitted = submittedSet.has(assignment.id);
          const isOverdue = assignment.due_date && new Date(assignment.due_date).getTime() < now && !isSubmitted;
          const openHref = getAttachmentOpenHref(assignment);
          const downloadHref = getAttachmentDownloadHref(assignment);

          return (
            <article key={assignment.id} id={`assignment-${assignment.id}`} className="rounded-2xl border border-amber-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                {isSubmitted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Submitted</span>}
                {isOverdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Overdue</span>}
              </div>
              {assignment.description && <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>}
              {assignment.due_date && (
                <p className="mt-1 text-xs text-amber-700">Due: {new Date(assignment.due_date).toLocaleString()}</p>
              )}
              {openHref && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId((current) => (current === assignment.id ? null : assignment.id))}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {openId === assignment.id ? 'Close' : 'Open'}
                  </button>
                  {downloadHref && (
                    <a
                      href={downloadHref}
                      download={assignment.file_name ?? undefined}
                      className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                    >
                      Download
                    </a>
                  )}
                </div>
              )}
              {openId === assignment.id && <AssignmentOpenPanel assignment={assignment} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
