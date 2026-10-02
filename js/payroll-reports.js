const COLUMNS = [
  { label: "Date Raised", value: (report) => App.formatDate(report.dateRaised) },
  { label: "Refers to Payslip ID", value: (report) => report.payslipId },
  {
    label: "Status",
    value: (report) => report.status.toUpperCase(),
    className: (report) => (report.status === "Ongoing" ? "status-alert" : ""),
  },
];

const { employee, period } = App.initListPage();

if (employee && period) {
  const table = App.table("table-records", COLUMNS, App.reportsFor(employee, period), {
    href: (report) => "payroll-report.html?id=" + report.id,
    emptyText: "No payroll reports for this pay period.",
  });
  document.getElementById("results").append(table);
}
