// PATCH: 2025-09-28

// На странице admin/support:
// 1) Импортируйте ThreadPanel (dynamic import с ssr:false).
//    import dynamic from 'next/dynamic';
//    const ThreadPanel = dynamic(() => import('./ThreadPanel'), { ssr: false });
// 2) Добавьте ниже списка компактную панель <ThreadPanel threadId={activeThreadId} />,
//    где activeThreadId выбирается при клике по элементу списка.
// Текущую сетку/таблицу не меняем.
