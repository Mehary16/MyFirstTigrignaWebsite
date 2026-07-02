'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { StudentListItem } from './TeacherStudentList';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from './ui';

type CreateMode = 'password' | 'invite';

type TeacherStudentCreateFormProps = {
  onStudentCreated?: (student: StudentListItem) => void;
};

export default function TeacherStudentCreateForm({ onStudentCreated }: TeacherStudentCreateFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [mode, setMode] = useState<CreateMode>('password');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          temporaryPassword: mode === 'password' ? temporaryPassword : undefined,
          mode
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        student?: StudentListItem;
      };

      if (!response.ok || payload.error || !payload.student) {
        setFeedback({ type: 'error', message: payload.error ?? 'Could not create the student account.' });
        return;
      }

      setFeedback({ type: 'success', message: payload.message ?? 'Student created successfully.' });
      setFullName('');
      setEmail('');
      setTemporaryPassword('');
      onStudentCreated?.(payload.student);
      router.refresh();
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Could not create the student account.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle className="text-xl">Add Student</CardTitle>
        <CardDescription>
          Create a student account for younger learners. You can either set a temporary password or send a setup email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Student name" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} required />
            <Input label="Student email" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} required />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Setup method</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={mode === 'password' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('password')}>
                Temporary password
              </Button>
              <Button type="button" variant={mode === 'invite' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('invite')}>
                Send setup email
              </Button>
            </div>
          </div>

          {mode === 'password' ? (
            <Input
              label="Temporary password"
              type="text"
              minLength={8}
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.currentTarget.value)}
              hint="Student will be required to change this password after first login."
              required
            />
          ) : (
            <Alert variant="info" title="Setup email option">
              Supabase will email the student a setup link. They will finish account setup online and choose a password there.
            </Alert>
          )}

          {feedback ? <Alert variant={feedback.type === 'success' ? 'success' : 'error'}>{feedback.message}</Alert> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : mode === 'password' ? 'Create student' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
