
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
    caseId: "",
    caseNumber: "111-21",
    sessionDate: "2026-04-22",
    sessionTime: "09:45",
    clientName: "بهاء سلطان",
    clientPhone: "",
    clientAddress: "",
    clientRole: "جاني أول",
    subject: "جاني أول",
    court: "جنايات أول",
    circuit: "بورسعيد الابتدائية",
    city: "القاهرة",
    opponentName: "خصم 01",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 2,
    caseId: "",
    caseNumber: "444-23",
    sessionDate: "2026-04-28",
    sessionTime: "07:55",
    clientName: "محمد عبد الصمد",
    clientPhone: "",
    clientAddress: "",
    clientRole: "مدعى عليه",
    subject: "موضوع 04",
    court: "المرور الجزئية",
    circuit: "مدني أول",
    city: "القاهرة",
    opponentName: "خصم 04",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 3,
    caseId: "",
    caseNumber: "333-99",
    sessionDate: "2026-04-30",
    sessionTime: "10:00",
    clientName: "ياسر جلال",
    clientPhone: "",
    clientAddress: "",
    clientRole: "متهم",
    subject: "موضوع 03",
    court: "بورسعيد الابتدائية",
    circuit: "مدني ثاني",
    city: "المنصورة",
    opponentName: "خصم 03",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 4,
    caseId: "",
    caseNumber: "222-25",
    sessionDate: "2026-04-27",
    sessionTime: "08:15",
    clientName: "بهاء سلطان",
    clientPhone: "",
    clientAddress: "",
    clientRole: "مدعى عليه",
    subject: "موضوع 02",
    court: "الميناء الجزئية",
    circuit: "جنايات أول",
    city: "بورسعيد",
    opponentName: "خصم 02",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 5,
    caseId: "",
    caseNumber: "666-23",
    sessionDate: "2026-06-11",
    sessionTime: "09:35",
    clientName: "ياسر جلال",
    clientPhone: "",
    clientAddress: "",
    clientRole: "موضوع 06",
    subject: "موضوع 06",
    court: "تعويضات",
    circuit: "الضواحي الجزئية",
    city: "دمياط",
    opponentName: "خصم 06",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 6,
    caseId: "",
    caseNumber: "888-23",
    sessionDate: "2026-04-27",
    sessionTime: "08:35",
    clientName: "بهاء سلطان",
    clientPhone: "",
    clientAddress: "",
    clientRole: "مدعي",
    subject: "مطالبة",
    court: "بورسعيد الابتدائية",
    circuit: "مدني أول",
    city: "بورفؤاد",
    opponentName: "عادل شهيدة",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 7,
    caseId: "",
    caseNumber: "888-23",
    sessionDate: "2026-05-16",
    sessionTime: "10:00",
    clientName: "بهاء سلطان",
    clientPhone: "",
    clientAddress: "",
    clientRole: "مطالبة",
    subject: "مطالبة",
    court: "تعويضات",
    circuit: "الضواحي الجزئية",
    city: "بورفؤاد",
    opponentName: "عادل شهيدة",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },

  {
    id: 8,
    caseId: "",
    caseNumber: "888-23",
    sessionDate: "2026-06-13",
    sessionTime: "10:00",
    clientName: "بهاء سلطان",
    clientPhone: "",
    clientAddress: "",
    clientRole: "مطالبة",
    subject: "مطالبة",
    court: "استئناف الإسكندرية",
    circuit: "الدائرة الأولى",
    city: "دمياط",
    opponentName: "عادل شهيدة",
    caseType: "",
    caseStatus: "",
    assignedLawyer: "",
  },
];


/* =========================================
   Form Fields
========================================= */

const fields = [
  "caseId",
  "caseNumber",
  "subject",
  "court",
  "circuit",
  "city",
  "caseType",
  "caseStatus",
  "assignedLawyer",
  "clientName",
  "clientPhone",
  "clientAddress",
  "clientRole",
  "opponentName",
  "sessionDate",
  "sessionTime",
];

