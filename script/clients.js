const STORAGE_KEY = "members";
const DEFAULT_IMAGE = "../pic/images.png";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const PAGE_SIZE_DEFAULT = 6;

const membersTable = document.getElementById("membersTable");
const membersCards = document.getElementById("membersCards");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");
const pageSizeSelect = document.getElementById("pageSize");
const totalUsers = document.getElementById("totalUsers");
const activeUsers = document.getElementById("activeUsers");
const inactiveUsers = document.getElementById("inactiveUsers");
const resultsSummary = document.getElementById("resultsSummary");
const pageIndicator = document.getElementById("pageIndicator");
const previousPageButton = document.getElementById("previousPage");
const nextPageButton = document.getElementById("nextPage");
const overlay = document.getElementById("clientOverlay");
const modal = document.getElementById("clientModal");
const memberForm = document.getElementById("memberForm");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const formTitle = document.getElementById("memberModalTitle");
const submitButton = document.getElementById("memberSubmitBtn");
const activeField = document.getElementById("activeField");
const activeCheckbox = document.getElementById("clientActive");

let editingMemberId = null;
let currentPage = 1;
let members = [];

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function safeImageSource(value) {
  if (typeof value !== "string") return DEFAULT_IMAGE;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value)) return value;
  if (/^https:\/\/[^\s"'<>]+$/i.test(value)) return value;
  if (/^\.\.\/pic\/[a-z0-9._-]+$/i.test(value)) return value;
  return DEFAULT_IMAGE;
}

function normalizeMember(member) {
  const record = member && typeof member === "object" ? member : {};
  return {
    id: typeof record.id === "string" && record.id ? record.id : createId(),
    name: typeof record.name === "string" ? record.name : "",
    occupation:
      typeof record.occupation === "string"
        ? record.occupation
        : typeof record.job === "string"
          ? record.job
          : "",
    mobile:
      typeof record.mobile === "string" || typeof record.mobile === "number"
        ? String(record.mobile)
        : "",
    nationalId:
      typeof record.nationalId === "string" ||
      typeof record.nationalId === "number"
        ? String(record.nationalId)
        : "",
    nationality:
      typeof record.nationality === "string" ? record.nationality : "",
    address: typeof record.address === "string" ? record.address : "",
    image: safeImageSource(record.image),
    active: record.active === undefined ? true : Boolean(record.active),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : "",
  };
}

function loadMembers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.error(`Invalid data found in localStorage key "${STORAGE_KEY}".`);
      showToast("تعذر قراءة بيانات العملاء المخزنة.", "error");
      return [];
    }
    return parsed.map(normalizeMember);
  } catch (error) {
    console.error("Failed to load client data from localStorage.", error);
    showToast("تعذر قراءة بيانات العملاء من التخزين المحلي.", "error");
    return [];
  }
}

