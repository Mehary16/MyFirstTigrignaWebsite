import { BookOpen, ClipboardList, GraduationCap, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from './ui';

type ProgressSummaryProps = {
  lessonsViewed: number;
  totalLessons: number;
  submissionsCount: number;
  gradesCount: number;
  upcomingClasses: number;
  label?: string;
};

export default function ProgressSummary({
  lessonsViewed,
  totalLessons,
  submissionsCount,
  gradesCount,
  upcomingClasses,
  label = 'Your Progress'
}: ProgressSummaryProps) {
  const lessonPercent = totalLessons ? Math.round((lessonsViewed / totalLessons) * 100) : 0;

  return (
    <Card variant="default" className="border-emerald-100/80 bg-emerald-50/50">
      <CardHeader className="mb-4">
        <CardTitle className="text-xl">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Lessons viewed"
            value={`${lessonsViewed}/${totalLessons}`}
            helper={`${lessonPercent}% of library`}
            icon={BookOpen}
          />
          <StatCard
            label="Homework submitted"
            value={submissionsCount}
            helper="Total submissions sent"
            icon={ClipboardList}
          />
          <StatCard label="Grades received" value={gradesCount} helper="Scores from your teacher" icon={GraduationCap} />
          <StatCard label="Upcoming classes" value={upcomingClasses} helper="Live sessions scheduled" icon={Video} />
        </div>
      </CardContent>
    </Card>
  );
}
