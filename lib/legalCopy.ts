export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const LEGAL_CONTACT = {
  organization: 'Tigrigna Learning Portal / ትምህርቲ ቋንቋ ትግርኛ ፍረ ጥበብ',
  teacher: 'Teacher Mehary Aynealem / መምህር መሓሪ ኣይንኣለም',
  email: 'mehary.aynealem1@gmail.com'
};

export const PRIVACY_POLICY: LegalSection[] = [
  {
    title: 'Introduction',
    paragraphs: [
      'This Privacy Policy explains how the Tigrigna Learning Portal ("we", "us", "the portal") collects, uses, and protects information when students, parents, and teachers use our website and learning services.',
      'We are committed to protecting the privacy of learners—especially children—and handling personal data responsibly.'
    ]
  },
  {
    title: 'Information we collect',
    paragraphs: ['We may collect the following types of information:'],
    bullets: [
      'Account details: name, email address, role (Student, Parent, or Teacher), and class grade where applicable.',
      'Learning activity: lesson views, homework submissions, grades, and in-app notifications.',
      'Uploaded content: files or links submitted as homework or shared by teachers as classroom materials.',
      'Technical data: basic session and security logs needed to operate and protect the service (via our hosting and authentication providers).'
    ]
  },
  {
    title: 'How we use information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Provide access to dashboards, lessons, homework, grades, and announcements.',
      'Allow teachers to manage classes and review student work.',
      'Allow parents to view linked children’s progress when authorized by the teacher.',
      'Send service-related emails such as account confirmation, password reset, and optional content notifications.',
      'Maintain security, prevent abuse, and improve the reliability of the portal.'
    ]
  },
  {
    title: 'Children and parental consent',
    paragraphs: [
      'This portal is designed for students aged 6–17. Student accounts may be created by a parent/guardian or by a teacher on behalf of a student.',
      'Parents may request information about a linked child’s account or ask the teacher to update or remove access. Teachers are responsible for linking parent accounts to the correct student records.'
    ]
  },
  {
    title: 'Cookies and similar technologies',
    paragraphs: [
      'We use essential cookies and browser storage required for login sessions, security, and basic site preferences (such as language choice on some pages).',
      'If we add analytics or marketing cookies in the future, we will update this policy and ask for consent where required before enabling non-essential tracking.',
      'You can control cookies through your browser settings. Disabling essential cookies may prevent you from signing in.'
    ]
  },
  {
    title: 'Third-party services',
    paragraphs: ['We rely on trusted service providers to operate the portal, including:'],
    bullets: [
      'Supabase — authentication, database, and file storage.',
      'Resend — transactional email delivery (when configured).',
      'Video or meeting links — external platforms linked by teachers (e.g. Zoom or Google Meet).'
    ]
  },
  {
    title: 'Data retention and deletion',
    paragraphs: [
      'We retain account and learning data while an account is active and as needed to provide the service.',
      'You may delete your account from Settings. Teachers may remove student records from the classroom management tools. Contact us if you need help with data removal.'
    ]
  },
  {
    title: 'Your rights',
    paragraphs: [
      'Depending on your location, you may have rights to access, correct, or delete personal data, or to object to certain processing.',
      'To exercise these rights, contact us using the email below. We will respond within a reasonable time.'
    ]
  },
  {
    title: 'Contact',
    paragraphs: [
      `Questions about this Privacy Policy may be sent to ${LEGAL_CONTACT.email}.`,
      `Organization: ${LEGAL_CONTACT.organization}. ${LEGAL_CONTACT.teacher}.`
    ]
  },
  {
    title: 'Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page will reflect the latest version. Continued use of the portal after changes constitutes acceptance of the updated policy.'
    ]
  }
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    title: 'Agreement',
    paragraphs: [
      'By accessing or using the Tigrigna Learning Portal, you agree to these Terms of Service. If you do not agree, please do not use the portal.',
      'If you are under 18, a parent or guardian should review these terms with you. Teachers and parents are responsible for ensuring appropriate use by students under their care.'
    ]
  },
  {
    title: 'Accounts and roles',
    paragraphs: ['The portal supports three roles:'],
    bullets: [
      'Students — access lessons, materials, homework, and grades for their assigned class.',
      'Parents — view progress and updates for children linked by a teacher.',
      'Teachers — manage classes, content, grades, announcements, and student access.'
    ]
  },
  {
    title: 'Acceptable use',
    paragraphs: ['You agree not to:'],
    bullets: [
      'Share login credentials or attempt to access another user’s account without permission.',
      'Upload harmful, offensive, or illegal content.',
      'Disrupt the service, attempt unauthorized access, or interfere with other users.',
      'Use the portal for commercial purposes unrelated to Tigrigna language learning.'
    ]
  },
  {
    title: 'Content and intellectual property',
    paragraphs: [
      'Lesson materials, documents, and media provided by teachers remain the property of their respective owners. Students and parents may use classroom materials only for personal learning within the portal.',
      'By submitting homework or other content, you grant the teacher permission to review, store, and provide feedback on that submission for educational purposes.'
    ]
  },
  {
    title: 'Teacher and parent responsibilities',
    paragraphs: [
      'Teachers are responsible for accurate class assignments, appropriate content, and linking parent accounts to the correct students.',
      'Parents are responsible for monitoring their child’s use of the portal and keeping account credentials secure.'
    ]
  },
  {
    title: 'Account suspension and termination',
    paragraphs: [
      'Teachers may suspend or deactivate student accounts for policy violations or classroom management reasons.',
      'We may suspend or terminate access if these terms are violated or if necessary to protect users and the service.',
      'You may delete your account at any time from Settings.'
    ]
  },
  {
    title: 'Disclaimer',
    paragraphs: [
      'The portal is provided for educational purposes "as is." We strive for reliability but do not guarantee uninterrupted access or error-free operation.',
      'External links (videos, meeting URLs, attachments) are provided by teachers and may be subject to third-party terms.'
    ]
  },
  {
    title: 'Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law, the portal operators shall not be liable for indirect, incidental, or consequential damages arising from use of the service.'
    ]
  },
  {
    title: 'Contact',
    paragraphs: [
      `For questions about these Terms, contact ${LEGAL_CONTACT.email}.`,
      `${LEGAL_CONTACT.organization}. ${LEGAL_CONTACT.teacher}.`
    ]
  },
  {
    title: 'Changes to these terms',
    paragraphs: [
      'We may update these Terms of Service from time to time. Material changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance.'
    ]
  }
];

export const COOKIE_NOTICE = {
  title: 'Cookie notice',
  body: 'We use essential cookies for sign-in and site functionality. Optional analytics cookies are not enabled today. See our Privacy Policy for details.',
  acceptLabel: 'Accept',
  privacyLabel: 'Privacy Policy'
};
