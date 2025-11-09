import { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60 shadow">
      {title && <h2 className="text-lg mb-2 font-medium text-slate-100">{title}</h2>}
      <div>{children}</div>
    </section>
  );
}