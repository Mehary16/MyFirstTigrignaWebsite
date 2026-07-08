'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Globe2, GraduationCap, Sparkles, Target, Users } from 'lucide-react';
import EritreanHeritagePattern from '../../components/EritreanHeritagePattern';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { ABOUT_COPY, LOCALE_STORAGE_KEY, type AboutLocale } from '../../lib/aboutCopy';
import { cn } from '../../lib/cn';

export default function AboutPage() {
  const [locale, setLocale] = useState<AboutLocale>('en');
  const copy = ABOUT_COPY[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ti') {
      setLocale(stored);
    }
  }, []);

  const switchLocale = (next: AboutLocale) => {
    setLocale(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  };

  return (
    <div className="relative mx-auto max-w-5xl space-y-8">
      <div className="absolute right-0 top-0 z-10">
        <div
          className="inline-flex items-center rounded-full border border-slate-200 bg-white/95 p-0.5 text-xs font-semibold shadow-sm backdrop-blur"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => switchLocale('en')}
            className={cn(
              'rounded-full px-3 py-1 transition',
              locale === 'en' ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-slate-900'
            )}
            aria-pressed={locale === 'en'}
          >
            {copy.languageEn}
          </button>
          <span className="px-0.5 text-slate-300" aria-hidden>
            |
          </span>
          <button
            type="button"
            onClick={() => switchLocale('ti')}
            className={cn(
              'rounded-full px-3 py-1 transition',
              locale === 'ti' ? 'bg-brand-900 text-white' : 'text-slate-600 hover:text-slate-900'
            )}
            aria-pressed={locale === 'ti'}
          >
            {copy.languageTi}
          </button>
        </div>
      </div>

      <Card padding="none" className="relative overflow-hidden border-brand-900/20 bg-brand-900 text-white shadow-card-lg">
        <div className="relative h-56 sm:h-64">
          <Image
            src="/images/home-featured-two-students-tigrinya.png"
            alt={copy.heroImageAlt}
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/40 to-brand-900/20" />
          <EritreanHeritagePattern className="absolute bottom-0 left-0 right-0 h-10 text-amber-300/30" />
        </div>

        <div className="relative px-6 pb-8 pt-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">{copy.heroEyebrow}</p>
          <h1
            className={cn(
              'mt-3 text-3xl font-semibold leading-tight sm:text-4xl',
              locale === 'ti' ? 'font-ethiopic-display' : 'font-semibold'
            )}
          >
            {copy.heroTitle}
          </h1>
          <p className="mt-2 font-ethiopic text-lg text-amber-100">{copy.heroSubtitle}</p>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="elevated" padding="lg" className="md:col-span-3">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#078930]/10 p-2.5 text-[#078930]">
                <Target className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className={cn('text-xl', locale === 'ti' && 'font-ethiopic')}>{copy.visionTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn('text-base leading-relaxed text-slate-700', locale === 'ti' && 'font-ethiopic text-sm')}>
              {copy.visionBody}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" padding="lg">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#4189DD]/10 p-2.5 text-[#4189DD]">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className={cn('text-xl', locale === 'ti' && 'font-ethiopic')}>{copy.whoWeAreTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn('text-sm leading-relaxed text-slate-600', locale === 'ti' && 'font-ethiopic')}>
              {copy.whoWeAreBody}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated" padding="lg" className="md:col-span-2">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#DA121A]/10 p-2.5 text-[#DA121A]">
                <Globe2 className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle className={cn('text-xl', locale === 'ti' && 'font-ethiopic')}>{copy.missionTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={cn('text-sm leading-relaxed text-slate-600', locale === 'ti' && 'font-ethiopic')}>
              {copy.missionBody}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card variant="brand" padding="lg" className="shadow-card-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-700" aria-hidden />
            <CardTitle className={locale === 'ti' ? 'font-ethiopic' : undefined}>{copy.ctaSectionTitle}</CardTitle>
          </div>
          <CardDescription className={locale === 'ti' ? 'font-ethiopic' : undefined}>
            {copy.ctaSectionDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {copy.ctaButtons.map((cta) => (
              <Link
                key={cta.primary}
                href={cta.href}
                className={
                  cta.variant === 'primary'
                    ? 'link-button-primary flex flex-col items-start gap-1 px-5 py-4 text-left text-sm'
                    : 'link-button-secondary flex flex-col items-start gap-1 px-5 py-4 text-left text-sm'
                }
              >
                <span className={cn('font-semibold leading-snug', locale === 'ti' ? 'font-ethiopic text-base' : 'text-base')}>
                  {cta.primary}
                </span>
                {cta.secondary ? (
                  <span className={cn('text-xs opacity-80', locale === 'ti' ? 'font-sans' : 'font-ethiopic')}>
                    {cta.secondary}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className={cn('text-2xl font-semibold tracking-tight text-slate-950', locale === 'ti' && 'font-ethiopic')}>
            {copy.modulesTitle}
          </h2>
          <p className={cn('mt-2 text-sm text-slate-600', locale === 'ti' && 'font-ethiopic')}>
            {copy.modulesDescription}
          </p>
        </div>

        <div className="grid gap-6">
          {copy.modules.map((module) => (
            <Card key={module.number} variant="elevated" padding="lg">
              <CardHeader className="mb-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white">
                    {module.number}
                  </span>
                  <div>
                    <CardTitle className={cn('text-xl', locale === 'ti' && 'font-ethiopic')}>
                      {locale === 'en' ? `Module ${module.number}: ${module.title}` : `መደብ ${module.number}: ${module.title}`}{' '}
                      <span className="font-ethiopic text-lg text-amber-800">({module.titleTi})</span>
                    </CardTitle>
                    <CardDescription className={cn('mt-2', locale === 'ti' && 'font-ethiopic')}>
                      {module.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className={cn('text-sm font-semibold text-slate-950', locale === 'ti' && 'font-ethiopic')}>
                    {copy.learnLabel}
                  </p>
                  <ul className={cn('mt-2 space-y-1.5 text-sm text-slate-600', locale === 'ti' && 'font-ethiopic')}>
                    {module.learn.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={cn('text-sm font-semibold text-slate-950', locale === 'ti' && 'font-ethiopic')}>
                    {copy.milestonesLabel}
                  </p>
                  <ul className={cn('mt-2 space-y-1.5 text-sm text-slate-600', locale === 'ti' && 'font-ethiopic')}>
                    {module.milestones.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card variant="muted" padding="lg" className="text-center">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-800">
            <GraduationCap className="h-6 w-6" aria-hidden />
          </div>
          <p className="font-ethiopic text-lg font-semibold text-slate-950">መምህር መሓሪ ኣይንኣለም</p>
          <p className={cn('text-sm text-slate-600', locale === 'ti' && 'font-ethiopic')}>{copy.footerReady}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login?mode=signup&accountType=Student" className="link-button-primary px-6 py-3 text-sm">
              {copy.signUpFree}
            </Link>
            <Link href="/resources/alphabet" className="link-button-secondary px-6 py-3 text-sm">
              <BookOpen className="mr-2 inline h-4 w-4" aria-hidden />
              {copy.exploreAlphabet}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
