/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/layout",{

/***/ "(app-pages-browser)/./app/components/HeaderAlt.tsx":
/*!**************************************!*\
  !*** ./app/components/HeaderAlt.tsx ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ }),

/***/ "(app-pages-browser)/./app/components/HeaderGate.tsx":
/*!***************************************!*\
  !*** ./app/components/HeaderGate.tsx ***!
  \***************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ HeaderGate)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/navigation */ \"(app-pages-browser)/./node_modules/next/dist/api/navigation.js\");\n/* harmony import */ var _Header__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Header */ \"(app-pages-browser)/./app/components/Header.tsx\");\n/* harmony import */ var _HeaderAlt__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./HeaderAlt */ \"(app-pages-browser)/./app/components/HeaderAlt.tsx\");\n/* harmony import */ var _HeaderAlt__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_HeaderAlt__WEBPACK_IMPORTED_MODULE_3__);\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n // текущая шапка (как есть) — только для /\n // альтернативная шапка — для остальных публичных страниц\n/** Показывает шапку на публичных страницах:\n * - На главной '/' — HeaderHome (оригинальная)\n * - На остальных публичных — HeaderAlt (альтернативная)\n * Прячет на: /login, /admin*, /student*, ровно /teacher (кабинет преподавателя)\n * (но на /teacher/[id] — шапка показывается)\n */ function HeaderGate() {\n    _s();\n    const pathname = (0,next_navigation__WEBPACK_IMPORTED_MODULE_1__.usePathname)() || '/';\n    // Без шапки:\n    if (pathname === '/login' || pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname === '/teacher' // важно: именно кабинет, не публичная страница /teacher/[id]\n    ) {\n        return null;\n    }\n    // Главная — старая шапка 1-в-1\n    if (pathname === '/') return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_Header__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {}, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Данил\\\\Downloads\\\\skype-school\\\\client\\\\app\\\\components\\\\HeaderGate.tsx\",\n        lineNumber: 27,\n        columnNumber: 32\n    }, this);\n    // Все остальные публичные — альтернативная шапка\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((_HeaderAlt__WEBPACK_IMPORTED_MODULE_3___default()), {}, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Данил\\\\Downloads\\\\skype-school\\\\client\\\\app\\\\components\\\\HeaderGate.tsx\",\n        lineNumber: 30,\n        columnNumber: 10\n    }, this);\n}\n_s(HeaderGate, \"wVXOWZKWdId76kQQO0KX6Oz3JDA=\", false, function() {\n    return [\n        next_navigation__WEBPACK_IMPORTED_MODULE_1__.usePathname\n    ];\n});\n_c = HeaderGate;\nvar _c;\n$RefreshReg$(_c, \"HeaderGate\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9jb21wb25lbnRzL0hlYWRlckdhdGUudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRThDO0FBQ1osQ0FBTSwwQ0FBMEM7QUFDOUMsQ0FBSyx5REFBeUQ7QUFFbEc7Ozs7O0NBS0MsR0FDYyxTQUFTRzs7SUFDdEIsTUFBTUMsV0FBV0osNERBQVdBLE1BQU07SUFFbEMsYUFBYTtJQUNiLElBQ0VJLGFBQWEsWUFDYkEsU0FBU0MsVUFBVSxDQUFDLGFBQ3BCRCxTQUFTQyxVQUFVLENBQUMsZUFDcEJELGFBQWEsV0FBVyw2REFBNkQ7TUFDckY7UUFDQSxPQUFPO0lBQ1Q7SUFFQSwrQkFBK0I7SUFDL0IsSUFBSUEsYUFBYSxLQUFLLHFCQUFPLDhEQUFDSCwrQ0FBVUE7Ozs7O0lBRXhDLGlEQUFpRDtJQUNqRCxxQkFBTyw4REFBQ0MsbURBQVNBOzs7OztBQUNuQjtHQWxCd0JDOztRQUNMSCx3REFBV0E7OztLQURORyIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFzQlNCw0L3QuNC7XFxEb3dubG9hZHNcXHNreXBlLXNjaG9vbFxcY2xpZW50XFxhcHBcXGNvbXBvbmVudHNcXEhlYWRlckdhdGUudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50JztcblxuaW1wb3J0IHsgdXNlUGF0aG5hbWUgfSBmcm9tICduZXh0L25hdmlnYXRpb24nO1xuaW1wb3J0IEhlYWRlckhvbWUgZnJvbSAnLi9IZWFkZXInOyAgICAgIC8vINGC0LXQutGD0YnQsNGPINGI0LDQv9C60LAgKNC60LDQuiDQtdGB0YLRjCkg4oCUINGC0L7Qu9GM0LrQviDQtNC70Y8gL1xuaW1wb3J0IEhlYWRlckFsdCBmcm9tICcuL0hlYWRlckFsdCc7ICAgICAvLyDQsNC70YzRgtC10YDQvdCw0YLQuNCy0L3QsNGPINGI0LDQv9C60LAg4oCUINC00LvRjyDQvtGB0YLQsNC70YzQvdGL0YUg0L/Rg9Cx0LvQuNGH0L3Ri9GFINGB0YLRgNCw0L3QuNGGXG5cbi8qKiDQn9C+0LrQsNC30YvQstCw0LXRgiDRiNCw0L/QutGDINC90LAg0L/Rg9Cx0LvQuNGH0L3Ri9GFINGB0YLRgNCw0L3QuNGG0LDRhTpcbiAqIC0g0J3QsCDQs9C70LDQstC90L7QuSAnLycg4oCUIEhlYWRlckhvbWUgKNC+0YDQuNCz0LjQvdCw0LvRjNC90LDRjylcbiAqIC0g0J3QsCDQvtGB0YLQsNC70YzQvdGL0YUg0L/Rg9Cx0LvQuNGH0L3Ri9GFIOKAlCBIZWFkZXJBbHQgKNCw0LvRjNGC0LXRgNC90LDRgtC40LLQvdCw0Y8pXG4gKiDQn9GA0Y/Rh9C10YIg0L3QsDogL2xvZ2luLCAvYWRtaW4qLCAvc3R1ZGVudCosINGA0L7QstC90L4gL3RlYWNoZXIgKNC60LDQsdC40L3QtdGCINC/0YDQtdC/0L7QtNCw0LLQsNGC0LXQu9GPKVxuICogKNC90L4g0L3QsCAvdGVhY2hlci9baWRdIOKAlCDRiNCw0L/QutCwINC/0L7QutCw0LfRi9Cy0LDQtdGC0YHRjylcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gSGVhZGVyR2F0ZSgpIHtcbiAgY29uc3QgcGF0aG5hbWUgPSB1c2VQYXRobmFtZSgpIHx8ICcvJztcblxuICAvLyDQkdC10Lcg0YjQsNC/0LrQuDpcbiAgaWYgKFxuICAgIHBhdGhuYW1lID09PSAnL2xvZ2luJyB8fFxuICAgIHBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9hZG1pbicpIHx8XG4gICAgcGF0aG5hbWUuc3RhcnRzV2l0aCgnL3N0dWRlbnQnKSB8fFxuICAgIHBhdGhuYW1lID09PSAnL3RlYWNoZXInIC8vINCy0LDQttC90L46INC40LzQtdC90L3QviDQutCw0LHQuNC90LXRgiwg0L3QtSDQv9GD0LHQu9C40YfQvdCw0Y8g0YHRgtGA0LDQvdC40YbQsCAvdGVhY2hlci9baWRdXG4gICkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8g0JPQu9Cw0LLQvdCw0Y8g4oCUINGB0YLQsNGA0LDRjyDRiNCw0L/QutCwIDEt0LItMVxuICBpZiAocGF0aG5hbWUgPT09ICcvJykgcmV0dXJuIDxIZWFkZXJIb21lIC8+O1xuXG4gIC8vINCS0YHQtSDQvtGB0YLQsNC70YzQvdGL0LUg0L/Rg9Cx0LvQuNGH0L3Ri9C1IOKAlCDQsNC70YzRgtC10YDQvdCw0YLQuNCy0L3QsNGPINGI0LDQv9C60LBcbiAgcmV0dXJuIDxIZWFkZXJBbHQgLz47XG59XG4iXSwibmFtZXMiOlsidXNlUGF0aG5hbWUiLCJIZWFkZXJIb21lIiwiSGVhZGVyQWx0IiwiSGVhZGVyR2F0ZSIsInBhdGhuYW1lIiwic3RhcnRzV2l0aCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/components/HeaderGate.tsx\n"));

/***/ }),

/***/ "(app-pages-browser)/./app/globals.css":
/*!*************************!*\
  !*** ./app/globals.css ***!
  \*************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (\"1cef532c8220\");\nif (true) { module.hot.accept() }\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC9nbG9iYWxzLmNzcyIsIm1hcHBpbmdzIjoiOzs7O0FBQUEsaUVBQWUsY0FBYztBQUM3QixJQUFJLElBQVUsSUFBSSxpQkFBaUIiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xc0JTQsNC90LjQu1xcRG93bmxvYWRzXFxza3lwZS1zY2hvb2xcXGNsaWVudFxcYXBwXFxnbG9iYWxzLmNzcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBcIjFjZWY1MzJjODIyMFwiXG5pZiAobW9kdWxlLmhvdCkgeyBtb2R1bGUuaG90LmFjY2VwdCgpIH1cbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/globals.css\n"));

/***/ })

});