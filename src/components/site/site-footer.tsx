import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="surface-accent flex size-7 items-center justify-center rounded-lg">
              <GraduationCap className="size-4" aria-hidden />
            </span>
            <span className="font-display">CSE Professional English</span>
          </div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Learn English. Speak Confidently. Grow Professionally.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/roadmap" className="text-muted-foreground hover:text-foreground">
            Roadmap
          </Link>
          <Link to="/modules" className="text-muted-foreground hover:text-foreground">
            Modules
          </Link>
          <Link to="/resources" className="text-muted-foreground hover:text-foreground">
            Resources
          </Link>
          <Link to="/trial" className="text-muted-foreground hover:text-foreground">
            Free trial lesson
          </Link>
          <Link to="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
