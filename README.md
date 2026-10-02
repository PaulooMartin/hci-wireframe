# hci-wireframe

Desktop-only payroll wireframe in plain HTML, CSS and JavaScript. There is no build step and no server: open `index.html` in a browser, or publish the repository with GitHub Pages.

- `index.html`, `attendance.html`, `payslips.html`, `payroll-reports.html` — dashboard and list pages
- `payslip.html`, `payroll-report.html` — record detail pages
- `js/data.js` — all mock data (employees, pay periods, attendance, payslips, payroll reports)
- `js/app.js` — shared code; the other files in `js/` each render one page
- `references/` — the mockups the pages are built from

The chosen employee and pay period are carried in the URL (`?emp=10001&period=2026-09-A`). Opening a page without them shows the "no employee chosen" state.
