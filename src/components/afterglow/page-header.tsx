interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function PageHeader({ title, subtitle, badge }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {badge && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {badge}
        </p>
      )}
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>
      )}
    </header>
  );
}
