// Shared by every page: data lookups, the current selection (employee and pay
// period, carried in the URL as ?emp=...&period=...), and the sidebar, search
// box, dropdowns and tables.

const App = (function () {
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // ---------- Data lookups ----------

  function employee(id) {
    return DATA.employees.find((e) => e.id === id) || null;
  }

  function period(id) {
    return DATA.payPeriods.find((p) => p.id === id) || null;
  }

  function attendanceFor(emp, per) {
    return DATA.attendance.filter((a) => a.employeeId === emp.id && a.date >= per.start && a.date <= per.end);
  }

  function payslipsFor(emp, per) {
    return DATA.payslips.filter((p) => p.employeeId === emp.id && p.periodId === per.id);
  }

  function reportForPayslip(payslipId) {
    return DATA.payrollReports.find((r) => r.payslipId === payslipId) || null;
  }

  function reportsFor(emp, per) {
    return payslipsFor(emp, per).map((p) => reportForPayslip(p.id)).filter(Boolean);
  }

  function payslipStatus(payslip) {
    return reportForPayslip(payslip.id) ? "Needs Corrections" : "No Issues";
  }

  // ---------- Pay ----------

  // "11:30:00" -> 11.5
  function hours(duration) {
    const [h, m] = duration.split(":").map(Number);
    return h + m / 60;
  }

  function overtimeHours(attendance) {
    return attendance
      .filter((a) => a.status === "OT")
      .reduce((sum, a) => sum + hours(a.workedHours) - DATA.payRules.standardHours, 0);
  }

  const PAY_ITEMS = {
    regularPay: "Regular pay",
    overtimePay: "Overtime pay",
    leavePay: "Leave pay",
    grossPay: "Gross pay",
    contributions: "Contributions",
    tax: "Tax",
    netPay: "Net pay",
  };

  // Pay for one payslip, worked out from the attendance in its pay period.
  // Leave days are paid as a regular day; rest days and absences are unpaid.
  // The result is the payslip as issued, including the mistake its payroll report describes.
  function payBreakdown(payslip) {
    const cents = (amount) => Math.round(amount * 100) / 100;
    const attendance = attendanceFor(employee(payslip.employeeId), period(payslip.periodId));
    const overtime = overtimeHours(attendance);

    const pay = {
      ...DATA.payRules,
      regularHours: attendance.reduce((sum, a) => sum + hours(a.workedHours), 0) - overtime,
      overtimeHours: overtime,
      leaveDays: attendance.filter((a) => a.status === "VL").length,
    };
    const report = reportForPayslip(payslip.id);
    if (report) Object.assign(pay, report.payslipError);

    pay.overtimeRate = cents(pay.hourlyRate * (1 + pay.overtimeBonus));
    pay.regularPay = pay.regularHours * pay.hourlyRate;
    pay.overtimePay = cents(pay.overtimeHours * pay.overtimeRate);
    pay.leavePay = pay.leaveDays * pay.standardHours * pay.hourlyRate;
    pay.grossPay = pay.regularPay + pay.overtimePay + pay.leavePay;
    pay.tax = cents(pay.grossPay * pay.taxRate);
    pay.netPay = cents(pay.grossPay - pay.contributions - pay.tax);
    return pay;
  }

  // ---------- Formatting ----------

  // "2026-09-01" -> "September 01, 2026"
  function formatDate(iso) {
    const [year, month, day] = iso.split("-");
    return `${MONTHS[Number(month) - 1]} ${day}, ${year}`;
  }

  // 9202.5 -> "₱9,202.50"
  function peso(amount) {
    return "₱" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // "PAYSLIP-0007" -> "0007"
  function recordNumber(id) {
    return id.split("-")[1];
  }

  function employeeLabel(emp) {
    return `Employee ${emp.id} ${emp.name}`;
  }

  // ---------- Selection ----------

  function selection() {
    const params = new URLSearchParams(location.search);
    return { employee: employee(params.get("emp")), period: period(params.get("period")) };
  }

  function query(emp, per) {
    const params = new URLSearchParams();
    if (emp) params.set("emp", emp.id);
    if (per) params.set("period", per.id);
    const text = params.toString();
    return text ? "?" + text : "";
  }

  // Carries the selection on every link to another page, and flags Payroll
  // Reports in the sidebar while the selection has an ongoing report.
  function setupLinks(emp, per) {
    const q = query(emp, per);
    document.querySelectorAll('a[href$=".html"]').forEach((link) => {
      link.href = link.getAttribute("href") + q;
    });
    const ongoing = emp && per && reportsFor(emp, per).some((r) => r.status === "Ongoing");
    document.querySelector('[data-nav="payroll-reports"]').classList.toggle("alert", Boolean(ongoing));
  }

  // ---------- Dropdowns ----------

  // options: [{ label, value, selected }]
  function dropdown(root, { label, options, onSelect }) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "dropdown-toggle";
    toggle.textContent = label;

    const menu = document.createElement("ul");
    menu.className = "menu";
    menu.hidden = true;
    options.forEach((option) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.classList.toggle("selected", Boolean(option.selected));
      button.addEventListener("click", () => {
        menu.hidden = true;
        onSelect(option.value);
      });
      item.append(button);
      menu.append(item);
    });

    toggle.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
    });
    root.replaceChildren(toggle, menu);
  }

  // Close open menus on an outside click or Escape.
  document.addEventListener("click", (event) => {
    document.querySelectorAll(".dropdown .menu").forEach((menu) => {
      if (!menu.parentElement.contains(event.target)) menu.hidden = true;
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".dropdown .menu").forEach((menu) => {
      menu.hidden = true;
    });
  });

  function periodDropdown(per, onSelect) {
    dropdown(document.getElementById("period-dropdown"), {
      label: per ? "Pay Period: " + per.label : "Select Pay Period",
      options: DATA.payPeriods.map((p) => ({ label: p.label, value: p, selected: p === per })),
      onSelect,
    });
  }

  // ---------- Search ----------

  // onPick receives the picked employee, or null when the box is cleared.
  function setupSearch(emp, onPick) {
    const box = document.getElementById("search");
    const input = box.querySelector("input");
    const menu = box.querySelector(".menu");
    const chosen = emp ? employeeLabel(emp) : "";

    input.value = chosen;
    box.classList.toggle("has-employee", Boolean(emp));

    function showMatches() {
      // Until the user types, the box still holds the chosen employee: list everyone.
      const text = input.value === chosen ? "" : input.value.trim().toLowerCase();
      const matches = DATA.employees.filter((e) => employeeLabel(e).toLowerCase().includes(text));

      menu.replaceChildren();
      matches.forEach((match) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.tabIndex = -1;
        button.textContent = employeeLabel(match);
        button.classList.toggle("selected", match === emp);
        button.addEventListener("click", () => onPick(match));
        item.append(button);
        menu.append(item);
      });
      if (!matches.length) {
        const item = document.createElement("li");
        item.className = "menu-empty";
        item.textContent = "No employees found";
        menu.append(item);
      }
      menu.hidden = false;
      return matches;
    }

    input.addEventListener("focus", () => {
      input.select();
      showMatches();
    });
    input.addEventListener("input", showMatches);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        input.value = chosen;
        input.blur();
      }
      if (event.key === "Enter" && input.value !== chosen) {
        const matches = showMatches();
        if (!input.value.trim()) onPick(null);
        else if (matches.length) onPick(matches[0]);
      }
    });
    // Keep focus in the input while a result is being clicked.
    menu.addEventListener("mousedown", (event) => event.preventDefault());
    input.addEventListener("blur", () => {
      menu.hidden = true;
      if (emp && !input.value.trim()) onPick(null);
      else input.value = chosen;
    });
  }

  // ---------- Tables ----------

  // columns: [{ label, value(row), className(row) }]
  // options.href(row) makes each row open that page; options.emptyText shows when there are no rows.
  function table(className, columns, rows, options = {}) {
    const el = document.createElement("table");
    el.className = "table " + className;

    const head = el.createTHead().insertRow();
    columns.forEach((column) => {
      const th = document.createElement("th");
      th.textContent = column.label;
      head.append(th);
    });

    const body = el.createTBody();
    rows.forEach((row) => {
      const tr = body.insertRow();
      columns.forEach((column) => {
        const td = tr.insertCell();
        td.textContent = column.value(row);
        if (column.className) td.className = column.className(row);
      });
      if (options.href) {
        const open = () => {
          location.href = options.href(row);
        };
        tr.className = "clickable";
        tr.tabIndex = 0;
        tr.setAttribute("role", "link");
        tr.addEventListener("click", open);
        tr.addEventListener("keydown", (event) => {
          if (event.key === "Enter") open();
        });
      }
    });
    if (!rows.length) {
      const td = body.insertRow().insertCell();
      td.colSpan = columns.length;
      td.className = "empty";
      td.textContent = options.emptyText;
    }
    return el;
  }

  // ---------- Page setup ----------

  // Dashboard and list pages: search box and pay period dropdown above the content.
  function initListPage() {
    const current = selection();
    const go = (emp, per) => {
      location.href = location.pathname + query(emp, per);
    };
    setupLinks(current.employee, current.period);
    setupSearch(current.employee, (emp) => go(emp, current.period));
    periodDropdown(current.period, (per) => go(current.employee, per));
    return current;
  }

  // Detail pages: employee and pay period dropdowns in the top bar. Changing
  // either one leaves the record and opens its list page with the new selection.
  function initDetailPage(emp, per, listPage) {
    const go = (nextEmp, nextPer) => {
      location.href = listPage + query(nextEmp, nextPer);
    };
    setupLinks(emp, per);
    dropdown(document.getElementById("employee-dropdown"), {
      label: emp ? "Employee: " + emp.name : "Select Employee",
      options: DATA.employees.map((e) => ({ label: e.name, value: e, selected: e === emp })),
      onSelect: (nextEmp) => go(nextEmp, per),
    });
    periodDropdown(per, (nextPer) => go(emp, nextPer));
  }

  return {
    employee, period, attendanceFor, payslipsFor, reportForPayslip, reportsFor, payslipStatus,
    overtimeHours, payBreakdown, PAY_ITEMS, formatDate, peso, recordNumber,
    dropdown, table, initListPage, initDetailPage,
  };
})();
