'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Users
} from 'lucide-react';
import TeacherLessonForm from './TeacherLessonForm';
import TeacherLessonList, { type LessonRow } from './TeacherLessonList';
import TeacherMaterialForm from './TeacherMaterialForm';
import TeacherMaterialList from './TeacherMaterialList';
import TeacherSubmissionGrid from './TeacherSubmissionGrid';
import TeacherStudentList from './TeacherStudentList';
import type { StudentListItem } from '../lib/studentList';
import TeacherGradeManager, { type GradeRow, type StudentOption } from './TeacherGradeManager';
import TeacherParentLinkForm from './TeacherParentLinkForm';
import TeacherAssignmentManager, { type AssignmentRow } from './TeacherAssignmentManager';
import TeacherLiveClassManager, { type LiveClassRow } from './TeacherLiveClassManager';
import TeacherAnnouncementManager, { type AnnouncementRow } from './TeacherAnnouncementManager';
import TeacherCommandBar from './TeacherCommandBar';
import type { MaterialRow } from '../lib/teacherMaterials';
import Button from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from './ui';
import { cn } from '../lib/cn';

type TeacherDashboardShellProps = {
  studentList: StudentListItem[];
  studentCount: number;
  studentOptions: StudentOption[];
  grades: GradeRow[];
  documents: MaterialRow[];
  lessons: LessonRow[];
  assignments: AssignmentRow[];
  liveClasses: LiveClassRow[];
  announcements: AnnouncementRow[];
  initialTab?: string | null;
  highlightSubmissionId?: string | null;
};

type TeacherTab = 'overview' | 'students' | 'homework' | 'teaching' | 'grades' | 'communication';

function parseTeacherTab(value?: string | null): TeacherTab {
  const tabs: TeacherTab[] = ['overview', 'students', 'homework', 'teaching', 'grades', 'communication'];
  return tabs.includes(value as TeacherTab) ? (value as TeacherTab) : 'overview';
}

