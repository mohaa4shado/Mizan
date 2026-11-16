
"use strict";

/* ========================================
   MIZAN - Employee Tasks Management
======================================== */

const STORAGE_KEY = "mizan-employee-tasks";

const $ = (selector) => document.querySelector(selector);

/* ========================================
   Default Tasks
======================================== */

const seedTasks = [
  {
    id: 1,
    employeeName: "عادل أدهم",
    taskTitle: "تأجيل قضية",
    taskDetails: "تأجيل قضية عباس الضو",
    taskDate: "2025-12-06",
    taskTime: "09:00",
    taskStatus: "done",
  },
  {
    id: 2,
    employeeName: "بسمة خالد",
    taskTitle: "تحضير",
    taskDetails: "تجهيز غرفة الاجتماعات",
    taskDate: "2025-12-08",
    taskTime: "18:30",
    taskStatus: "done",
  },
  {
    id: 3,
    employeeName: "فاروق الفيشاوي",
    taskTitle: "شراء",
    taskDetails: "شراء أدوات مكتبية",
    taskDate: "2026-04-21",
    taskTime: "12:15",
    taskStatus: "done",
  },
  {
    id: 4,
    employeeName: "عادل أدهم",
    taskTitle: "رفع قضية",
    taskDetails: "إيداع وتجهيز ملف القضية",
    taskDate: "2026-04-30",
    taskTime: "08:45",
    taskStatus: "pending",
  },
  {
    id: 5,
    employeeName: "بسمة خالد",
    taskTitle: "تأجيل",
    taskDetails: "تأجيل قضية تامر",
    taskDate: "2026-04-27",
    taskTime: "11:15",
    taskStatus: "pending",
  },
];

/* ========================================
   Form Fields
======================================== */

const fields = [
  "employeeName",
  "taskTitle",
  "taskDate",
  "taskTime",
  "taskDetails",
  "taskStatus",
];

/* ========================================
   Helpers
======================================== */

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]
  );

const formatDate = (value) => {
  if (!value) return "—";

  const [y, m, d] = value.split("-");

  return `${y}/${m}/${d}`;
};