const CASE_LINKED_FIELDS = [
  "subject",
  "court",
  "circuit",
  "city",
  "caseType",
  "caseStatus",
  "assignedLawyer",
  "clientName",
  "clientPhone",
  "clientAddress",
  "clientRole",
  "opponentName",
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

function normalizeSession(session) {
  return {
    id: session?.id ?? Date.now(),
    caseId: String(session?.caseId ?? ""),
    caseNumber: String(session?.caseNumber ?? ""),
    sessionDate: String(session?.sessionDate ?? ""),
    sessionTime: String(session?.sessionTime ?? ""),
    clientName: String(session?.clientName ?? ""),
    clientPhone: String(session?.clientPhone ?? ""),
    clientAddress: String(session?.clientAddress ?? ""),
    clientRole: String(session?.clientRole ?? ""),
    subject: String(session?.subject ?? ""),
    court: String(session?.court ?? ""),
    circuit: String(session?.circuit ?? ""),
    city: String(session?.city ?? ""),
    opponentName: String(session?.opponentName ?? ""),
    caseType: String(session?.caseType ?? ""),
    caseStatus: String(session?.caseStatus ?? ""),
    assignedLawyer: String(session?.assignedLawyer ?? ""),
  };
}

function loadSessions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      return seedSessions.map(normalizeSession);
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return seedSessions.map(normalizeSession);
    return parsed.map(normalizeSession);

  } catch (error) {
    console.error("تعذر تحميل الجلسات:", error);

    return seedSessions.map(normalizeSession);
  }
}


let sessions = loadSessions();

let editingId = null;


