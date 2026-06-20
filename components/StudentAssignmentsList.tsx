import type { AssignmentRow } from './TeacherAssignmentManager';

type StudentAssignmentsListProps = {
  assignments: AssignmentRow[];
  submittedAssignmentIds: string[];
};

export default function StudentAssignmentsList({ assignments, submittedAssignmentIds }: StudentAssignmentsListProps) {
  const submittedSet = new Set(submittedAssignmentIds);
  const now = Date.now();

  if (!assignments.length) return null;

  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50/40 p-6">
      <h2 className="text-xl font-semibold text-slate-950">Assigned Homework</h2>
      <p className="mt-1 text-sm text-slate-600">Submit your work using the form below and select the matching assignment.</p>
      <div className="mt-4 space-y-3">
        {assignments.map((assignment) => {
          const isSubmitted = submittedSet.has(assignment.id);
          const isOverdue = assignment.due_date && new Date(assignment.due_date).getTime() < now && !isSubmitted;

          return (
            <article key={assignment.id} className="rounded-2xl border border-amber-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                {isSubmitted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Submitted</span>}
                {isOverdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Overdue</span>}
              </div>
              {assignment.description && <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>}
              {assignment.due_date && (
                <p className="mt-1 text-xs text-amber-700">Due: {new Date(assignment.due_date).toLocaleString()}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
