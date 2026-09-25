import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';

export default function NotFoundPage() {
  const t = useTranslations();

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="mb-4 text-center text-6xl font-semibold text-primary-ink/40" aria-hidden="true">
        404
      </p>
      <EmptyState
        title={t('notFound.title')}
        description={t('notFound.description')}
        action={
          <LinkButton href="/" leadingIcon={<ArrowLeft className="rtl:-scale-x-100" />}>
            {t('common.back')}
          </LinkButton>
        }
      />
    </section>
  );
}
