# SkypeSchool — быстрый фикс входа (локалка)

Что сделал:
- Исправил фронтовый API-адрес: теперь `http://localhost:4000/api`.
- Разрешил CORS для фронта: `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001`.
- Исправил обработку ошибок на странице логина, чтобы вместо HTML 404 выводилось понятное сообщение.

## Как применить
1. Распакуйте архив поверх вашего репозитория с сохранением структуры.
2. Перезапустите оба процесса.

### Команды
```
# backend
cd server
npm i
npm run start:dev   # слушает http://localhost:4000, префикс /api

# frontend
cd ../client
npm i
npm run dev         # http://localhost:3000
```

### Проверка
- Откройте http://localhost:3000/login, залогиньтесь (login/email/phone + пароль).
- В Network убедитесь, что запрос уходит на `http://localhost:4000/api/auth/login` и получает 200 + Set-Cookie.
- Затем `GET /api/auth/me` возвращает данные профиля.

Если что-то не так — пришлите скрин Network вкладки (URL, статус, тело ответа).