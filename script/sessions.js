
"use strict";

/* =========================================
   MIZAN - Sessions Management
========================================= */

const STORAGE_KEY = "mizan-sessions-list";

const $ = (selector) => document.querySelector(selector);


/* =========================================
   Default Sessions
========================================= */

const seedSessions = [
  {
    id: 1,
    caseNumber: "111-21",
    sessionDate: "2026-04-22",
    sessionTime: "09:45",
    clientName: "بهاء سلطان",
    clientRole: "جاني أول",
    subject: "جاني أول",
    court: "جنايات أول",
    circuit: "بورسعيد الابتدائية",
    city: "القاهرة",
    opponentName: "خصم 01",
  },

  {
    id: 2,
    caseNumber: "444-23",
    sessionDate: "2026-04-28",
    sessionTime: "07:55",
    clientName: "محمد عبد الصمد",
    clientRole: "مدعى عليه",
    subject: "موضوع 04",
    court: "المرور الجزئية",
    circuit: "مدني أول",
    city: "القاهرة",
    opponentName: "خصم 04",
  },

  {
    id: 3,
    caseNumber: "333-99",
    sessionDate: "2026-04-30",
    sessionTime: "10:00",
    clientName: "ياسر جلال",
    clientRole: "متهم",
    subject: "موضوع 03",
    court: "بورسعيد الابتدائية",
    circuit: "مدني ثاني",
    city: "المنصورة",
    opponentName: "خصم 03",
  },

  {
    id: 4,
    caseNumber: "222-25",
    sessionDate: "2026-04-27",
    sessionTime: "08:15",
    clientName: "بهاء سلطان",
    clientRole: "مدعى عليه",
    subject: "موضوع 02",
    court: "الميناء الجزئية",
    circuit: "جنايات أول",
    city: "بورسعيد",
    opponentName: "خصم 02",
  },

  {
    id: 5,
    caseNumber: "666-23",
    sessionDate: "2026-06-11",
    sessionTime: "09:35",
    clientName: "ياسر جلال",
    clientRole: "موضوع 06",
    subject: "موضوع 06",
    court: "تعويضات",
    circuit: "الضواحي الجزئية",
    city: "دمياط",
    opponentName: "خصم 06",
  },

  {
    id: 6,
    caseNumber: "888-23",
    sessionDate: "2026-04-27",
    sessionTime: "08:35",
    clientName: "بهاء سلطان",
    clientRole: "مدعي",
    subject: "مطالبة",
    court: "بورسعيد الابتدائية",
    circuit: "مدني أول",
    city: "بورفؤاد",
    opponentName: "عادل شهيدة",
  },

  {
    id: 7,
    caseNumber: "888-23",
    sessionDate: "2026-05-16",
    sessionTime: "10:00",
    clientName: "بهاء سلطان",
    clientRole: "مطالبة",
    subject: "مطالبة",
    court: "تعويضات",
    circuit: "الضواحي الجزئية",
    city: "بورفؤاد",
    opponentName: "عادل شهيدة",
  },

  {
    id: 8,
    caseNumber: "888-23",
    sessionDate: "2026-06-13",
    sessionTime: "10:00",
    clientName: "بهاء سلطان",
    clientRole: "مطالبة",
    subject: "مطالبة",
    court: "استئناف الإسكندرية",
    circuit: "الدائرة الأولى",
    city: "دمياط",
    opponentName: "عادل شهيدة",
  },
];


/* =========================================
   Form Fields
========================================= */

const fields = [
  "caseNumber",
  "subject",
  "court",
  "circuit",
  "city",
  "clientName",
  "clientRole",
  "opponentName",
  "sessionDate",
  "sessionTime",
];


/* =========================================
   Helpers
========================================= */

// Prevent HTML injection
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );


// Format Date
const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = value.split("-");

  return `${year}/${month}/${day}`;
};


// Format Time
const formatTime = (value) => {
  if (!value) return "—";

  const [hours, minutes] = value.split(":").map(Number);

  const suffix = hours >= 12 ? "PM" : "AM";

  return `${String(hours % 12 || 12).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")} ${suffix}`;
};


// Get Current Date
function getTodayString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}


/* =========================================
   Local Storage
========================================= */

function loadSessions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      return [...seedSessions];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [...seedSessions];

  } catch (error) {
    console.error("تعذر تحميل الجلسات:", error);

    return [...seedSessions];
  }
}


