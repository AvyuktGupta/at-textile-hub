import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-surface shadow-card", className)} {...props} />;
}

interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Card with a heading row, used for the grouped sections of admin forms. */
export function SectionCard({ title, description, action, className, children, ...props }: SectionCardProps) {
  return (
    <section className={cn("rounded-card border border-line bg-surface shadow-card", className)} {...props}>
      <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-sans text-[15px] font-semibold tracking-normal text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="px-4 py-5 sm:px-6">{children}</div>
    </section>
  );
}
