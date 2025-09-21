'use client';
export function Pagination({page, setPage}:{page:number; setPage:(n:number)=>void}) {
  return (
    <div className="mt-4 flex items-center gap-2">
      <button className="btn" onClick={()=>setPage(Math.max(1, page-1))} disabled={page<=1}>Назад</button>
      <div className="text-sm">Стр. {page}</div>
      <button className="btn" onClick={()=>setPage(page+1)}>Вперёд</button>
      <style jsx>{`.btn{padding:.4rem .7rem;border:1px solid #ddd;border-radius:.6rem;background:#fff}`}</style>
    </div>
  );
}