function saveMembers(nextMembers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMembers));
    return true;
  } catch (error) {
    console.error("Failed to save client data to localStorage.", error);
    showToast("تعذر حفظ البيانات. تحقق من مساحة التخزين المتاحة.", "error");
    return false;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(
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
}

function statusBadge(member) {
  const statusText = member.active ? "نشط" : "غير نشط";
  const statusClass = member.active ? "is-active" : "is-inactive";
  return `<span class="status-badge ${statusClass}"><span></span>${statusText}</span>`;
}

function actionButtons(member) {
  const escapedId = escapeHTML(member.id);
  return `
    <div class="row-actions">
      <button class="action-button edit-action" type="button" data-action="edit" data-id="${escapedId}" aria-label="تعديل ${escapeHTML(member.name)}" title="تعديل">
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
      </button>
      <button class="action-button status-action" type="button" data-action="toggle" data-id="${escapedId}" aria-label="${member.active ? "تعطيل" : "تنشيط"} ${escapeHTML(member.name)}" title="${member.active ? "تعطيل العميل" : "تنشيط العميل"}">
        <span class="material-symbols-outlined" aria-hidden="true">${member.active ? "person_off" : "person_check"}</span>
      </button>
      <button class="action-button delete-action" type="button" data-action="delete" data-id="${escapedId}" aria-label="حذف ${escapeHTML(member.name)}" title="حذف">
        <span class="material-symbols-outlined" aria-hidden="true">delete</span>
      </button>
    </div>
  `;
}

function emptyMarkup() {
  const hasFilters =
    Boolean(searchInput.value.trim()) || statusFilter.value !== "all";
  return `
    <div class="empty-state">
      <span class="material-symbols-outlined" aria-hidden="true">${hasFilters ? "search_off" : "group_add"}</span>
      <h3>${hasFilters ? "لا توجد نتائج مطابقة" : "لا يوجد عملاء بعد"}</h3>
      <p>${hasFilters ? "جرّب تغيير كلمات البحث أو خيارات التصفية." : "ابدأ بإضافة أول عميل إلى قائمتك."}</p>
    </div>
  `;
}

function renderTable(data) {
  if (!membersTable) return;
  if (data.length === 0) {
    membersTable.innerHTML = `<tr><td colspan="7">${emptyMarkup()}</td></tr>`;
    return;
  }

  membersTable.innerHTML = data
    .map(
      (member) => `
    <tr>
      <td>
        <div class="client-cell">
          <img class="client-avatar" src="${escapeHTML(member.image)}" alt="" />
          <div class="client-name">
            <strong>${escapeHTML(member.name)}</strong>
            <span>${escapeHTML(member.address || "العنوان غير مسجل")}</span>
          </div>
        </div>
      </td>
      <td>${escapeHTML(member.occupation || "—")}</td>
      <td class="number-cell" dir="ltr">${escapeHTML(member.mobile || "—")}</td>
      <td class="number-cell" dir="ltr">${escapeHTML(member.nationalId || "—")}</td>
      <td>${escapeHTML(member.nationality || "—")}</td>
      <td>${statusBadge(member)}</td>
      <td>${actionButtons(member)}</td>
    </tr>
  `,
    )
    .join("");
}

function renderCards(data) {
  if (!membersCards) return;
  if (data.length === 0) {
    membersCards.innerHTML = emptyMarkup();
    return;
  }

  membersCards.innerHTML = data
    .map(
      (member) => `
    <article class="client-card">
      <div class="client-card-heading">
        <div class="client-cell">
          <img class="client-avatar" src="${escapeHTML(member.image)}" alt="" />
          <div class="client-name">
            <strong>${escapeHTML(member.name)}</strong>
            <span>${escapeHTML(member.occupation || "الوظيفة غير مسجلة")}</span>
          </div>
        </div>
        ${statusBadge(member)}
      </div>
      <dl class="client-details">
        <div><dt>رقم الهاتف</dt><dd dir="ltr">${escapeHTML(member.mobile || "—")}</dd></div>
        <div><dt>الرقم القومي</dt><dd dir="ltr">${escapeHTML(member.nationalId || "—")}</dd></div>
        <div><dt>الجنسية</dt><dd>${escapeHTML(member.nationality || "—")}</dd></div>
        <div><dt>العنوان</dt><dd>${escapeHTML(member.address || "غير مسجل")}</dd></div>
      </dl>
      <div class="client-card-footer">${actionButtons(member)}</div>
    </article>
  `,
    )
    .join("");
}

function getFilteredMembers() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase("ar");
  const status = statusFilter.value;
  const sorted = members.filter((member) => {
    const matchesStatus =
      status === "all" ||
      (status === "active" && member.active) ||
      (status === "inactive" && !member.active);
    const searchableValues = [
      member.name,
      member.occupation,
      member.mobile,
      member.nationalId,
      member.nationality,
      member.address,
    ];
    const matchesSearch =
      !searchTerm ||
      searchableValues.some((value) =>
        value.toLocaleLowerCase("ar").includes(searchTerm),
      );
    return matchesStatus && matchesSearch;
  });

  if (sortFilter.value === "name-asc") {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  } else if (sortFilter.value === "name-desc") {
    sorted.sort((a, b) => b.name.localeCompare(a.name, "ar"));
  } else {
    sorted.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  return sorted;
}

function renderMembers() {
  const activeCount = members.filter((member) => member.active).length;
  if (totalUsers) totalUsers.textContent = String(members.length);
  if (activeUsers) activeUsers.textContent = String(activeCount);
  if (inactiveUsers)
    inactiveUsers.textContent = String(members.length - activeCount);

  const filteredMembers = getFilteredMembers();
  const pageSize = Number(pageSizeSelect.value) || PAGE_SIZE_DEFAULT;
  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleMembers = filteredMembers.slice(
    startIndex,
    startIndex + pageSize,
  );
  renderTable(visibleMembers);
  renderCards(visibleMembers);

  const firstResult = filteredMembers.length ? startIndex + 1 : 0;
  const lastResult = Math.min(startIndex + pageSize, filteredMembers.length);
  if (resultsSummary) {
    resultsSummary.textContent = `عرض ${firstResult}–${lastResult} من ${filteredMembers.length} عميل`;
  }
  if (pageIndicator)
    pageIndicator.textContent = `${currentPage} / ${pageCount}`;
  if (previousPageButton) previousPageButton.disabled = currentPage <= 1;
  if (nextPageButton) nextPageButton.disabled = currentPage >= pageCount;
}

function setModalMode(isEditing) {
  formTitle.textContent = isEditing ? "تعديل بيانات العميل" : "إضافة عميل جديد";
  submitButton.textContent = isEditing ? "حفظ التعديلات" : "حفظ العميل";
  activeField.classList.toggle("hidden", !isEditing);
}

function openClientModal(member = null) {
  memberForm.reset();
  editingMemberId = member?.id ?? null;
  setModalMode(Boolean(member));

  if (member) {
    document.getElementById("name").value = member.name;
    document.getElementById("occupation").value = member.occupation;
    document.getElementById("mobile").value = member.mobile;
    document.getElementById("nationalId").value = member.nationalId;
    document.getElementById("nationality").value = member.nationality;
    document.getElementById("address").value = member.address;
    activeCheckbox.checked = member.active;
    imagePreview.src = member.image;
  } else {
    imagePreview.src = DEFAULT_IMAGE;
    activeCheckbox.checked = true;
  }

  overlay.classList.add("is-visible");
  modal.classList.add("is-visible");
  overlay.setAttribute("aria-hidden", "false");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.setTimeout(() => document.getElementById("name").focus(), 50);
}

function closeClientModal() {
  overlay.classList.remove("is-visible");
  modal.classList.remove("is-visible");
  overlay.setAttribute("aria-hidden", "true");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  editingMemberId = null;
  memberForm.reset();
  imagePreview.src = DEFAULT_IMAGE;
  setModalMode(false);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The selected image could not be read."));
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("Image reading failed.")),
    );
    reader.readAsDataURL(file);
  });
}