function saveSessions() {
  try {
    const cleanSessions = sessions.map((session) => {
      const { clientCode, ...rest } = session || {};
      return normalizeSession(rest);
    });

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
   Case Lookup & Auto-fill
========================================= */

let caseLookupTimer = null;
let linkedCase = null;

function setCaseLookupStatus(message, type = "") {
  const el = $("#caseLookupStatus");
  if (!el) return;
  el.textContent = message || "";
  el.className = `case-lookup-status ${type}`.trim();
}

function setCaseLookupMessage(message, type = "") {
  const el = $("#caseLookupMessage");
  if (!el) return;
  if (!message) {
    el.textContent = "";
    el.className = "case-lookup-message hidden";
    return;
  }
  el.textContent = message;
  el.className = `case-lookup-message ${type}`.trim();
}

function clearCaseInfoCard() {
  const card = $("#caseInfoCard");
  const body = $("#caseInfoBody");
  if (body) body.innerHTML = "";
  if (card) card.classList.add("hidden");
}

function renderCaseInfoCard(caseItem) {
  const card = $("#caseInfoCard");
  const body = $("#caseInfoBody");
  if (!card || !body || !caseItem) return;

  const displayCaseNumber = [caseItem.caseNumber, caseItem.caseYear ? String(caseItem.caseYear).slice(-2) : ""]
    .filter(Boolean)
    .join(caseItem.caseNumber && caseItem.caseYear ? "-" : "");

  const infoItems = [
    { label: "رقم القضية", value: displayCaseNumber || caseItem.caseNumber },
    { label: "اسم العميل", value: caseItem.clientName },
    { label: "هاتف العميل", value: caseItem.clientPhone },
    { label: "عنوان العميل", value: caseItem.clientAddress },
    { label: "عنوان الدعوى / الموضوع", value: caseItem.subject },
    { label: "اسم الخصم", value: caseItem.opponentName },
    { label: "المحكمة", value: caseItem.court },
    { label: "نوع القضية", value: caseItem.caseType },
    { label: "حالة القضية", value: caseItem.status },
    { label: "المحامي المكلف", value: caseItem.lawyer },
    { label: "الدائرة", value: caseItem.circuit },
    { label: "صفة العميل", value: caseItem.clientRole },
    { label: "تاريخ التسجيل", value: caseItem.registrationDate },
    { label: "سنة القضية", value: caseItem.caseYear },
    { label: "هاتف الخصم", value: caseItem.opponentPhone },
    { label: "ملاحظات", value: caseItem.notes },
  ].filter((item) => String(item.value ?? "").trim() !== "");

  body.innerHTML = infoItems
    .map(
      (item) => `
        <div class="case-info-item">
          <span class="case-info-label">${escapeHTML(item.label)}</span>
          <strong class="case-info-value">${escapeHTML(item.value)}</strong>
        </div>
      `,
    )
    .join("");

  card.classList.remove("hidden");
}

function clearLinkedCaseData({ keepCaseNumber = false } = {}) {
  linkedCase = null;
  $("#caseId").value = "";
  if ($("#caseNumberStored")) $("#caseNumberStored").value = "";
  if (!keepCaseNumber) $("#caseNumber").value = "";

  CASE_LINKED_FIELDS.forEach((field) => {
    const el = document.getElementById(field);
    if (!el) return;
    // Do not clear city if user might want manual, but it's auto-filled from case context not present; keep simple: clear
    el.value = "";
  });

  clearCaseInfoCard();
}

function applyCaseToForm(caseItem) {
  if (!caseItem) return;
  linkedCase = caseItem;
  $("#caseId").value = caseItem.id || "";
  if ($("#caseNumberStored")) $("#caseNumberStored").value = caseItem.caseNumber || "";

  const mapping = {
    subject: caseItem.subject,
    court: caseItem.court,
    circuit: caseItem.circuit,
    caseType: caseItem.caseType,
    caseStatus: caseItem.status,
    assignedLawyer: caseItem.lawyer,
    clientName: caseItem.clientName,
    clientPhone: caseItem.clientPhone,
    clientAddress: caseItem.clientAddress,
    clientRole: caseItem.clientRole,
    opponentName: caseItem.opponentName,
  };

  Object.entries(mapping).forEach(([field, value]) => {
    const el = document.getElementById(field);
    if (!el) return;
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      el.value = String(value);
    }
  });

  renderCaseInfoCard(caseItem);
}

async function performCaseLookup(rawValue, { silentEmpty = false } = {}) {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    clearLinkedCaseData({ keepCaseNumber: true });
    setCaseLookupStatus("", "");
    if (!silentEmpty) setCaseLookupMessage("", "");
    return;
  }

  setCaseLookupStatus("جاري البحث...", "loading");
  setCaseLookupMessage("", "");
  clearCaseInfoCard();

  // Small delay for loading indicator UX
  await new Promise((resolve) => setTimeout(resolve, 180));

  // If user changed/cleared meanwhile
  if ($("#caseNumber").value.trim() !== value) return;

  const dataApi = window.MizanData;
  if (!dataApi || typeof dataApi.findCasesByNumber !== "function") {
    setCaseLookupStatus("", "");
    setCaseLookupMessage("تعذر الوصول إلى بيانات القضايا. تأكد من تحميل ملفات النظام.", "error");
    return;
  }

  const matches = dataApi.findCasesByNumber(value);

  if (!matches.length) {
    linkedCase = null;
    $("#caseId").value = "";
    if ($("#caseNumberStored")) $("#caseNumberStored").value = "";
    clearCaseInfoCard();
    setCaseLookupStatus("", "");
    setCaseLookupMessage("رقم القضية غير موجود. يرجى التأكد من الرقم المسجل في صفحة القضايا.", "error");
    return;
  }

  let selected = matches[0];
  if (matches.length > 1) {
    const existingId = $("#caseId").value;
    selected = matches.find((m) => String(m.id) === String(existingId)) || matches[0];
    setCaseLookupMessage("تم العثور على أكثر من قضية بنفس الرقم، تم اختيار أول نتيجة.", "info");
  } else {
    setCaseLookupMessage("تم العثور على القضية وربط بياناتها بنجاح.", "success");
  }

  applyCaseToForm(selected);
  setCaseLookupStatus("تم الربط", "success");
}

function scheduleCaseLookup() {
  clearTimeout(caseLookupTimer);
  const value = $("#caseNumber").value;
  if (!String(value).trim()) {
    clearLinkedCaseData({ keepCaseNumber: true });
    setCaseLookupStatus("", "");
    setCaseLookupMessage("", "");
    return;
  }
  setCaseLookupStatus("جاري البحث...", "loading");
  caseLookupTimer = setTimeout(() => {
    performCaseLookup($("#caseNumber").value);
  }, 350);
}


/* =========================================
   Modal
========================================= */

