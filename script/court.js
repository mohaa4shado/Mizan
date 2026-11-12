
"use strict";

// ==========================================
// MIZAN - Case Management System
// ==========================================

const STORAGE_KEY = "mizan_cases";

const seeds = [
  {
    id: "case-1",
    clientName: "بهاء سلطان",
    clientRole: "طاعن",
    clientPhone: "01000000000",
    registrationDate: "2025-12-21",
    serial: "111",
    caseYear: "2021",
    caseNumber: "111",
    caseType: "تجاري",
    court: "المحكمة الابتدائية",
    circuit: "جنايات أول",
    subject: "موضوع تجاري",
    lawyer: "خالد الصاوي",
    status: "قيد المتابعة",
    opponentName: "",
    opponentPhone: "",
    notes: "",
  },
  {
    id: "case-2",
    clientName: "بهاء سلطان",
    clientRole: "مدعى عليه",
    clientPhone: "01000000001",
    registrationDate: "2025-12-24",
    serial: "222",
    caseYear: "2025",
    caseNumber: "222",
    caseType: "مدني",
    court: "مجلس الدولة",
    circuit: "مدني أول",
    subject: "موضوع مدني",
    lawyer: "أكرم حسني",
    status: "مكتملة",
    opponentName: "",
    opponentPhone: "",
    notes: "",
  },
  {
    id: "case-3",
    clientName: "ياسر جلال",
    clientRole: "متهم",
    clientPhone: "01000000002",
    registrationDate: "2025-12-25",
    serial: "333",
    caseYear: "2022",
    caseNumber: "333",
    caseType: "شرعي",
    court: "الضواحي الجزئية",
    circuit: "جنايات أول",
    subject: "موضوع شرعي",
    lawyer: "أكرم حسني",
    status: "تحتاج متابعة",
    opponentName: "",
    opponentPhone: "",
    notes: "",
  },
  {
    id: "case-4",
    clientName: "محمد عبد الصمد",
    clientRole: "مدعى عليه",
    clientPhone: "01000000003",
    registrationDate: "2025-12-25",
    serial: "444",
    caseYear: "2023",
    caseNumber: "444",
    caseType: "تجاري",
    court: "الضواحي الجزئية",
    circuit: "أسرة",
    subject: "موضوع تجاري",
    lawyer: "محمد تكال",
    status: "قيد المتابعة",
    opponentName: "",
    opponentPhone: "",
    notes: "",
  },
  {
    id: "case-5",
    clientName: "بهاء سلطان",
    clientRole: "مجني عليه",
    clientPhone: "01000000004",
    registrationDate: "2025-12-29",
    serial: "555",
    caseYear: "2020",
    caseNumber: "555",
    caseType: "عمالي",
    court: "الميناء الجزئية",
    circuit: "مدني ثاني",
    subject: "موضوع عمالي",
    lawyer: "خالد الصاوي",
    status: "قيد المتابعة",
    opponentName: "",
    opponentPhone: "",
    notes: "",
  },
];

// ==========================================
// DOM Elements
// ==========================================

const $ = (id) => document.getElementById(id);

const table = $("casesTable");
const cards = $("caseCards");
const modal = $("caseModal");
const overlay = $("caseOverlay");
const form = $("caseForm");

const searchInput = $("searchInput");
const statusFilter = $("statusFilter");
const typeFilter = $("typeFilter");
const pageSizeSelect = $("pageSize");

const previousPageButton = $("previousPage");
const nextPageButton = $("nextPage");

const openModalButton = $("openModal");
const closeModalButton = $("closeModal");
const cancelModalButton = $("cancelModal");
const printButton = $("printButton");

const toastElement = $("toast");

// ==========================================
// Application State
// ==========================================

let cases = [];
let editingId = null;
let currentPage = 1;
let toastTimer = null;
let previousFocusElement = null;

// ==========================================
// Utilities
// ==========================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidEgyptianPhone(value) {
  return /^01\d{9}$/.test(normalizePhone(value));
}

function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getNextSerial() {
  const maxSerial = cases.reduce((max, item) => {
    const serial = Number(item.serial);

    return Number.isFinite(serial) ? Math.max(max, serial) : max;
  }, 110);

  return String(maxSerial + 1);
}

// ==========================================
// Local Storage
// ==========================================