let sessions = loadSessions();

let editingId = null;


function saveSessions() {
  try {
    // Remove old clientCode property from stored records
    const cleanSessions = sessions.map(
      ({ clientCode, ...session }) => session
    );

    sessions = cleanSessions;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessions)
    );

  } catch (error) {
    console.error("تعذر حفظ الجلسات:", error);

    showToast("تعذر حفظ البيانات في المتصفح");
  }
}


/* =========================================
   Statistics
========================================= */

function updateStats() {
  const todayString = getTodayString();

  const todayCount = sessions.filter(
    (session) => session.sessionDate === todayString
  ).length;

  const upcomingCount = sessions.filter(
    (session) => session.sessionDate >= todayString
  ).length;

  $("#totalSessions").textContent = sessions.length;

  $("#todaySessions").textContent = todayCount;

  $("#upcomingSessions").textContent = upcomingCount;
}


/* =========================================
   Search and Filtering
========================================= */

function getFilteredSessions() {
  const query = $("#searchInput")
    .value
    .trim()
    .toLocaleLowerCase("ar");

  return sessions.filter((session) =>
    fields.some((field) =>
      String(session[field] ?? "")
        .toLocaleLowerCase("ar")
        .includes(query)
    )
  );
}


/* =========================================
   Draw Table
========================================= */

function draw() {
  const filtered = getFilteredSessions();

  const size = $("#pageSize").value;

  const visible =
    size === "all"
      ? filtered
      : filtered.slice(0, Number(size));


  $("#sessionsRows").innerHTML = visible.length
    ? visible
        .map(
          (session) => `
          <tr>

            <td>
              <span class="case-number">
                ${escapeHTML(session.caseNumber)}
              </span>
            </td>

            <td>
              ${formatDate(session.sessionDate)}
            </td>

            <td>
              <span class="time-cell">
                ${formatTime(session.sessionTime)}
              </span>
            </td>

            <td>
              <strong>
                ${escapeHTML(session.clientName)}
              </strong>
            </td>

            <td>
              ${escapeHTML(session.clientRole || "—")}
            </td>

            <td>
              ${escapeHTML(session.subject || "—")}
            </td>

            <td>
              ${escapeHTML(session.court || "—")}
            </td>

            <td>
              ${escapeHTML(session.circuit || "—")}
            </td>

            <td>
              ${escapeHTML(session.city || "—")}
            </td>

            <td>
              ${escapeHTML(session.opponentName || "—")}
            </td>

            <td class="actions-column">

              <div class="table-actions">

                <button
                  class="action-btn edit"
                  type="button"
                  data-action="edit"
                  data-id="${session.id}"
                  title="تعديل"
                  aria-label="تعديل الجلسة"
                >
                  <span class="material-symbols-outlined">
                    edit
                  </span>
                </button>

                <button
                  class="action-btn delete"
                  type="button"
                  data-action="delete"
                  data-id="${session.id}"
                  title="حذف"
                  aria-label="حذف الجلسة"
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
        <td colspan="11">

          <div class="empty-state">

            <span class="material-symbols-outlined">
              event_busy
            </span>

            <h3>لا توجد جلسات</h3>

            <p>
              لم يتم العثور على جلسات مطابقة لعملية البحث.
            </p>

          </div>

        </td>
      </tr>
    `;


  $("#resultsCount").textContent = filtered.length;

  updateStats();
}


/* =========================================
   Modal
========================================= */

function openModal(session = null) {
  editingId = session ? session.id : null;

  $("#sessionForm").reset();

  $("#formError").classList.add("hidden");

  $("#modalTitle").textContent = session
    ? "تعديل بيانات الجلسة"
    : "إضافة جلسة جديدة";


  // Fill form fields
  fields.forEach((field) => {
    $(`#${field}`).value = session?.[field] ?? "";
  });


  $("#sessionModal").classList.remove("hidden");

  document.body.classList.add("overflow-hidden");

  $("#caseNumber").focus();
}


function closeModal() {
  $("#sessionModal").classList.add("hidden");

  document.body.classList.remove("overflow-hidden");

  editingId = null;
}


function showError(message) {
  $("#formError").textContent = message;

  $("#formError").classList.remove("hidden");
}


/* =========================================
   Toast Notification
========================================= */

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


/* =========================================
   Add Session
========================================= */

$("#addSessionBtn").addEventListener("click", () => {
  openModal();
});


/* =========================================
   Close Modal
========================================= */

$("#closeModal").addEventListener("click", closeModal);

$("#cancelModal").addEventListener("click", closeModal);


$("#sessionModal").addEventListener("mousedown", (event) => {
  if (event.target === $("#sessionModal")) {
    closeModal();
  }
});


document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#sessionModal").classList.contains("hidden")
  ) {
    closeModal();
  }
});