type TabConfig = {
  id: TeacherTab;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', subtitle: 'Quick snapshot', icon: LayoutDashboard },
  { id: 'students', label: 'Students', subtitle: 'Classroom management', icon: Users },
  { id: 'homework', label: 'Homework', subtitle: 'Assignments and review', icon: ClipboardList },
  { id: 'teaching', label: 'Teaching', subtitle: 'Lessons and materials', icon: BookOpen },
  { id: 'grades', label: 'Grades', subtitle: 'Score tracking', icon: GraduationCap },
  { id: 'communication', label: 'Communication', subtitle: 'Announcements and live classes', icon: MessageSquare }
];

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="elevated">
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function TeacherDashboardShell({
  studentList,
  studentCount,
  studentOptions,
  grades,
  documents,
  lessons,
  assignments,
  liveClasses,
  announcements,
  initialTab,
  highlightSubmissionId
}: TeacherDashboardShellProps) {
  const [activeTab, setActiveTab] = useState<TeacherTab>(() => parseTeacherTab(initialTab));
  const [showQuickActions, setShowQuickActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTab(parseTeacherTab(initialTab));
  }, [initialTab]);

  const overview = useMemo(() => {
    const activeStudents = studentList.filter((student) => student.is_active).length;
    const pendingReview = studentList.reduce((sum, student) => sum + student.submission_count, 0);
    const upcomingClasses = liveClasses.filter((item) => new Date(item.scheduled_at).getTime() >= Date.now()).length;
    const latestAnnouncements = announcements.slice(0, 2);
    const latestAssignments = assignments.slice(0, 3);
    const latestLessons = lessons.slice(0, 3);

    return {
      activeStudents,
      pendingReview,
      upcomingClasses,
      latestAnnouncements,
      latestAssignments,
      latestLessons
    };
  }, [announcements, assignments, lessons, liveClasses, studentList]);

  const tabLabels = useMemo(
    () => ({
      overview: 'Overview',
      students: `Students (${studentCount})`,
      homework: `Homework (${assignments.length})`,
      teaching: 'Teaching',
      grades: 'Grades',
      communication: `Communication (${overview.upcomingClasses} live · ${announcements.length} ann)`
    }),
    [announcements.length, assignments.length, overview.upcomingClasses, studentCount]
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (quickActionsRef.current?.contains(target)) return;
      setShowQuickActions(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  return (
    <div className="space-y-8">
      <Card variant="elevated" padding="sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Teacher Workspace</h2>
          </div>
          <div ref={quickActionsRef} className="relative">
            <Button type="button" variant="secondary" onClick={() => setShowQuickActions((current) => !current)}>
              Quick Actions
            </Button>

            {showQuickActions && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('teaching');
                      setShowQuickActions(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Add lesson
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('homework');
                      setShowQuickActions(false);
                    }}
                    className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Create assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('communication');
                      setShowQuickActions(false);
                    }}
                    className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Post announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('grades');
                      setShowQuickActions(false);
                    }}
                    className="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Add grade
                  </button>
                </div>
              )}
            </div>
        </div>

        <TeacherCommandBar
          students={studentList}
          lessons={lessons}
          assignments={assignments}
          grades={grades}
          announcements={announcements}
          onNavigate={setActiveTab}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-2xl border px-4 py-4 text-left transition',
                activeTab === tab.id
                  ? 'border-brand-900 bg-brand-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
              )}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4 shrink-0" />
                <p className="text-sm font-semibold leading-snug">{tabLabels[tab.id]}</p>
              </div>
              <p className={cn('mt-1 text-xs', activeTab === tab.id ? 'text-slate-200' : 'text-slate-500')}>{tab.subtitle}</p>
            </button>
          ))}
        </div>
      </Card>

      <div key={activeTab} className="animate-fade-in">
      {activeTab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard title="Recent Assignments" description="The latest homework tasks you created for students.">
              {overview.latestAssignments.length ? (
                <div className="space-y-3">
                  {overview.latestAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{assignment.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{assignment.description || 'No description added.'}</p>
                      <p className="mt-2 text-xs text-amber-700">
                        {assignment.due_date ? `Due ${new Date(assignment.due_date).toLocaleString()}` : 'No due date'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No assignments yet." description="Create your first homework task from the Homework tab." />
              )}
            </SectionCard>

            <SectionCard title="Latest Lessons" description="A quick view of the most recent lesson library entries.">
              {overview.latestLessons.length ? (
                <div className="space-y-3">
                  {overview.latestLessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{lesson.title}</p>
                        {lesson.level ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{lesson.level}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{lesson.description || 'No description added.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No lessons added yet." description="Add lessons from the Teaching tab to build your library." />
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Latest Announcements" description="Recent messages sent to students and parents.">
              {overview.latestAnnouncements.length ? (
                <div className="space-y-3">
                  {overview.latestAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{announcement.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(announcement.created_at).toLocaleString()}</p>
                      <p className="mt-2 text-sm text-slate-600">{announcement.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No announcements posted yet." description="Share updates with students and parents from Communication." />
              )}
            </SectionCard>

            <SectionCard title="Upcoming Live Classes" description="Sessions students and parents will see next.">
              {liveClasses.length ? (
                <div className="space-y-3">
                  {liveClasses.slice(0, 3).map((liveClass) => (
                    <div key={liveClass.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{liveClass.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{new Date(liveClass.scheduled_at).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">{liveClass.duration_minutes} minutes</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No live classes scheduled yet." description="Schedule a session so students and parents can see it on their dashboards." />
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          <SectionCard title="Student Management" description="Student List, Student Status, and Parent Linking">
            <TeacherStudentList students={studentList} totalCount={studentCount} />
          </SectionCard>
          <SectionCard title="">
            <TeacherParentLinkForm students={studentOptions} />
          </SectionCard>
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard title="Assignments" description="Create structured homework with due dates and update existing tasks.">
            <TeacherAssignmentManager initialAssignments={assignments} />
          </SectionCard>
          <SectionCard title="Submission Review" description="Open student work and leave helpful feedback quickly.">
            <TeacherSubmissionGrid highlightSubmissionId={highlightSubmissionId} />
          </SectionCard>
        </div>
      )}

      {activeTab === 'teaching' && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Add New Lesson" description="Create lesson entries with title, level, links, and video URLs.">
              <TeacherLessonForm />
            </SectionCard>
            <SectionCard title="Manage Lessons">
              <TeacherLessonList initialLessons={lessons} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard title="Documents" description="Share PDFs, Word files, slide decks, and worksheets with students.">
              <TeacherMaterialForm category="document" />
              <TeacherMaterialList category="document" initialMaterials={documents} />
            </SectionCard>
            <SectionCard title="Video & Audio" description="Upload recordings or add media links for pronunciation and listening practice.">
              <TeacherMaterialForm category="media" />
              <TeacherMaterialList category="media" initialMaterials={documents} />
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <SectionCard title="Grades" description="Add scores, leave feedback, and import or export Excel grade sheets.">
          <TeacherGradeManager students={studentOptions} initialGrades={grades} />
        </SectionCard>
      )}

      {activeTab === 'communication' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard title="Announcements" description="Share updates with all students and parents.">
            <TeacherAnnouncementManager initialAnnouncements={announcements} />
          </SectionCard>
          <SectionCard title="Live Classes" description="Schedule Zoom or Google Meet sessions for students and parents.">
            <TeacherLiveClassManager initialClasses={liveClasses} />
          </SectionCard>
        </div>
      )}

      </div>
    </div>
  );
}