function normalizeCase(item, index = 0) {
  const safeItem = item && typeof item === "object" ? item : {};

  return {
    id: String(safeItem.id || createId()),
    clientName: String(safeItem.clientName || ""),
    clientRole: String(safeItem.clientRole || ""),
    clientPhone: normalizePhone(safeItem.clientPhone),
    registrationDate: String(safeItem.registrationDate || ""),
    serial: String(safeItem.serial || index + 111),
    caseYear: String(safeItem.caseYear || ""),
    caseNumber: String(safeItem.caseNumber || ""),
    caseType: String(safeItem.caseType || ""),
    court: String(safeItem.court || ""),
    circuit: String(safeItem.circuit || ""),
    subject: String(safeItem.subject || ""),
    lawyer: String(safeItem.lawyer || ""),
    status: [
      "قيد المتابعة",
      "تحتاج متابعة",
      "مكتملة",
    ].includes(safeItem.status)
      ? safeItem.status
      : "قيد المتابعة",
    opponentName: String(safeItem.opponentName || ""),
    opponentPhone: normalizePhone(safeItem.opponentPhone),
    notes: String(safeItem.notes || ""),
  };
}

function loadCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    // First visit: initialize sample data.
    if (raw === null) {
      const initialCases = seeds.map((item) => ({ ...item }));

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initialCases)
      );

      return initialCases;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid cases data.");
    }

    return parsed.map((item, index) =>
      normalizeCase(item, index)
    );
  } catch (error) {
    console.error("Error loading cases:", error);

    toast("تعذر قراءة البيانات المحفوظة.", true);

    return seeds.map((item) => ({ ...item }));
  }
}

function saveCases(data = cases) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    return true;
  } catch (error) {
    console.error("Error saving cases:", error);

    toast(
      "تعذر حفظ البيانات. تحقق من مساحة التخزين.",
      true
    );

    return false;
  }
}

// ==========================================
// Notifications
// ==========================================

function toast(message, error = false) {
  if (!toastElement) return;

  clearTimeout(toastTimer);

  toastElement.textContent = message;

  toastElement.className = error
    ? "toast show error"
    : "toast show";

  toastTimer = setTimeout(() => {
    toastElement.className = "toast";
  }, 3000);
}

// ==========================================
// Case Status
// ==========================================

function statusClass(status) {
  switch (status) {
    case "مكتملة":
      return "completed";

    case "تحتاج متابعة":
      return "warning";

    default:
      return "following";
  }
}

function statusBadge(status) {
  return `
    <span class="status-badge ${statusClass(status)}">
      ${escapeHTML(status)}
    </span>
  `;
}

// ==========================================
// Case Actions
// ==========================================

function actions(item) {
  const id = escapeHTML(item.id);

  return `
    <div class="row-actions">

      <button
        class="action-button"
        type="button"
        data-action="edit"
        data-id="${id}"
        title="تعديل القضية"
        aria-label="تعديل القضية"
      >
        <span class="material-symbols-outlined">edit</span>
      </button>

      <button
        class="action-button delete"
        type="button"
        data-action="delete"
        data-id="${id}"
        title="حذف القضية"
        aria-label="حذف القضية"
      >
        <span class="material-symbols-outlined">delete</span>
      </button>

    </div>
  `;
}

// ==========================================
// Search & Filters
// ==========================================

function getFiltered() {
  const query = searchInput.value
    .trim()
    .toLowerCase();

  const status = statusFilter.value;
  const type = typeFilter.value;

  return cases.filter((item) => {
    const searchableText = Object.values(item)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query || searchableText.includes(query);

    const matchesStatus =
      status === "all" || item.status === status;

    const matchesType =
      type === "all" || item.caseType === type;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType
    );
  });
}

// ==========================================
// Render Table
// ==========================================

function renderTable(items) {
  if (!items.length) {
    table.innerHTML = `
      <tr>
        <td colspan="12">
          <div class="empty-state">
            <h3>لا توجد نتائج مطابقة</h3>
            <p>
              جرّب تغيير كلمات البحث أو خيارات التصفية.
            </p>
          </div>
        </td>
      </tr>
    `;

    return;
  }

  table.innerHTML = items
    .map((item) => {
      const caseNumber = `${escapeHTML(item.caseNumber)}-${escapeHTML(
        item.caseYear.slice(-2)
      )}`;

      return `
        <tr>

          <td>
            <strong>${escapeHTML(item.clientName)}</strong>
          </td>

          <td>${escapeHTML(item.clientRole)}</td>

          <td>
            ${escapeHTML(item.registrationDate.replaceAll("-", "/"))}
          </td>

          <td class="number-cell">
            ${escapeHTML(item.serial)}
          </td>

          <td class="number-cell">
            ${caseNumber}
          </td>

          <td>${escapeHTML(item.caseType)}</td>

          <td>${escapeHTML(item.court)}</td>

          <td>${escapeHTML(item.circuit)}</td>

          <td>${escapeHTML(item.subject)}</td>

          <td>${escapeHTML(item.lawyer)}</td>

          <td>${statusBadge(item.status)}</td>

          <td>${actions(item)}</td>

        </tr>
      `;
    })
    .join("");
}

