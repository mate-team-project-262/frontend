import AccountLayout from '../../components/AccountLayout/AccountLayout.tsx';
import { usePageMeta } from '../../hooks/usePageMeta.ts';

/** Temporary page of a tab that is built in a later story (Sessions, Movie identity). */
export default function SectionSoon({ title }: { title: string }) {
  usePageMeta();
  return (
    <AccountLayout>
      <h2 style={{ margin: 0, fontFamily: 'var(--l-font-display)', fontSize: 36 }}>{title}</h2>
      <p style={{ margin: '12px 0 0', fontFamily: 'var(--l-font-text)', color: '#645b8d' }}>
        This section is coming soon.
      </p>
    </AccountLayout>
  );
}
