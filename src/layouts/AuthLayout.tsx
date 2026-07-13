import type { ReactNode } from 'react';
import { Logo } from '@/components/common/Logo';
import { APP } from '@/constants/app';
import { ru } from '@/locales/ru';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Centered card layout for unauthenticated screens (login, password change). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (hidden on small screens) */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Logo className="[&_span]:text-primary-foreground [&_rect]:fill-white [&_path]:fill-primary" />
          <div className="space-y-4">
            <h2 className="max-w-md text-3xl font-bold leading-tight">{ru.app.fullName}</h2>
            <p className="max-w-sm text-primary-foreground/80">{ru.app.tagline}</p>
          </div>
          <p className="text-sm text-primary-foreground/70">
            {ru.common.version} {APP.version}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