// ==========================================
// Render Mobile Cards
// ==========================================

function renderCards(items) {
  if (!items.length) {
    cards.innerHTML = `
      <div class="empty-state">
        <h3>لا توجد نتائج مطابقة</h3>
      </div>
    `;

    return;
  }

  cards.innerHTML = items
    .map((item) => {
      return `
        <article class="case-card">

          <div class="case-card-heading">
            <strong>
              ${escapeHTML(item.clientName)}
            </strong>

            ${actions(item)}
          </div>

          <dl>

            <div>
              <dt>رقم القضية</dt>
              <dd class="number-cell">
                ${escapeHTML(item.caseNumber)}-${escapeHTML(
                  item.caseYear.slice(-2)
                )}
              </dd>
            </div>

            <div>
              <dt>الحالة</dt>
              <dd>${statusBadge(item.status)}</dd>
            </div>

            <div>
              <dt>نوع القضية</dt>
              <dd>${escapeHTML(item.caseType)}</dd>
            </div>

            <div>
              <dt>المحكمة</dt>
              <dd>${escapeHTML(item.court)}</dd>
            </div>

            <div>
              <dt>محامي القضية</dt>
              <dd>${escapeHTML(item.lawyer)}</dd>
            </div>

            <div>
              <dt>تاريخ التسجيل</dt>
              <dd>${escapeHTML(item.registrationDate)}</dd>
            </div>

          </dl>

        </article>
      `;
    })
    .join("");
}

// ==========================================
// Statistics
// ==========================================

function renderStatistics() {
  const total = cases.length;

  const following = cases.filter(
    (item) =>
      item.status === "قيد المتابعة" ||
      item.status === "تحتاج متابعة"
  ).length;

  const completed = cases.filter(
    (item) => item.status === "مكتملة"
  ).length;

  $("totalCount").textContent = total;
  $("followingCount").textContent = following;
  $("completedCount").textContent = completed;
}

// ==========================================
// Pagination & Main Render
// ==========================================

function render() {
  const filtered = getFiltered();

  const pageSize = Number(pageSizeSelect.value) || 6;

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  currentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const start = (currentPage - 1) * pageSize;

  const pageItems = filtered.slice(
    start,
    start + pageSize
  );

  renderStatistics();

  renderTable(pageItems);

  renderCards(pageItems);

  $("tableInfo").textContent =
    `عرض ${
      filtered.length ? start + 1 : 0
    }-${Math.min(start + pageSize, filtered.length)} من ${
      filtered.length
    } قضية`;

  $("pageIndicator").textContent =
    `${currentPage} / ${totalPages}`;

  previousPageButton.disabled = currentPage <= 1;

  nextPageButton.disabled = currentPage >= totalPages;
}

// ==========================================
// Modal
// ==========================================

function openModal(item = null) {
  editingId = item?.id ?? null;

  previousFocusElement = document.activeElement;

  form.reset();

  $("caseModalTitle").textContent = item
    ? "تعديل القضية"
    : "إضافة قضية جديدة";

  $("caseSubmitBtn").textContent = item
    ? "حفظ التعديلات"
    : "حفظ القضية";

  if (item) {
    Object.entries(item).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);

      if (field) {
        field.value = value ?? "";
      }
    });
  } else {
    form.elements.registrationDate.value = getLocalDate();
  }

  overlay.classList.add("is-visible");

  modal.classList.add("is-visible");

  modal.setAttribute("aria-hidden", "false");

  overlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  setTimeout(() => {
    form.elements.clientName.focus();
  }, 100);
}

function closeModal() {
  overlay.classList.remove("is-visible");

  modal.classList.remove("is-visible");

  modal.setAttribute("aria-hidden", "true");

  overlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");

  editingId = null;

  form.reset();

  if (previousFocusElement?.isConnected) {
    previousFocusElement.focus();
  }
}

// ==========================================
// Add & Edit Cases
// ==========================================

