import Link from "next/link";
import { brand } from "@/app/config";

export function BrandMark({ withName = true }: { withName?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 group select-none"
      aria-label={brand.name}
    >
      <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl glass-strong shadow-glow">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="transition-transform group-hover:scale-110"
        >
          <defs>
            <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <g fill="url(#bm)">
            <rect x="5" y="4" width="3" height="16" rx="1.5" />
            <rect x="16" y="4" width="3" height="16" rx="1.5" />
            <rect x="5" y="10.5" width="14" height="3" rx="1.2" />
          </g>
        </svg>
      </span>
      {withName && (
        <span className="text-lg font-semibold tracking-tight">
          <span className="text-gradient">{brand.name}</span>
        </span>
      )}
    </Link>
  );
}
