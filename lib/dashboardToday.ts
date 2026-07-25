export type AssignmentDueInput = {
  id: string;
  due_date: string | null;
};

export type LessonContinueInput = {
  id: string;
  title: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar week: Sunday 00:00 through Saturday 23:59:59. */
export function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function countHomeworkDueThisWeek(
  assignments: AssignmentDueInput[],
  submittedAssignmentIds: string[],
  now = new Date()
) {
  const submitted = new Set(submittedAssignmentIds);
  const { start, end } = getWeekBounds(now);

  return assignments.filter((assignment) => {
    if (submitted.has(assignment.id) || !assignment.due_date) {
      return false;
    }

    const due = new Date(assignment.due_date);
    return due >= start && due <= end;
  }).length;
}

export function countHomeworkMissing(assignments: AssignmentDueInput[], submittedAssignmentIds: string[]) {
  const submitted = new Set(submittedAssignmentIds);
  return assignments.filter((assignment) => !submitted.has(assignment.id)).length;
}

export function countLessonsNotViewed(totalLessons: number, viewedLessonIds: string[]) {
  return Math.max(0, totalLessons - viewedLessonIds.length);
}

export function findContinueLesson(lessons: LessonContinueInput[], viewedLessonIds: string[]) {
  const viewed = new Set(viewedLessonIds);
  return lessons.find((lesson) => !viewed.has(lesson.id)) ?? null;
}

export function countSubmissionsToReview(submissions: { teacher_feedback: string | null }[]) {
  return submissions.filter((submission) => !submission.teacher_feedback?.trim()).length;
}

export function countInactiveStudentsThisWeek(
  activeStudentIds: string[],
  submissions: { student_id: string; created_at: string }[],
  lessonViews: { student_id: string; viewed_at: string }[],
  now = new Date()
) {
  const cutoff = now.getTime() - 7 * MS_PER_DAY;

  return activeStudentIds.filter((studentId) => {
    const hasRecentSubmission = submissions.some(
      (submission) =>
        submission.student_id === studentId && new Date(submission.created_at).getTime() >= cutoff
    );
    const hasRecentLessonView = lessonViews.some(
      (view) => view.student_id === studentId && new Date(view.viewed_at).getTime() >= cutoff
    );

    return !hasRecentSubmission && !hasRecentLessonView;
  }).length;
}

export function buildStudentTodaySummary(input: {
  homeworkDueThisWeek: number;
  lessonsNotViewed: number;
  continueLessonTitle: string | null;
}) {
  const parts: string[] = [];

  parts.push(
    input.homeworkDueThisWeek === 1
      ? '1 homework due this week'
      : `${input.homeworkDueThisWeek} homework due this week`
  );

  parts.push(
    input.lessonsNotViewed === 1
      ? '1 lesson not viewed'
      : `${input.lessonsNotViewed} lessons not viewed`
  );

  if (input.continueLessonTitle) {
    parts.push(`Continue: ${input.continueLessonTitle}`);
  }

  return parts.join(' · ');
}

export function buildTeacherTodaySummary(submissionsToReview: number, inactiveStudents: number) {
  const reviewPart =
    submissionsToReview === 1
      ? '1 submission to review'
      : `${submissionsToReview} submissions to review`;
  const inactivePart =
    inactiveStudents === 1
      ? '1 student inactive this week'
      : `${inactiveStudents} students inactive this week`;

  return `${reviewPart} · ${inactivePart}`;
}

export function buildParentTodaySummary(
  childName: string,
  lessonsViewed: number,
  totalLessons: number,
  homeworkMissing: number
) {
  const homeworkPart =
    homeworkMissing === 1 ? '1 homework missing' : `${homeworkMissing} homework missing`;

  return `Your child ${childName}: ${lessonsViewed}/${totalLessons} lessons viewed · ${homeworkPart}`;
}
