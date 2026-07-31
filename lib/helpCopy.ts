import { LEGAL_CONTACT } from './legalCopy';

export type HelpFaqItem = {
  question: string;
  answer: string;
};

export type HelpSection = {
  title: string;
  description?: string;
  faqs: HelpFaqItem[];
};

export const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Getting started',
    description: 'Account setup for students, parents, and teachers.',
    faqs: [
      {
        question: 'How do I create an account?',
        answer:
          'Go to Login and choose Create account. Students and parents can sign up directly. Teachers use the email configured as ADMIN_EMAIL in the portal settings.'
      },
      {
        question: 'I did not receive my confirmation email.',
        answer:
          'Check your spam folder first. If the link expired, try signing up again or ask your teacher to resend login help from the Students tab.'
      },
      {
        question: 'How does a parent see their child’s progress?',
        answer:
          'Parents create an account, then ask the teacher to link the parent account to the student. Once linked, grades, homework, and announcements appear on the parent dashboard.'
      }
    ]
  },
  {
    title: 'Students',
    faqs: [
      {
        question: 'Why can’t I see lessons or homework?',
        answer:
          'Your teacher must assign you to Grade 1, Grade 2, or Grade 3. Content is filtered by class grade. Contact your teacher if your grade is missing.'
      },
      {
        question: 'How do I submit homework?',
        answer:
          'Open your student dashboard, scroll to Homework Submission, choose an assignment if listed, and upload a file or paste a video link.'
      },
      {
        question: 'My account says it is suspended.',
        answer: 'Contact your teacher. Suspended accounts cannot access lessons until the teacher reactivates them.'
      }
    ]
  },
  {
    title: 'Teachers',
    faqs: [
      {
        question: 'How do I add students?',
        answer:
          'Open Teacher Dashboard → Students → Add student. You can also import students from Excel using the template on that page.'
      },
      {
        question: 'How do I notify students about new content?',
        answer:
          'When you publish lessons, homework, announcements, or live classes, in-app notifications are sent automatically. Email alerts require Resend to be configured.'
      },
      {
        question: 'How do I link a parent to a student?',
        answer: 'Open Teacher Dashboard → Students → Parent Linking, select the student, and enter the parent’s email address.'
      }
    ]
  },
  {
    title: 'Account & security',
    faqs: [
      {
        question: 'How do I change my password?',
        answer:
          'Open Settings from the header or dashboard, then use the Change password section. You can also use Forgot password on the login page if you are signed out.'
      },
      {
        question: 'How do I update notification preferences?',
        answer: 'Go to Settings → Notification preferences. Toggle the alerts you want and click Save preferences.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings → Delete account, type DELETE to confirm, and submit. This permanently removes your login access.'
      }
    ]
  },
  {
    title: 'Enterprise features (roadmap)',
    description: 'Planned or optional capabilities for larger deployments.',
    faqs: [
      {
        question: 'Will you support Google or Microsoft sign-in (SSO)?',
        answer:
          'OAuth sign-in can be enabled in Supabase when your organization configures Google or Microsoft providers. The login page includes SSO buttons that activate once providers are set up.'
      },
      {
        question: 'Will multi-factor authentication (MFA) be available?',
        answer:
          'MFA is on the roadmap and can be enabled through Supabase Auth when your deployment requires it. Until then, use a strong unique password and change it from Settings.'
      },
      {
        question: 'Do you offer billing or subscriptions?',
        answer:
          'The current portal is built for classroom use without built-in payments. Subscription billing can be added later if you plan to charge families or schools.'
      }
    ]
  }
];

export type PlatformReadinessRow = {
  area: string;
  readiness: string;
  summary: string;
};

/** Visible on /help — plain table (no charts). Updated when platform capabilities change. */
export const PLATFORM_READINESS: PlatformReadinessRow[] = [
  {
    area: 'User experience (UX)',
    readiness: 'High',
    summary: 'Role-based dashboards, mobile navigation, Help, Settings, notifications, and bilingual UI.'
  },
  {
    area: 'Security',
    readiness: 'Good',
    summary: 'Login, roles, database row-level security, legal pages, and account settings. MFA/SSO can be added in Supabase.'
  },
  {
    area: 'Content management',
    readiness: 'Good',
    summary: 'Teachers manage lessons, homework, grades, announcements, and files from the Teacher Dashboard.'
  },
  {
    area: 'Performance',
    readiness: 'Moderate',
    summary: 'Built on Next.js with image and font optimization. Large classes may need further tuning.'
  },
  {
    area: 'Scalability',
    readiness: 'Moderate',
    summary: 'Suited to a single school or classroom. Multi-school or very high traffic would need extra infrastructure.'
  }
];

export const PLATFORM_READINESS_INTRO = {
  title: 'Platform readiness',
  description:
    'Teacher-only summary of portal strengths and growth areas. Update lib/helpCopy.ts when capabilities change.'
};

export const HELP_SUPPORT = {
  title: 'Help & Support',
  subtitle: 'Answers to common questions about the Tigrigna Learning Portal.',
  contactIntro: 'Still need help? Email the teacher directly.',
  email: LEGAL_CONTACT.email,
  teacher: LEGAL_CONTACT.teacher
};
