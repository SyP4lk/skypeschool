# Комиссия: что поменять в контроллере уроков

В `TeacherLessonsController.done()` списывайте со **студента** `publicPrice`, а **учителю** начисляйте `lesson.price` (teacher price). Пример кода смотрите в:
`server/src/modules/teacher/teacher-lessons.controller.patch.ts`

Это аддитивная правка — существующие поля БД не меняются.