const formatTime = (value) => {
  if (!value) return "—";

  const [h, m] = value.split(":").map(Number);

  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "PM" : "AM"
  }`;
};

/* ========================================
   Local Storage
======================================== */

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return [...seedTasks];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [...seedTasks];

  } catch (error) {
    console.error("تعذر تحميل المهام:", error);

    return [...seedTasks];
  }
}

let tasks = loadTasks();

let editingId = null;

/* ========================================
   Save Tasks
======================================== */

function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );

    return true;

  } catch (error) {
    console.error("تعذر حفظ البيانات:", error);

    showToast("تعذر حفظ البيانات في المتصفح");

    return false;
  }
}

/* ========================================
   Statistics
======================================== */

function updateStats() {
  const total = tasks.length;

  const done = tasks.filter(
    (task) => task.taskStatus === "done"
  ).length;

  const pending = total - done;

  $("#totalTasks").textContent = total;
  $("#doneTasks").textContent = done;
  $("#pendingTasks").textContent = pending;
}

/* ========================================
   Filter Tasks
======================================== */

function getFilteredTasks() {

  // Search Value
  const query = $("#searchInput")
    .value
    .trim()
    .toLocaleLowerCase("ar");

  // Status Value
  const status = $("#statusFilter").value;

  // Selected Date
  const selectedDate = $("#dateFilter").value;

  // Apply All Filters
  return tasks.filter((task) => {

    // Search Filter
    const searchableValues = [
      task.employeeName,
      task.taskTitle,
      task.taskDetails,
    ];

    const matchesSearch = searchableValues.some((value) =>
      String(value ?? "")
        .toLocaleLowerCase("ar")
        .includes(query)
    );

    // Status Filter
    const matchesStatus =
      status === "all" ||
      task.taskStatus === status;

    // Date Filter
    const matchesDate =
      !selectedDate ||
      task.taskDate === selectedDate;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDate
    );
  });
}

/* ========================================
   Render Tasks
======================================== */

function draw() {

  // Get Filtered Tasks
  const filtered = getFilteredTasks();

  // Page Size
  const size = $("#pageSize").value;

  const visible =
    size === "all"
      ? filtered
      : filtered.slice(0, Number(size));

  // Render Table
  $("#tasksRows").innerHTML = visible.length
    ? visible
        .map(
          (task) => `
            <tr>
              <td>${esc(task.employeeName)}</td>

              <td class="task-title-cell">
                ${esc(task.taskTitle)}
              </td>

              <td class="task-details-cell">
                ${esc(task.taskDetails)}
              </td>

              <td class="date-cell">
                ${formatDate(task.taskDate)}
              </td>

              <td>
                <span class="time-cell">
                  ${formatTime(task.taskTime)}
                </span>
              </td>

              <td>
                <span class="status-badge ${
                  task.taskStatus === "done"
                    ? "status-done"
                    : "status-pending"
                }">
                  ${
                    task.taskStatus === "done"
                      ? "تم"
                      : "باقي"
                  }
                </span>
              </td>

              <td>
                <div class="table-actions">

                  <button
                    class="action-btn toggle"
                    type="button"
                    data-action="toggle"
                    data-id="${task.id}"
                    title="${
                      task.taskStatus === "done"
                        ? "إعادة إلى باقي"
                        : "تحديد كمهمة منجزة"
                    }"
                    aria-label="تغيير حالة المهمة"
                  >
                    <span class="material-symbols-outlined">
                      ${
                        task.taskStatus === "done"
                          ? "undo"
                          : "task_alt"
                      }
                    </span>
                  </button>

                  <button
                    class="action-btn edit"
                    type="button"
                    data-action="edit"
                    data-id="${task.id}"
                    title="تعديل"
                    aria-label="تعديل المهمة"
                  >
                    <span class="material-symbols-outlined">
                      edit
                    </span>
                  </button>

                  <button
                    class="action-btn delete"
                    type="button"
                    data-action="delete"
                    data-id="${task.id}"
                    title="حذف"
                    aria-label="حذف المهمة"
                  >
                    <span class="material-symbols-outlined">
                      delete
                    </span>
                  </button>

                </div>
              </td>
            </tr>
          `
        )
        .join("")
    : `
        <tr>
          <td colspan="7">
            <div class="empty-state">

              <span class="material-symbols-outlined">
                assignment_late
              </span>

              <h3>لا توجد مهام</h3>

              <p>
                لم يتم العثور على مهام مطابقة لعملية البحث أو التاريخ المحدد.
              </p>

            </div>
          </td>
        </tr>
      `;

  // Update Results Count
  $("#resultsCount").textContent = filtered.length;

  // Update Statistics
  updateStats();
}

/* ========================================
   Open Modal
======================================== */

function openModal(task = null) {

  editingId = task ? task.id : null;

  $("#taskForm").reset();

  $("#formError").classList.add("hidden");

  $("#modalTitle").textContent = task
    ? "تعديل مهمة موظف"
    : "إضافة مهمة موظف";

  fields.forEach((field) => {
    $(`#${field}`).value =
      task?.[field] ??
      (field === "taskStatus" ? "pending" : "");
  });

  $("#taskModal").classList.remove("hidden");

  document.body.classList.add("overflow-hidden");

  $("#employeeName").focus();
}

/* ========================================
   Close Modal
======================================== */

function closeModal() {

  $("#taskModal").classList.add("hidden");

  document.body.classList.remove("overflow-hidden");

  editingId = null;
}

/* ========================================
   Form Error
======================================== */

function showError(message) {

  $("#formError").textContent = message;

  $("#formError").classList.remove("hidden");
}

/* ========================================
   Toast Notification
======================================== */

let toastTimer;

