import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

interface NorthsideFooterProps {
  className?: string;
}

export function NorthsideFooter({ className }: NorthsideFooterProps) {
  return (
    <footer className={cn("text-center", className)}>
      <span className="text-xs tracking-wide text-muted/70">
        © {CURRENT_YEAR} Northside Intelligence
      </span>
    </footer>
  );
}
