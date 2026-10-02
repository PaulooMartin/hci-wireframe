const { employee, period } = App.initListPage();

function setStat(name, text, alert) {
  const stat = document.querySelector(`[data-stat="${name}"]`);
  stat.textContent = text;
  stat.classList.toggle("alert", Boolean(alert));
}

if (employee && period) {
  const attendance = App.attendanceFor(employee, period);
  const count = (status) => attendance.filter((a) => a.status === status).length;
  const overtime = App.overtimeHours(attendance);

  setStat("overtime", `Overtime Hours: ${overtime} ${overtime === 1 ? "hour" : "hours"}`);
  setStat("leaves", `Approved Leaves: ${count("VL")}`);
  setStat("absences", `Absences: ${count("Absent")}`);

  const payslips = App.payslipsFor(employee, period);
  if (payslips.length) {
    const needsCorrections = payslips.some((p) => App.reportForPayslip(p.id));
    setStat("payslip", "Status: " + (needsCorrections ? "Needs Corrections" : "No Issues"), needsCorrections);
  }

  const active = App.reportsFor(employee, period).filter((r) => r.status === "Ongoing").length;
  setStat("reports", `${active} Active ${active === 1 ? "Report" : "Reports"}`, active > 0);
}