function openModal(session = null) {
  editingId = session ? session.id : null;

  $("#sessionForm").reset();

  $("#formError").classList.add("hidden");
  setCaseLookupStatus("", "");
  setCaseLookupMessage("", "");
  clearCaseInfoCard();
  linkedCase = null;

  $("#modalTitle").textContent = session
    ? "تعديل بيانات الجلسة"
    : "إضافة جلسة جديدة";


  // Fill form fields
  fields.forEach((field) => {
    const el = document.getElementById(field);
    if (el) el.value = session?.[field] ?? "";
  });

  if (session?.caseId) {
    const found = window.MizanData?.getCaseById?.(session.caseId);
    if (found) {
      applyCaseToForm(found);
      setCaseLookupMessage("الجلسة مرتبطة بقضية مسجلة.", "info");
      setCaseLookupStatus("مرتبط", "success");
    } else {
      // keep stored snapshot values but indicate link source unavailable
      $("#caseId").value = session.caseId;
      if (session.caseNumber) renderCaseInfoCard({
        caseNumber: session.caseNumber,
        clientName: session.clientName,
        clientPhone: session.clientPhone,
        clientAddress: session.clientAddress,
        subject: session.subject,
        opponentName: session.opponentName,
        court: session.court,
        caseType: session.caseType,
        status: session.caseStatus,
        lawyer: session.assignedLawyer,
        circuit: session.circuit,
        clientRole: session.clientRole,
      });
      setCaseLookupMessage("تم تحميل بيانات الجلسة المحفوظة. لم يتم العثور على سجل القضية الأصلي حالياً.", "info");
    }
  } else if (session?.caseNumber) {
    // Try to resolve by number when editing legacy session
    performCaseLookup(session.caseNumber, { silentEmpty: true });
  }


  $("#sessionModal").classList.remove("hidden");

  document.body.classList.add("overflow-hidden");

  $("#caseNumber").focus();
}


function closeModal() {
  $("#sessionModal").classList.add("hidden");

  document.body.classList.remove("overflow-hidden");

  clearTimeout(caseLookupTimer);
  editingId = null;
  linkedCase = null;
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

$("#caseNumber").addEventListener("input", () => {
  const value = $("#caseNumber").value;
  $("#caseId").value = linkedCase && String(linkedCase.caseNumber).trim() === String(value).trim() ? (linkedCase.id || "") : "";
  scheduleCaseLookup();
});

$("#caseNumber").addEventListener("blur", () => {
  clearTimeout(caseLookupTimer);
  performCaseLookup($("#caseNumber").value);
});


/* =========================================
   Save / Update Session
========================================= */

$("#sessionForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const caseNumberValue = $("#caseNumber").value.trim();
  if (caseNumberValue) {
    // Ensure latest lookup state before save
    await performCaseLookup(caseNumberValue, { silentEmpty: true });
  }

  const session = {};

  fields.forEach((field) => {
    const el = document.getElementById(field);
    if (el) session[field] = el.value.trim();
  });

  // Prefer linked case source of truth when available
  const currentInput = $("#caseNumber").value.trim();
  const effectiveLinkedCase =
    linkedCase && window.MizanData?.normalizeCaseNumber(linkedCase.caseNumber) === window.MizanData?.normalizeCaseNumber(currentInput)
      ? linkedCase
      : (session.caseId ? window.MizanData?.getCaseById?.(session.caseId) : null);

  if (effectiveLinkedCase) {
    session.caseId = String(effectiveLinkedCase.id || "");
    session.caseNumber = String(effectiveLinkedCase.caseNumber || currentInput);
    session.subject = session.subject || String(effectiveLinkedCase.subject || "");
    session.court = session.court || String(effectiveLinkedCase.court || "");
    session.circuit = session.circuit || String(effectiveLinkedCase.circuit || "");
    session.caseType = String(effectiveLinkedCase.caseType || session.caseType || "");
    session.caseStatus = String(effectiveLinkedCase.status || session.caseStatus || "");
    session.assignedLawyer = String(effectiveLinkedCase.lawyer || session.assignedLawyer || "");
    session.clientName = session.clientName || String(effectiveLinkedCase.clientName || "");
    session.clientPhone = String(effectiveLinkedCase.clientPhone || session.clientPhone || "");
    session.clientAddress = String(effectiveLinkedCase.clientAddress || session.clientAddress || "");
    session.clientRole = session.clientRole || String(effectiveLinkedCase.clientRole || "");
    session.opponentName = session.opponentName || String(effectiveLinkedCase.opponentName || "");
  } else {
    session.caseId = "";
    session.caseNumber = currentInput;
  }


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