function showToast(message) {

  const toast = $("#toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* ========================================
   Add Task
======================================== */

$("#addTaskBtn").addEventListener("click", () => {
  openModal();
});

/* ========================================
   Close Modal Events
======================================== */

$("#closeModal").addEventListener("click", closeModal);

$("#cancelModal").addEventListener("click", closeModal);

$("#taskModal").addEventListener("mousedown", (event) => {

  if (event.target === $("#taskModal")) {
    closeModal();
  }

});

document.addEventListener("keydown", (event) => {

  if (
    event.key === "Escape" &&
    !$("#taskModal").classList.contains("hidden")
  ) {
    closeModal();
  }

});

/* ========================================
   Search and Filters Events
======================================== */

// Search
$("#searchInput").addEventListener("input", draw);

// Status Filter
$("#statusFilter").addEventListener("change", draw);

// Page Size
$("#pageSize").addEventListener("change", draw);

/* ========================================
   Date Filter Events
======================================== */

// Filter Tasks By Selected Date
$("#dateFilter").addEventListener("change", () => {

  draw();

  const selectedDate = $("#dateFilter").value;

  if (!selectedDate) return;

  const count = getFilteredTasks().length;

  if (count > 0) {

    showToast(
      `تم العثور على ${count} مهمة في التاريخ المحدد`
    );

  } else {

    showToast("لا توجد مهام في هذا التاريخ");

  }

});

// Clear Selected Date
$("#clearDateFilter").addEventListener("click", () => {

  $("#dateFilter").value = "";

  draw();

  showToast("تم عرض جميع المهام");

});

/* ========================================
   Submit Form
======================================== */

$("#taskForm").addEventListener("submit", (event) => {

  event.preventDefault();

  const task = {};

  fields.forEach((field) => {
    task[field] = $(`#${field}`).value.trim();
  });

  // Validate Required Fields
  if (
    !task.employeeName ||
    !task.taskTitle ||
    !task.taskDate ||
    !task.taskTime ||
    !task.taskDetails
  ) {

    showError(
      "من فضلك أكمل جميع الحقول المطلوبة المحددة بعلامة النجمة."
    );

    return;
  }

  // Update Existing Task
  if (editingId !== null) {

    const oldTasks = [...tasks];

    tasks = tasks.map((item) =>
      item.id === editingId
        ? {
            ...item,
            ...task,
          }
        : item
    );

    if (!saveTasks()) {
      tasks = oldTasks;
      return;
    }

    showToast("تم تحديث المهمة بنجاح");

  } else {

    // Add New Task
    const newTask = {
      id: Date.now(),
      ...task,
    };

    tasks.unshift(newTask);

    if (!saveTasks()) {

      tasks = tasks.filter(
        (item) => item.id !== newTask.id
      );

      return;
    }

    showToast("تمت إضافة المهمة بنجاح");
  }

  draw();

  closeModal();

});

/* ========================================
   Table Actions
======================================== */

$("#tasksRows").addEventListener("click", (event) => {

  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) return;

  const id = Number(button.dataset.id);

  const task = tasks.find(
    (item) => item.id === id
  );

  if (!task) return;

  // Edit Task
  if (button.dataset.action === "edit") {

    openModal(task);

    return;
  }

  // Delete Task
  if (button.dataset.action === "delete") {

    const confirmed = confirm(
      `هل أنت متأكد من حذف مهمة "${task.taskTitle}" الخاصة بالموظف "${task.employeeName}"؟`
    );

    if (!confirmed) return;

    const oldTasks = [...tasks];

    tasks = tasks.filter(
      (item) => item.id !== id
    );

    if (!saveTasks()) {
      tasks = oldTasks;
      return;
    }

    draw();

    showToast("تم حذف المهمة بنجاح");

    return;
  }

  // Toggle Task Status
  if (button.dataset.action === "toggle") {

    const oldStatus = task.taskStatus;

    task.taskStatus =
      task.taskStatus === "done"
        ? "pending"
        : "done";

    if (!saveTasks()) {

      task.taskStatus = oldStatus;

      return;
    }

    draw();

    showToast(
      task.taskStatus === "done"
        ? "تم تحديد المهمة كمنجزة"
        : "تم إعادة المهمة إلى المهام المتبقية"
    );
  }

});

/* ========================================
   Print Report
======================================== */

const padNumber = (value) => String(value).padStart(2, "0");

const formatReportDate = (date = new Date()) =>
  `${padNumber(date.getDate())}/${padNumber(date.getMonth() + 1)}/${date.getFullYear()}`;

const formatReportTime = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = padNumber(date.getMinutes());
  const period = hours >= 12 ? "م" : "ص";

  return `${padNumber(hours % 12 || 12)}:${minutes} ${period}`;
};

