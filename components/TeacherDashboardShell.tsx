'use client';

import { useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Users,
  Video
} from 'lucide-react';
import TeacherLessonForm from './TeacherLessonForm';
import TeacherLessonList, { type LessonRow } from './TeacherLessonList';
import TeacherMaterialForm from './TeacherMaterialForm';
import TeacherMaterialList from './TeacherMaterialList';
import TeacherSubmissionGrid from './TeacherSubmissionGrid';
import TeacherStudentList, { type StudentListItem } from './TeacherStudentList';
import TeacherGradeManager, { type GradeRow, type StudentOption } from './TeacherGradeManager';
import TeacherParentLinkForm from './TeacherParentLinkForm';
import TeacherAssignmentManager, { type AssignmentRow } from './TeacherAssignmentManager';
import TeacherLiveClassManager, { type LiveClassRow } from './TeacherLiveClassManager';
import TeacherAnnouncementManager, { type AnnouncementRow } from './TeacherAnnouncementManager';
import type { MaterialRow } from '../lib/teacherMaterials';

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
};

type TeacherTab = 'overview' | 'students' | 'homework' | 'teaching' | 'grades' | 'communication';

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

function OverviewCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

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
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </section>
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
  announcements
}: TeacherDashboardShellProps) {
  const [activeTab, setActiveTab] = useState<TeacherTab>('overview');
  const [showQuickActions, setShowQuickActions] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Students" value={studentCount} helper={`${overview.activeStudents} active learners`} icon={Users} />
        <OverviewCard label="Homework" value={assignments.length} helper={`${overview.pendingReview} total submissions to review`} icon={ClipboardList} />
        <OverviewCard label="Live Classes" value={overview.upcomingClasses} helper="Upcoming sessions on the calendar" icon={Video} />
        <OverviewCard label="Announcements" value={announcements.length} helper="Recent updates for students and parents" icon={Bell} />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Teacher Workspace</h2>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowQuickActions((current) => !current)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quick Actions
            </button>

            {showQuickActions && (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                activeTab === tab.id
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <p className="text-sm font-semibold">{tab.label}</p>
              </div>
              <p className={`mt-1 text-xs ${activeTab === tab.id ? 'text-slate-200' : 'text-slate-500'}`}>{tab.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

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
                <p className="text-slate-600">No assignments yet.</p>
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
                <p className="text-slate-600">No lessons added yet.</p>
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
                <p className="text-slate-600">No announcements posted yet.</p>
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
                <p className="text-slate-600">No live classes scheduled yet.</p>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          <SectionCard title="Student Management" description="View students, suspend accounts, and remove profiles when needed.">
            <TeacherStudentList students={studentList} totalCount={studentCount} />
          </SectionCard>
          <SectionCard title="Parent Linking" description="Connect each child account to the correct parent email.">
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
            <TeacherSubmissionGrid />
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
          <SectionCard title="Live Classes">
            <TeacherLiveClassManager initialClasses={liveClasses} />
          </SectionCard>
        </div>
      )}
    </div>
  );
}
