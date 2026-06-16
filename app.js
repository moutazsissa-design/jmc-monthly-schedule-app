const approvedShiftTimes = [
  "4:00 AM - 12:00 PM",
  "5:00 AM - 1:00 PM",
  "12:00 PM - 8:00 PM",
  "1:00 PM - 9:00 PM",
  "8:00 AM - 4:00 PM"
];

const employees = [
  { name: "Moutaz", role: "Admin", defaultShift: "4:00 AM - 12:00 PM" },
  { name: "Hamdan", role: "Employee", defaultShift: "5:00 AM - 1:00 PM" },
  { name: "Askar", role: "Employee", defaultShift: "1:00 PM - 9:00 PM" },
  { name: "Arun", role: "Employee", defaultShift: "12:00 PM - 8:00 PM" },
  { name: "Anas", role: "Employee", defaultShift: "1:00 PM - 9:00 PM" },
  { name: "Faizal", role: "Supervisor / Viewer", defaultShift: "8:00 AM - 4:00 PM", supervisor: true }
];

let schedule = {};
let holidays = [];
let activeCell = null;

const monthPicker = document.getElementById("monthPicker");
const employeeFilter = document.getElementById("employeeFilter");
const scheduleTableWrap = document.getElementById("scheduleTableWrap");
const cellDialog = document.getElementById("cellDialog");
const statusSelect = document.getElementById("statusSelect");
const dialogTitle = document.getElementById("dialogTitle");

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function dayName(date) {
  return date.toLocaleDateString("en-GB", { weekday: "short" });
}

function init() {
  const now = new Date();
  monthPicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.name;
    opt.textContent = emp.name;
    employeeFilter.appendChild(opt);
  });

  load();
  renderTeam();
  generateMonth(false);
  bindEvents();
}

function bindEvents() {
  document.getElementById("generateBtn").addEventListener("click", () => generateMonth(true));
  document.getElementById("saveBtn").addEventListener("click", save);
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("addHolidayBtn").addEventListener("click", addHoliday);
  document.getElementById("applyCellBtn").addEventListener("click", applyCellStatus);
  employeeFilter.addEventListener("change", renderSchedule);
  monthPicker.addEventListener("change", () => generateMonth(false));
}

function defaultStatusForDate(emp, date) {
  const day = date.getDay();
  const dateStr = ymd(date);

  if (holidays.some(h => h.date === dateStr)) return "Public Holiday";
  if (day === 0 || day === 6) return "OFF";
  return emp.defaultShift;
}

function generateMonth(resetExisting = false) {
  const [year, month] = monthPicker.value.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  employees.forEach(emp => {
    if (!schedule[emp.name] || resetExisting) schedule[emp.name] = {};
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      const key = ymd(date);
      if (!schedule[emp.name][key] || resetExisting) {
        schedule[emp.name][key] = defaultStatusForDate(emp, date);
      }
    }
  });

  renderAll();
}

function statusClass(status) {
  if (!status) return "status-empty";
  if (status === "OFF") return "status-off";
  if (status === "Annual Leave") return "status-annual";
  if (status === "Sick Leave") return "status-sick";
  if (status === "Compensation Leave") return "status-comp";
  if (status === "Public Holiday") return "status-holiday";
  if (status === "Worked on OFF" || status === "Worked on Public Holiday") return "status-earned";
  return "status-shift";
}

function renderSchedule() {
  const [year, month] = monthPicker.value.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const selectedEmployee = employeeFilter.value;
  const visibleEmployees = employees.filter(e => selectedEmployee === "all" || e.name === selectedEmployee);

  let html = "<table><thead><tr><th class='employee-head'>Employee</th>";
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    html += `<th><div>${dayName(date)}</div><strong>${d}</strong></th>`;
  }
  html += "</tr></thead><tbody>";

  visibleEmployees.forEach(emp => {
    html += `<tr><td class="employee-cell">${emp.name}<br><small>${emp.role}</small></td>`;
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month - 1, d);
      const key = ymd(date);
      const status = schedule[emp.name]?.[key] || "";
      html += `<td><div class="schedule-cell ${statusClass(status)}" data-employee="${emp.name}" data-date="${key}">${status || "-"}</div></td>`;
    }
    html += "</tr>";
  });

  html += "</tbody></table>";
  scheduleTableWrap.innerHTML = html;

  document.querySelectorAll(".schedule-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      activeCell = {
        employee: cell.dataset.employee,
        date: cell.dataset.date
      };
      dialogTitle.textContent = `${activeCell.employee} - ${activeCell.date}`;
      statusSelect.value = schedule[activeCell.employee][activeCell.date] || "";
      cellDialog.showModal();
    });
  });
}

function applyCellStatus(event) {
  event.preventDefault();
  if (!activeCell) return;
  schedule[activeCell.employee][activeCell.date] = statusSelect.value;
  cellDialog.close();
  renderAll();
}

function renderTeam() {
  const teamList = document.getElementById("teamList");
  teamList.innerHTML = employees.map(e => `
    <div class="person">
      <strong>${e.name}</strong>
      <small>${e.role}${e.name === "Moutaz" ? " · System Admin" : ""} · Default: ${e.defaultShift}</small>
    </div>
  `).join("");
}