function validateCase(values) {
  if (!isValidEgyptianPhone(values.clientPhone)) {
    toast(
      "رقم هاتف العميل غير صحيح. يجب أن يبدأ بـ 01 ويتكون من 11 رقماً.",
      true
    );

    form.elements.clientPhone.focus();

    return false;
  }

  if (
    values.opponentPhone &&
    !isValidEgyptianPhone(values.opponentPhone)
  ) {
    toast(
      "رقم هاتف الخصم غير صحيح. يجب أن يبدأ بـ 01 ويتكون من 11 رقماً.",
      true
    );

    form.elements.opponentPhone.focus();

    return false;
  }

  if (!/^\d{4}$/.test(values.caseYear)) {
    toast("يرجى إدخال سنة قضية صحيحة مكونة من 4 أرقام.", true);

    form.elements.caseYear.focus();

    return false;
  }

  return true;
}

function handleSubmit(event) {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const values = Object.fromEntries(
    new FormData(form).entries()
  );

  values.clientPhone = normalizePhone(values.clientPhone);

  values.opponentPhone = normalizePhone(values.opponentPhone);

  if (!validateCase(values)) return;

  const existing = cases.find(
    (item) => item.id === editingId
  );

  const nextCase = {
    ...values,

    id: existing?.id ?? createId(),

    serial: existing?.serial ?? getNextSerial(),
  };

  const updatedCases = existing
    ? cases.map((item) =>
        item.id === existing.id ? nextCase : item
      )
    : [nextCase, ...cases];

  // Save before updating application state.
  if (!saveCases(updatedCases)) return;

  cases = updatedCases;

  currentPage = 1;

  render();

  closeModal();

  toast(
    existing
      ? "تم تحديث القضية بنجاح."
      : "تمت إضافة القضية بنجاح."
  );
}

// ==========================================
// Edit & Delete Actions
// ==========================================

function handleAction(event) {
  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) return;

  const id = button.dataset.id;

  const item = cases.find(
    (entry) => entry.id === id
  );

  if (!item) return;

  if (button.dataset.action === "edit") {
    openModal(item);

    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(
      `هل تريد حذف القضية رقم "${item.caseNumber}"؟`
    );

    if (!confirmed) return;

    const updatedCases = cases.filter(
      (entry) => entry.id !== item.id
    );

    if (!saveCases(updatedCases)) return;

    cases = updatedCases;

    render();

    toast("تم حذف القضية بنجاح.");
  }
}

// ==========================================
// Event Listeners
// ==========================================

openModalButton.addEventListener("click", () => {
  openModal();
});

closeModalButton.addEventListener("click", closeModal);

cancelModalButton.addEventListener("click", closeModal);

overlay.addEventListener("click", closeModal);

form.addEventListener("submit", handleSubmit);

table.addEventListener("click", handleAction);

cards.addEventListener("click", handleAction);

// Search and filters.

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});

statusFilter.addEventListener("change", () => {
  currentPage = 1;
  render();
});

typeFilter.addEventListener("change", () => {
  currentPage = 1;
  render();
});

pageSizeSelect.addEventListener("change", () => {
  currentPage = 1;
  render();
});

// Previous page.

previousPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;

    render();
  }
});

// Next page.

nextPageButton.addEventListener("click", () => {
  const totalPages = Math.max(
    1,
    Math.ceil(
      getFiltered().length /
        (Number(pageSizeSelect.value) || 6)
    )
  );

  if (currentPage < totalPages) {
    currentPage++;

    render();
  }
});

// Print.

printButton.addEventListener("click", () => {
  window.print();
});

// Keyboard shortcuts.

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    modal.classList.contains("is-visible")
  ) {
    closeModal();

    return;
  }

  if (
    modal.classList.contains("is-visible") ||
    event.target.matches("input, select, textarea, button")
  ) {
    return;
  }

  if (event.key === "ArrowRight" && currentPage > 1) {
    currentPage--;

    render();
  }

  if (event.key === "ArrowLeft") {
    const totalPages = Math.max(
      1,
      Math.ceil(
        getFiltered().length /
          (Number(pageSizeSelect.value) || 6)
      )
    );

    if (currentPage < totalPages) {
      currentPage++;

      render();
    }
  }
});

// ==========================================
// Synchronize Local Storage Between Tabs
// ==========================================

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;

  try {
    const parsed = event.newValue
      ? JSON.parse(event.newValue)
      : [];

    if (!Array.isArray(parsed)) return;

    cases = parsed.map((item, index) =>
      normalizeCase(item, index)
    );

    render();
  } catch (error) {
    console.error("Storage synchronization error:", error);

    toast("حدث خطأ أثناء تحديث البيانات.", true);
  }
});

// ==========================================
// Initialize Application
// ==========================================

cases = loadCases();

render();
