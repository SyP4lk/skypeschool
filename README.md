# Fix: dangerouslySetInnerHTML + перенос HTML в отдельный файл

Этот архив содержит правку для `app/(public)/legacy/page.tsx` и заготовку `staticHtml.ts`,
чтобы большие куски HTML не лежали прямо в JSX.

## Что сделано
- Исправлено использование `dangerouslySetInnerHTML` — теперь передаётся объект `{{ __html: html }}`.
- Вынесен HTML в `app/(public)/legacy/staticHtml.ts`, откуда он импортируется в `page.tsx`.

## Как применить
1) Распакуйте содержимое архива **в корень вашего проекта** так, чтобы пути совпали:
   `app/(public)/legacy/page.tsx` и `app/(public)/legacy/staticHtml.ts`.

2) Откройте `app/(public)/legacy/staticHtml.ts` и вставьте **весь ваш HTML** внутри обратных кавычек:
   ```ts
   const html = `…ВАШ HTML…`;
   export default html;
   ```

   > Подсказка: если у вас уже был огромный HTML прямо в `page.tsx`, просто вырежьте его оттуда
   > и вставьте в файл `staticHtml.ts` между обратных кавычек.

3) Соберите проект:
   ```bash
   npm run build
   npm run start
   ```

## Важно про lockfile
Если при сборке видите предупреждение вида:
> Found multiple lockfiles. Selecting C:\Users\Данил\package-lock.json

Удалите лишний lockfile вне папки проекта и оставьте только
`client\package-lock.json` (если ваш проект в `client`).

Пример:
```powershell
del C:\Users\Данил\package-lock.json
cd C:\Users\Данил\Downloads\skype-school-iter1\client
npm ci
npm run build
```

Готово!
