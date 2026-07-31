import type { Metadata } from 'next';
import LegalDocument from '../../components/LegalDocument';
import { TERMS_OF_SERVICE } from '../../lib/legalCopy';

export const metadata: Metadata = {
  title: 'Terms of Service | Tigrigna Learning Portal',
  description: 'Terms and conditions for using the Tigrigna Learning Portal.'
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      subtitle="Rules and responsibilities for using the Tigrigna Learning Portal."
      lastUpdated="July 30, 2026"
      sections={TERMS_OF_SERVICE}
    />
  );
}
