import type { Metadata } from 'next';
import LegalDocument from '../../components/LegalDocument';
import { PRIVACY_POLICY } from '../../lib/legalCopy';

export const metadata: Metadata = {
  title: 'Privacy Policy | Tigrigna Learning Portal',
  description: 'How the Tigrigna Learning Portal collects, uses, and protects personal information.'
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      subtitle="How we handle personal information for students, parents, and teachers."
      lastUpdated="July 30, 2026"
      sections={PRIVACY_POLICY}
    />
  );
}