async function submitClientForm(event) {
  event.preventDefault();
  if (!memberForm.reportValidity()) return;

  const values = {
    name: document.getElementById("name").value.trim(),
    occupation: document.getElementById("occupation").value.trim(),
    mobile: document.getElementById("mobile").value.trim(),
    nationalId: document.getElementById("nationalId").value.trim(),
    nationality: document.getElementById("nationality").value.trim(),
    address: document.getElementById("address").value.trim(),
  };
  const imageFile = imageInput.files?.[0];
  if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
    showToast("حجم الصورة أكبر من 2 ميجابايت.", "error");
    return;
  }
  if (imageFile && !imageFile.type.startsWith("image/")) {
    showToast("الملف المحدد ليس صورة صالحة.", "error");
    return;
  }

  const duplicate = members.some(
    (member) =>
      member.id !== editingMemberId &&
      (member.mobile === values.mobile ||
        member.nationalId === values.nationalId),
  );
  if (duplicate) {
    showToast("رقم الهاتف أو الرقم القومي مسجل لعميل آخر.", "error");
    return;
  }

  let image =
    members.find((member) => member.id === editingMemberId)?.image ??
    DEFAULT_IMAGE;
  if (imageFile) {
    try {
      image = await readImageFile(imageFile);
    } catch (error) {
      console.error("Failed to read the selected client image.", error);
      showToast("تعذر قراءة الصورة المحددة.", "error");
      return;
    }
  }

  const existingMember = members.find(
    (member) => member.id === editingMemberId,
  );
  const nextMember = {
    id: existingMember?.id ?? createId(),
    ...values,
    image,
    active: existingMember ? activeCheckbox.checked : true,
    createdAt: existingMember?.createdAt || new Date().toISOString(),
  };
  const nextMembers = existingMember
    ? members.map((member) =>
        member.id === existingMember.id ? nextMember : member,
      )
    : [nextMember, ...members];

  if (!saveMembers(nextMembers)) return;
  members = nextMembers;
  currentPage = 1;
  renderMembers();
  closeClientModal();
  showToast(
    existingMember ? "تم تحديث بيانات العميل." : "تمت إضافة العميل بنجاح.",
  );
}

function handleActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const member = members.find((entry) => entry.id === button.dataset.id);
  if (!member) {
    showToast("تعذر العثور على العميل المطلوب.", "error");
    return;
  }

  if (button.dataset.action === "edit") {
    openClientModal(member);
    return;
  }
  if (button.dataset.action === "delete") {
    if (!window.confirm(`هل تريد حذف العميل "${member.name}"؟`)) return;
    const nextMembers = members.filter((entry) => entry.id !== member.id);
    if (!saveMembers(nextMembers)) return;
    members = nextMembers;
    renderMembers();
    showToast("تم حذف العميل.");
    return;
  }
  if (button.dataset.action === "toggle") {
    const nextMembers = members.map((entry) =>
      entry.id === member.id ? { ...entry, active: !entry.active } : entry,
    );
    if (!saveMembers(nextMembers)) return;
    members = nextMembers;
    renderMembers();
    showToast(member.active ? "تم إيقاف العميل." : "تم تنشيط العميل.");
  }
}

document
  .getElementById("addClientButton")
  .addEventListener("click", () => openClientModal());
document
  .getElementById("closeClientModal")
  .addEventListener("click", closeClientModal);
document
  .getElementById("cancelClientModal")
  .addEventListener("click", closeClientModal);
overlay.addEventListener("click", closeClientModal);
memberForm.addEventListener("submit", submitClientForm);
membersTable.addEventListener("click", handleActionClick);
membersCards.addEventListener("click", handleActionClick);

searchInput.addEventListener("input", () => {
  currentPage = 1;
  renderMembers();
});
statusFilter.addEventListener("change", () => {
  currentPage = 1;
  renderMembers();
});
sortFilter.addEventListener("change", () => {
  currentPage = 1;
  renderMembers();
});
pageSizeSelect.addEventListener("change", () => {
  currentPage = 1;
  renderMembers();
});
previousPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderMembers();
  }
});
nextPageButton.addEventListener("click", () => {
  const pageCount = Math.max(
    1,
    Math.ceil(getFilteredMembers().length / Number(pageSizeSelect.value)),
  );
  if (currentPage < pageCount) {
    currentPage += 1;
    renderMembers();
  }
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) {
    imagePreview.src =
      members.find((member) => member.id === editingMemberId)?.image ??
      DEFAULT_IMAGE;
    return;
  }
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) {
    imageInput.value = "";
    imagePreview.src =
      members.find((member) => member.id === editingMemberId)?.image ??
      DEFAULT_IMAGE;
    showToast(
      file.size > MAX_IMAGE_SIZE
        ? "حجم الصورة أكبر من 2 ميجابايت."
        : "الملف المحدد ليس صورة صالحة.",
      "error",
    );
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (modal.classList.contains("is-visible")) closeClientModal();
    else if (!document.getElementById("overlay").classList.contains("hidden"))
      window.closeModal?.();
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  members = loadMembers();
  renderMembers();
});

members = loadMembers();
renderMembers();
