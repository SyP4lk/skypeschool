'use client';
export default function Empty({title="Пока пусто", hint}:{title?:string; hint?:string}) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-neutral-500">
      <div className="font-medium text-neutral-700">{title}</div>
      {hint && <div className="mt-1">{hint}</div>}
    </div>
  );
}
