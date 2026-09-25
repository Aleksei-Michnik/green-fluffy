import { ArrowDown, Leaf, PawPrint, Sparkles, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/LinkButton';

const features: { key: 'animals' | 'plants' | 'care'; icon: ReactNode; iconClassName: string }[] = [
  { key: 'animals', icon: <PawPrint />, iconClassName: 'bg-accent-soft text-accent-ink' },
  { key: 'plants', icon: <Leaf />, iconClassName: 'bg-primary-soft text-primary-ink' },
  { key: 'care', icon: <Users />, iconClassName: 'bg-info-soft text-info-ink' },
];

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 lg:px-8">
        <Badge tone="accent" icon={<Sparkles />}>
          {t('eyebrow')}
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-ink-muted">{t('welcome')}</p>
        <LinkButton href="#features" size="lg" trailingIcon={<ArrowDown />}>
          {t('explore')}
        </LinkButton>
      </section>

      <section
        id="features"
        aria-labelledby="features-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8"
      >
        <h2 id="features-heading" className="mb-8 text-center text-2xl font-semibold text-ink">
          {t('featuresHeading')}
        </h2>
        <ul className="grid list-none gap-6 p-0 sm:grid-cols-3">
          {features.map(({ key, icon, iconClassName }) => (
            <Card key={key} as="li" className="flex flex-col gap-4">
              <span
                aria-hidden="true"
                className={`flex size-12 items-center justify-center rounded-full [&_svg]:size-6 ${iconClassName}`}
              >
                {icon}
              </span>
              <h3 className="text-xl font-semibold text-ink">{t(`features.${key}.title`)}</h3>
              <p className="text-ink-muted">{t(`features.${key}.description`)}</p>
            </Card>
          ))}
        </ul>
      </section>
    </>
  );
}