const formatTaskCode = (task) => {
  const raw = String(task.id ?? "").replace(/\D/g, "");

  if (!raw) return "—";

  return `TSK-${raw.slice(-6).padStart(6, "0")}`;
};

const formatPrintTime = (value) => {
  if (!value) return "—";

  const [h, m] = value.split(":").map(Number);

  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${
    h >= 12 ? "م" : "ص"
  }`;
};

function getPrintFilterSummary() {
  const query = $("#searchInput").value.trim();
  const status = $("#statusFilter").value;
  const selectedDate = $("#dateFilter").value;
  const parts = [];

  if (query) parts.push(`البحث: ${query}`);

  if (status !== "all") {
    parts.push(
      `الحالة: ${
        status === "done" ? "تم الإنجاز" : "قيد التنفيذ / متبقية"
      }`
    );
  }

  if (selectedDate) parts.push(`التاريخ: ${formatDate(selectedDate)}`);

  return parts.length
    ? `نتائج التصفية الحالية — ${parts.join(" • ")}`
    : "جميع المهام المسجلة في النظام";
}

function renderPrintReport(records) {
  const total = records.length;

  const done = records.filter(
    (task) => task.taskStatus === "done"
  ).length;

  const pending = total - done;

  const rate = total ? Math.round((done / total) * 100) : 0;

  const now = new Date();
  const reportDate = formatReportDate(now);
  const reportTime = formatReportTime(now);

  $("#printGeneratedDate").textContent = reportDate;
  $("#printGeneratedTime").textContent = reportTime;
  $("#printTasksCount").textContent = total;

  $("#printTotalTasks").textContent = total;
  $("#printDoneTasks").textContent = done;
  $("#printPendingTasks").textContent = pending;
  $("#printCompletionRate").textContent = `${rate}%`;

  $("#printFilterSummary").textContent = getPrintFilterSummary();
  $("#printFooterDate").textContent =
    `تاريخ الطباعة: ${reportDate} — ${reportTime}`;

  $("#printTasksRows").innerHTML = total
    ? records
        .map(
          (task, index) => `
            <tr>
              <td class="cell-index">${index + 1}</td>
              <td class="cell-code">${esc(formatTaskCode(task))}</td>
              <td class="cell-employee">${esc(task.employeeName)}</td>
              <td class="cell-title">${esc(task.taskTitle)}</td>
              <td class="cell-date">${formatDate(task.taskDate)}</td>
              <td class="cell-time">${formatPrintTime(task.taskTime)}</td>
              <td class="cell-status">
                <span class="print-status ${
                  task.taskStatus === "done"
                    ? "print-status--done"
                    : "print-status--pending"
                }">
                  ${task.taskStatus === "done" ? "منجزة" : "متبقية"}
                </span>
              </td>
              <td class="cell-details">${esc(task.taskDetails)}</td>
            </tr>
          `
        )
        .join("")
    : `
        <tr>
          <td colspan="8">
            <div class="print-empty">
              لا توجد مهام مطابقة للتصفية الحالية.
            </div>
          </td>
        </tr>
      `;

  $("#printReport").setAttribute("aria-hidden", "false");
}

/* ========================================
   Print Tasks Report
======================================== */

let printReportTimer;

$("#printTasksBtn").addEventListener("click", () => {
  // Print every record that matches the active filters,
  // not just the records visible on the current page.
  const records = getFilteredTasks();

  renderPrintReport(records);

  document.body.classList.add("print-mode");

  clearTimeout(printReportTimer);

  printReportTimer = setTimeout(() => {
    window.print();
  }, 120);
});

/* ========================================
   Restore Page After Printing
======================================== */

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-mode");
  $("#printReport").setAttribute("aria-hidden", "true");
});

/* ========================================
   Initial Render
======================================== */

draw();
