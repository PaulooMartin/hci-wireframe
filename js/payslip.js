const id = new URLSearchParams(location.search).get("id");
const payslip = DATA.payslips.find((p) => p.id === id);
const title = document.getElementById("title");

const plural = (count, unit) => `${count} ${unit}${count === 1 ? "" : "s"}`;
const totalClass = (row) => (row.total ? "total" : "");

const COLUMNS = [
  { label: "Item", value: (row) => App.PAY_ITEMS[row.item], className: totalClass },
  { label: "Details", value: (row) => row.details || "", className: totalClass },
  { label: "Amount", value: (row) => (row.deduction ? "−" : "") + App.peso(row.amount), className: totalClass },
];

function payRows(pay) {
  const rate = App.peso(pay.hourlyRate);
  const bonus = pay.overtimeBonus ? ` (${rate} + ${pay.overtimeBonus * 100}%)` : "";
  return [
    { item: "regularPay", details: `${plural(pay.regularHours, "hour")} × ${rate}`, amount: pay.regularPay },
    { item: "overtimePay", details: `${plural(pay.overtimeHours, "hour")} × ${App.peso(pay.overtimeRate)}${bonus}`, amount: pay.overtimePay },
    { item: "leavePay", details: `${plural(pay.leaveDays, "day")} × ${plural(pay.standardHours, "hour")} × ${rate}`, amount: pay.leavePay },
    { item: "grossPay", amount: pay.grossPay, total: true },
    { item: "contributions", details: "Fixed per pay period", amount: pay.contributions, deduction: true },
    { item: "tax", details: `${pay.taxRate * 100}% of gross pay`, amount: pay.tax, deduction: true },
    { item: "netPay", amount: pay.netPay, total: true },
  ];
}

if (payslip) {
  App.initDetailPage(App.employee(payslip.employeeId), App.period(payslip.periodId), "payslips.html");
  title.textContent = "Payslip " + App.recordNumber(payslip.id);

  // A payslip with a problem always has a payroll report linked to it.
  const report = App.reportForPayslip(payslip.id);
  if (report) {
    const related = document.getElementById("related");
    related.href = "payroll-report.html?id=" + report.id;
    related.hidden = false;
    document.getElementById("status").hidden = false;
  }

  const table = App.table("table-records", COLUMNS, payRows(App.payBreakdown(payslip)));
  document.getElementById("details").append(table);
} else {
  App.initDetailPage(null, null, "payslips.html");
  title.textContent = "Payslip not found";
}