function addHoliday() {
  const name = document.getElementById("holidayName").value.trim();
  const date = document.getElementById("holidayDate").value;
  if (!name || !date) {
    alert("Please add holiday name and date.");
    return;
  }

  holidays.push({ name, date });
  document.getElementById("holidayName").value = "";
  document.getElementById("holidayDate").value = "";

  employees.forEach(emp => {
    if (schedule[emp.name] && schedule[emp.name][date] && !["Annual Leave", "Sick Leave", "Compensation Leave", "Worked on OFF", "Worked on Public Holiday"].includes(schedule[emp.name][date])) {
      schedule[emp.name][date] = "Public Holiday";
    }
  });

  renderAll();
}

function renderHolidays() {
  const holidayList = document.getElementById("holidayList");
  if (!holidays.length) {
    holidayList.innerHTML = `<div class="holiday-item"><small>No holidays added yet.</small></div>`;
    return;
  }

  holidayList.innerHTML = holidays.map((h, idx) => `
    <div class="holiday-item">
      <strong>${h.name}</strong>
      <small>${h.date}</small>
      <button class="secondary" onclick="removeHoliday(${idx})">Remove</button>
    </div>
  `).join("");
}

function removeHoliday(index) {
  holidays.splice(index, 1);
  renderAll();
}

function calculate() {
  let weeklyOff = 0;
  let holidaysCount = 0;
  let compEarned = 0;
  let annualLeave = 0;
  let sickLeave = 0;
  let compLeaveUsed = 0;
  const compByEmployee = {};
  const leaveByEmployee = {};

  employees.forEach(emp => {
    compByEmployee[emp.name] = [];
    leaveByEmployee[emp.name] = { annual: 0, sick: 0, compUsed: 0 };
    const days = schedule[emp.name] || {};

    Object.entries(days).forEach(([date, status]) => {
      if (status === "OFF") weeklyOff++;
      if (status === "Public Holiday") holidaysCount++;
      if (status === "Annual Leave") {
        annualLeave++;
        leaveByEmployee[emp.name].annual++;
      }
      if (status === "Sick Leave") {
        sickLeave++;
        leaveByEmployee[emp.name].sick++;
      }
      if (status === "Compensation Leave") {
        compLeaveUsed++;
        leaveByEmployee[emp.name].compUsed++;
      }
      if (status === "Worked on OFF") {
        compEarned++;
        compByEmployee[emp.name].push({ date, reason: "Worked on weekly off", days: 1 });
      }
      if (status === "Worked on Public Holiday") {
        compEarned++;
        compByEmployee[emp.name].push({ date, reason: "Worked on public holiday", days: 1 });
      }
    });
  });

  return { weeklyOff, holidaysCount, compEarned, annualLeave, sickLeave, compLeaveUsed, compByEmployee, leaveByEmployee };
}

function renderSummary() {
  const stats = calculate();
  document.getElementById("employeeCount").textContent = employees.filter(e => !e.supervisor).length;
  document.getElementById("weeklyOffCount").textContent = stats.weeklyOff;
  document.getElementById("holidayCount").textContent = stats.holidaysCount;
  document.getElementById("compEarnedCount").textContent = stats.compEarned;
  document.getElementById("annualLeaveCount").textContent = stats.annualLeave;
  document.getElementById("sickLeaveCount").textContent = stats.sickLeave;

  const report = document.getElementById("compReport");
  const items = [];

  Object.entries(stats.leaveByEmployee).forEach(([employee, r]) => {
    if (r.annual || r.sick || r.compUsed) {
      items.push(`<div class="report-item"><strong>${employee}</strong><small>Annual: ${r.annual} · Sick: ${r.sick} · Comp Used: ${r.compUsed}</small></div>`);
    }
  });

  Object.entries(stats.compByEmployee).forEach(([employee, rows]) => {
    rows.forEach(r => {
      items.push(`<div class="report-item"><strong>${employee}</strong><small>${r.date} · ${r.reason} · +${r.days} comp day</small></div>`);
    });
  });

  report.innerHTML = items.length ? items.join("") : `<div class="report-item"><small>No leave or compensation records yet this month.</small></div>`;
}

function renderAll() {
  renderSchedule();
  renderHolidays();
  renderSummary();
}

function save() {
  const data = { schedule, holidays, month: monthPicker.value };
  localStorage.setItem("jmcScheduleAppV2", JSON.stringify(data));
  alert("Schedule saved on this browser.");
}

function load() {
  const raw = localStorage.getItem("jmcScheduleAppV2");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    schedule = data.schedule || {};
    holidays = data.holidays || [];
    if (data.month) monthPicker.value = data.month;
  } catch (e) {
    console.warn("Could not load saved data", e);
  }
}

function exportJson() {
  const data = {
    app: "JMC Monthly Schedule & Leave Calculator",
    exportedAt: new Date().toISOString(),
    month: monthPicker.value,
    approvedShiftTimes,
    employees,
    holidays,
    schedule,
    calculations: calculate()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jmc-schedule-${monthPicker.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

init();