/* =========================================
   Search Events
========================================= */

$("#searchInput").addEventListener("input", draw);

$("#pageSize").addEventListener("change", draw);


/* =========================================
   Save / Update Session
========================================= */

$("#sessionForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const session = {};

  fields.forEach((field) => {
    session[field] = $(`#${field}`).value.trim();
  });


  // Required Fields Validation
  if (
    !session.caseNumber ||
    !session.clientName ||
    !session.subject ||
    !session.sessionDate ||
    !session.sessionTime
  ) {
    showError(
      "من فضلك أكمل الحقول المطلوبة المحددة بعلامة النجمة."
    );

    return;
  }


  // Update Existing Session
  if (editingId !== null) {

    sessions = sessions.map((item) =>
      item.id === editingId
        ? {
            ...item,
            ...session,
          }
        : item
    );

    showToast("تم تحديث بيانات الجلسة بنجاح");

  }

  // Add New Session
  else {

    sessions.unshift({
      id: Date.now(),
      ...session,
    });

    showToast("تمت إضافة الجلسة بنجاح");

  }


  saveSessions();

  draw();

  closeModal();
});


/* =========================================
   Edit / Delete Sessions
========================================= */

$("#sessionsRows").addEventListener("click", (event) => {

  const button = event.target.closest("button[data-action]");

  if (!button) return;


  const id = Number(button.dataset.id);

  const session = sessions.find(
    (item) => item.id === id
  );

  if (!session) return;


  // Edit
  if (button.dataset.action === "edit") {

    openModal(session);

  }


  // Delete
  else if (button.dataset.action === "delete") {

    const confirmed = confirm(
      `هل أنت متأكد من حذف جلسة القضية "${session.caseNumber}"؟`
    );

    if (!confirmed) return;


    sessions = sessions.filter(
      (item) => item.id !== id
    );


    saveSessions();

    draw();

    showToast("تم حذف الجلسة بنجاح");

  }

});


/* =========================================
   PDF Export / Print
========================================= */

$("#printSessionsBtn").addEventListener("click", () => {

  // Get all matching search results
  const filteredSessions = getFilteredSessions();


  if (!filteredSessions.length) {

    showToast("لا توجد جلسات متاحة للطباعة");

    return;

  }


  // Save original table content
  const originalRows = $("#sessionsRows").innerHTML;

  const originalCount = $("#resultsCount").textContent;


  // Display ALL filtered records, regardless of page size
  $("#sessionsRows").innerHTML = filteredSessions
    .map(
      (session) => `
        <tr>

          <td>
            ${escapeHTML(session.caseNumber)}
          </td>

          <td>
            ${formatDate(session.sessionDate)}
          </td>

          <td>
            <span class="time-cell">
              ${formatTime(session.sessionTime)}
            </span>
          </td>

          <td>
            ${escapeHTML(session.clientName)}
          </td>

          <td>
            ${escapeHTML(session.clientRole || "—")}
          </td>

          <td>
            ${escapeHTML(session.subject || "—")}
          </td>

          <td>
            ${escapeHTML(session.court || "—")}
          </td>

          <td>
            ${escapeHTML(session.circuit || "—")}
          </td>

          <td>
            ${escapeHTML(session.city || "—")}
          </td>

          <td>
            ${escapeHTML(session.opponentName || "—")}
          </td>

          <td class="actions-column">
            —
          </td>

        </tr>
      `
    )
    .join("");


  // Update printed results count
  $("#resultsCount").textContent = filteredSessions.length;


  // Restore original table after printing
  const restoreTable = () => {

    $("#sessionsRows").innerHTML = originalRows;

    $("#resultsCount").textContent = originalCount;

  };


  // Listen for print completion
  window.addEventListener("afterprint", restoreTable, {
    once: true,
  });


  // Open browser print dialog
  window.print();


  // Fallback restoration
  setTimeout(restoreTable, 1500);

});


/* =========================================
   Initial Render
========================================= */

draw();
