const COLUMNS = [
  { label: "Date Generated", value: (payslip) => App.formatDate(payslip.dateGenerated) },
  { label: "Payslip ID", value: (payslip) => payslip.id },
  {
    label: "Status",
    value: (payslip) => App.payslipStatus(payslip).toUpperCase(),
    className: (payslip) => (App.reportForPayslip(payslip.id) ? "status-alert" : ""),
  },
];

const { employee, period } = App.initListPage();

if (employee && period) {
  const table = App.table("table-records", COLUMNS, App.payslipsFor(employee, period), {
    href: (payslip) => "payslip.html?id=" + payslip.id,
    emptyText: "No payslips for this pay period.",
  });
  document.getElementById("results").append(table);
}
