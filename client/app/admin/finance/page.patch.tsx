// PATCH: 2025-09-28

// Вставьте в начало файла:
//   import dynamic from 'next/dynamic';
//   const ProfitCard = dynamic(() => import('./ProfitCard'), { ssr: false });
//
// Затем в рендере в самом верху страницы добавьте: <ProfitCard />
// Ничего из существующей сетки не меняем; просто вставляем секцию перед таблицей.
