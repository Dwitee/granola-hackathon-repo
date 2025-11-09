"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-100">
          ⚡ Hackathon Base
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Next.js + Vercel</span>
          <a
            href="https://vercel.com/docs"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-slate-200"
          >
            Docs
          </a>
        </div>
      </div>
    </header>
  );
}