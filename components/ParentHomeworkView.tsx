import { getSubmissionViewLabel, type SubmissionType } from '../lib/submissionMedia';

export type ParentSubmissionRow = {
  id: string;
  video_url: string | null;
  submission_type: string;
  file_name: string | null;
  notes: string | null;
  teacher_feedback: string | null;
  feedback_at: string | null;
  created_at: string;
  assignment_id: string | null;
  assignments?: { title: string } | { title: string }[] | null;
};

function getAssignmentTitle(assignments: ParentSubmissionRow['assignments']) {
  if (!assignments) return null;
  if (Array.isArray(assignments)) return assignments[0]?.title ?? null;
  return assignments.title;
}

type ParentHomeworkViewProps = {
  submissions: ParentSubmissionRow[];
  childName: string;
};

export default function ParentHomeworkView({ submissions, childName }: ParentHomeworkViewProps) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-950">{childName}&apos;s homework</h3>
      {!submissions.length ? (
        <p className="mt-2 text-sm text-slate-600">No homework submitted yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {submissions.map((submission) => {
            const assignmentTitle = getAssignmentTitle(submission.assignments);
            return (
              <article key={submission.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {assignmentTitle ?? 'General homework'}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(submission.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-amber-700">
                      {submission.submission_type}
                      {submission.file_name ? ` · ${submission.file_name}` : ''}
                    </p>
                  </div>
                  {submission.video_url && (
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      {getSubmissionViewLabel(submission.submission_type as SubmissionType)}
                    </a>
                  )}
                </div>
                {submission.notes && <p className="mt-2 text-sm text-slate-600">Student notes: {submission.notes}</p>}
                {submission.teacher_feedback && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase text-emerald-800">Teacher feedback</p>
                    <p className="mt-1 text-sm text-emerald-900">{submission.teacher_feedback}</p>
                    {submission.feedback_at && (
                      <p className="mt-1 text-xs text-emerald-700">{new Date(submission.feedback_at).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
