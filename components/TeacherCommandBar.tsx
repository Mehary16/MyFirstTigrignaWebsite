'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { CLASS_GRADES, normalizeClassGrade, type ClassGrade } from '../lib/classGrades';
import type { StudentListItem } from '../lib/studentList';
import type { GradeRow } from './TeacherGradeManager';
import type { LessonRow } from './TeacherLessonList';
import type { AssignmentRow } from './TeacherAssignmentManager';
import type { AnnouncementRow } from './TeacherAnnouncementManager';
import { cn } from '../lib/cn';

export type TeacherTab = 'overview' | 'students' | 'homework' | 'teaching' | 'grades' | 'communication';

type ContentFilter = 'all' | 'students' | 'lessons' | 'homework' | 'grades' | 'announcements';
type GradeFilter = 'all' | ClassGrade;

type CommandResult = {
  id: string;
  label: string;
  meta: string;
  tab: TeacherTab;
};

type TeacherCommandBarProps = {
  students: StudentListItem[];
  lessons: LessonRow[];
  assignments: AssignmentRow[];
  grades: GradeRow[];
  announcements: AnnouncementRow[];
  onNavigate: (tab: TeacherTab) => void;
};

function studentNameFromGrade(grade: GradeRow) {
  if (!grade.profiles) return 'Student';
  if (Array.isArray(grade.profiles)) return grade.profiles[0]?.full_name ?? 'Student';
  return grade.profiles.full_name;
}

export default function TeacherCommandBar({
  students,
  lessons,
  assignments,
  grades,
  announcements,
  onNavigate
}: TeacherCommandBarProps) {
  const [query, setQuery] = useState('');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const searchableItems = useMemo(() => {
    const items: Array<CommandResult & { classGrade: ClassGrade | null; kind: ContentFilter }> = [];

    for (const student of students) {
      items.push({
        id: `student-${student.id}`,
        label: student.full_name,
        meta: student.class_grade ? `${student.class_grade} · Student` : 'Student · no class grade',
        tab: 'students',
        classGrade: student.class_grade,
        kind: 'students'
      });
    }

    for (const lesson of lessons) {
      const classGrade = normalizeClassGrade(lesson.level);
      items.push({
        id: `lesson-${lesson.id}`,
        label: lesson.title,
        meta: classGrade ? `${classGrade} · Lesson` : 'Lesson',
        tab: 'teaching',
        classGrade,
        kind: 'lessons'
      });
    }

    for (const assignment of assignments) {
      const classGrade = normalizeClassGrade(assignment.class_grade);
      items.push({
        id: `assignment-${assignment.id}`,
        label: assignment.title,
        meta: classGrade ? `${classGrade} · Homework` : 'Homework',
        tab: 'homework',
        classGrade,
        kind: 'homework'
      });
    }

    for (const grade of grades) {
      const student = students.find((item) => item.id === grade.student_id);
      items.push({
        id: `grade-${grade.id}`,
        label: `${studentNameFromGrade(grade)} — ${grade.title}`,
        meta: `Score ${grade.grade}`,
        tab: 'grades',
        classGrade: student?.class_grade ?? null,
        kind: 'grades'
      });
    }

    for (const announcement of announcements) {
      items.push({
        id: `announcement-${announcement.id}`,
        label: announcement.title,
        meta: 'Announcement',
        tab: 'communication',
        classGrade: null,
        kind: 'announcements'
      });
    }

    return items;
  }, [announcements, assignments, grades, lessons, students]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    return searchableItems
      .filter((item) => {
        if (contentFilter !== 'all' && item.kind !== contentFilter) return false;
        if (gradeFilter !== 'all' && item.classGrade !== gradeFilter) return false;
        return item.label.toLowerCase().includes(needle) || item.meta.toLowerCase().includes(needle);
      })
      .slice(0, 8);
  }, [contentFilter, gradeFilter, query, searchableItems]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const handleSelect = (result: CommandResult) => {
    onNavigate(result.tab);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-card transition hover:shadow-card-lg lg:flex-row lg:items-stretch">
        <label className="flex min-w-0 flex-1 flex-col justify-center border-slate-200 px-4 py-2 lg:border-r">
          <span className="text-xs font-semibold text-slate-900">Search</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Student, lesson, homework, grade..."
            className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex flex-col justify-center border-slate-200 px-4 py-2 lg:w-40 lg:border-r">
          <span className="text-xs font-semibold text-slate-900">Type</span>
          <select
            value={contentFilter}
            onChange={(event) => setContentFilter(event.currentTarget.value as ContentFilter)}
            className="mt-0.5 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
          >
            <option value="all">All content</option>
            <option value="students">Students</option>
            <option value="lessons">Lessons</option>
            <option value="homework">Homework</option>
            <option value="grades">Grades</option>
            <option value="announcements">Announcements</option>
          </select>
        </label>

        <label className="flex flex-col justify-center px-4 py-2 lg:w-36">
          <span className="text-xs font-semibold text-slate-900">Class</span>
          <select
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.currentTarget.value as GradeFilter)}
            className="mt-0.5 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
          >
            <option value="all">All grades</option>
            {CLASS_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-stretch rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 lg:mx-1 lg:my-1"
        >
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </div>

      {open && query.trim() ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-lg">
          {results.length ? (
            <ul className="divide-y divide-slate-100">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{result.label}</p>
                      <p className="text-xs text-slate-500">{result.meta}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Open
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-slate-500">No matches for &ldquo;{query.trim()}&rdquo;.</p>
          )}
        </div>
      ) : null}

      {!query.trim() && (
        <p className={cn('mt-2 text-xs text-slate-500', open && 'hidden')}>
          Find a student, lesson, homework task, grade entry, or announcement — then jump straight to that section.
        </p>
      )}
    </div>
  );
}
