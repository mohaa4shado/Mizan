
"use strict";

/* =========================================================
   MIZAN - CLIENT MANAGEMENT
   إضافة / تعديل / حذف / بحث / فلترة / حفظ العملاء
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     1. SETTINGS
  ========================= */

  const STORAGE_KEY = "members";
  const DEFAULT_PAGE_SIZE = 6;
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

  let members = [];
  let currentPage = 1;
  let pageSize = DEFAULT_PAGE_SIZE;
  let editingMemberId = null;
  let selectedImage = "";

  /* =========================
     2. DOM ELEMENTS
  ========================= */

  const elements = {
    addButton: document.getElementById("addClientButton"),

    totalUsers: document.getElementById("totalUsers"),
    activeUsers: document.getElementById("activeUsers"),
    inactiveUsers: document.getElementById("inactiveUsers"),

    membersTable: document.getElementById("membersTable"),
    membersCards: document.getElementById("membersCards"),

    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    sortFilter: document.getElementById("sortFilter"),
    pageSize: document.getElementById("pageSize"),

    resultsSummary: document.getElementById("resultsSummary"),
    previousPage: document.getElementById("previousPage"),
    nextPage: document.getElementById("nextPage"),
    pageIndicator: document.getElementById("pageIndicator"),

    overlay: document.getElementById("clientOverlay"),
    modal: document.getElementById("clientModal"),
    closeModal: document.getElementById("closeClientModal"),
    cancelModal: document.getElementById("cancelClientModal"),

    form: document.getElementById("memberForm"),
    formTitle: document.getElementById("memberModalTitle"),
    submitButton: document.getElementById("memberSubmitBtn"),

    name: document.getElementById("name"),
    jobId: document.getElementById("jobId"),
    mobile: document.getElementById("mobile"),
    nationalId: document.getElementById("nationalId"),
    nationality: document.getElementById("nationality"),
    address: document.getElementById("address"),

    imageInput: document.getElementById("image"),
    imagePreview: document.getElementById("imagePreview"),

    activeField: document.getElementById("activeField"),
    clientActive: document.getElementById("clientActive"),
  };

  /* =========================
     3. CHECK REQUIRED ELEMENTS
  ========================= */

  const requiredElements = [
    "addButton",
    "membersTable",
    "searchInput",
    "statusFilter",
    "sortFilter",
    "form",
    "overlay",
    "modal",
    "submitButton",
    "name",
    "jobId",
    "mobile",
    "nationalId",
    "nationality",
  ];

  const missingElements = requiredElements.filter(
    (key) => !elements[key]
  );

  if (missingElements.length) {
    console.error(
      "MIZAN: Missing HTML elements:",
      missingElements
    );

    return;
  }

  /* =========================
     4. HELPERS
  ========================= */

  function generateId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[character];
    });
  }

  function normalizeText(value = "") {
    return String(value).trim().toLowerCase();
  }

  function safeImageSource(source) {
    if (
      typeof source === "string" &&
      /^data:image\/(png|jpeg|webp|gif);base64,/i.test(source)
    ) {
      return source;
    }

    if (
      typeof source === "string" &&
      /^https:\/\//i.test(source)
    ) {
      return source;
    }

    return "../pic/images.png";
  }

  function showToast(message, type = "success") {
    let toast = document.getElementById("clientToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "clientToast";

      Object.assign(toast.style, {
        position: "fixed",
        bottom: "25px",
        right: "25px",
        zIndex: "99999",
        padding: "14px 22px",
        borderRadius: "12px",
        color: "#fff",
        fontFamily: "Cairo, sans-serif",
        fontSize: "14px",
        fontWeight: "700",
        boxShadow: "0 8px 25px rgba(0,0,0,.15)",
        opacity: "0",
        transform: "translateY(15px)",
        transition: "all .25s ease",
        maxWidth: "calc(100% - 40px)",
      });

      document.body.appendChild(toast);
    }

    toast.style.background =
      type === "error" ? "#dc3545" : "#198754";

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
    }, 3000);
  }

  function formatDate(date) {
    try {
      return new Date(date).toLocaleDateString("ar-EG");
    } catch {
      return "";
    }
  }

  /* =========================
     5. LOCAL STORAGE
  ========================= */

  function getJobDisplayName(member) {
    if (!member) return "";
    if (member.jobId && window.MizanData?.getJobById) {
      const job = window.MizanData.getJobById(member.jobId);
      if (job) return job.name;
    }
    return member.occupation || member.job || "";
  }

  function migrateMemberJob(member) {
    const next = { ...member };
    next.occupation = next.occupation || next.job || "";
    if (!next.jobId && next.occupation && window.MizanData?.getJobByName) {
      const match = window.MizanData.getJobByName(next.occupation);
      if (match) {
        next.jobId = match.id;
        next.occupation = match.name;
      }
    }
    return next;
  }

  function loadMembers() {
    try {
      window.MizanData?.ensureSeedJobs?.();
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (!storedData) {
        members = [];
        return;
      }

      const parsedData = JSON.parse(storedData);

      members = Array.isArray(parsedData)
        ? parsedData.map((member) => migrateMemberJob({
            id: member.id || generateId(),
            name: member.name || "",
            jobId: member.jobId || "",
            occupation: member.occupation || member.job || "",
            mobile: member.mobile || "",
            nationalId: member.nationalId || "",
            nationality: member.nationality || "",
            address: member.address || "",
            image: member.image || "",
            active:
              typeof member.active === "boolean"
                ? member.active
                : true,
            createdAt: member.createdAt || new Date().toISOString(),
            updatedAt: member.updatedAt || member.createdAt || new Date().toISOString(),
          }))
        : [];
    } catch (error) {
      console.error("Error loading clients:", error);

      members = [];

      showToast(
        "تعذر قراءة بيانات العملاء المحفوظة.",
        "error"
      );
    }
  }

  function saveMembers() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(members)
      );

      return true;
    } catch (error) {
      console.error("Error saving clients:", error);

      if (
        error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        showToast(
          "مساحة التخزين ممتلئة. حاول استخدام صورة أصغر.",
          "error"
        );
      } else {
        showToast(
          "حدث خطأ أثناء حفظ بيانات العميل.",
          "error"
        );
      }

      return false;
    }
  }

  /* =========================
     6. MODAL
  ========================= */

  function populateJobDropdown(selectedJobId = "") {
    if (!elements.jobId) return;
    window.MizanData?.populateJobsSelect?.(elements.jobId, {
      includePlaceholder: true,
      placeholder: "اختر الوظيفة",
      onlyActive: true,
      selectedValue: selectedJobId || "",
      includeJobId: selectedJobId || null,
    });
    // keep placeholder unselectable as value but selectable element exists
    if (!selectedJobId) elements.jobId.value = "";
  }

  function openClientModal() {
    elements.modal.classList.add("is-visible");
    elements.overlay.classList.add("is-visible");

    elements.modal.setAttribute("aria-hidden", "false");
    elements.overlay.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    setTimeout(() => {
      elements.name.focus();
    }, 100);
  }

  function closeClientModal() {
    elements.modal.classList.remove("is-visible");
    elements.overlay.classList.remove("is-visible");

    elements.modal.setAttribute("aria-hidden", "true");
    elements.overlay.setAttribute("aria-hidden", "true");

    document.body.classList.remove("modal-open");

    resetForm();
  }

  function resetForm() {
    elements.form.reset();

    editingMemberId = null;
    selectedImage = "";

    elements.formTitle.textContent = "إضافة عميل جديد";
    elements.submitButton.textContent = "حفظ العميل";

    elements.imagePreview.src = "../pic/images.png";
    populateJobDropdown("");

    if (elements.activeField) {
      elements.activeField.classList.add("hidden");
    }

    if (elements.clientActive) {
      elements.clientActive.checked = true;
    }

    elements.form
      .querySelectorAll("input, select")
      .forEach((input) => {
        input.setCustomValidity("");
      });
  }

  /* =========================
     7. ADD CLIENT
  ========================= */

  function openAddModal() {
    resetForm();
    openClientModal();
  }

  /* =========================
     8. EDIT CLIENT
  ========================= */

  function editClient(id) {
    const member = members.find(
      (item) => String(item.id) === String(id)
    );

    if (!member) {
      showToast("لم يتم العثور على العميل.", "error");
      return;
    }

    resetForm();

    editingMemberId = member.id;
    selectedImage = member.image || "";

    elements.name.value = member.name;
    let jobId = member.jobId || "";
    if (!jobId && member.occupation && window.MizanData?.getJobByName) {
      const match = window.MizanData.getJobByName(member.occupation);
      if (match) jobId = match.id;
    }
    populateJobDropdown(jobId);
    if (jobId) elements.jobId.value = jobId;
    elements.mobile.value = member.mobile;
    elements.nationalId.value = member.nationalId;
    elements.nationality.value = member.nationality;
    elements.address.value = member.address || "";

    elements.imagePreview.src = safeImageSource(
      member.image
    );

    if (elements.clientActive) {
      elements.clientActive.checked = member.active;
    }

    if (elements.activeField) {
      elements.activeField.classList.remove("hidden");
    }

    elements.formTitle.textContent = "تعديل بيانات العميل";
    elements.submitButton.textContent = "حفظ التعديلات";

    openClientModal();
  }

  /* =========================
     9. DELETE CLIENT
  ========================= */

  function deleteClient(id) {
    const member = members.find(
      (item) => String(item.id) === String(id)
    );

    if (!member) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${member.name}"؟`
    );

    if (!confirmed) return;

    const oldMembers = [...members];

    members = members.filter(
      (item) => String(item.id) !== String(id)
    );

    if (!saveMembers()) {
      members = oldMembers;
      return;
    }

    renderAll();

    showToast("تم حذف العميل بنجاح.");
  }

  /* =========================
     10. DUPLICATE VALIDATION
  ========================= */

  function checkDuplicates(mobile, nationalId) {
    return members.find((member) => {
      if (
        editingMemberId &&
        String(member.id) === String(editingMemberId)
      ) {
        return false;
      }

      return (
        normalizeText(member.mobile) === normalizeText(mobile) ||
        normalizeText(member.nationalId) === normalizeText(nationalId)
      );
    });
  }

  /* =========================
     11. IMAGE UPLOAD
  ========================= */

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        reject(
          new Error("نوع الصورة غير مدعوم.")
        );
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        reject(
          new Error("حجم الصورة يجب ألا يتجاوز 2 ميجابايت.")
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error("تعذر قراءة الصورة.")
        );
      };

      reader.readAsDataURL(file);
    });
  }

  if (elements.imageInput) {
    elements.imageInput.addEventListener("change", async () => {
      const file = elements.imageInput.files?.[0];

      if (!file) return;

      try {
        selectedImage = await readImage(file);

        elements.imagePreview.src = selectedImage;
      } catch (error) {
        elements.imageInput.value = "";
        selectedImage = "";

        elements.imagePreview.src = "../pic/images.png";

        showToast(error.message, "error");
      }
    });
  }

  /* =========================
     12. FORM SUBMIT
  ========================= */

  async function submitClientForm(event) {
    // منع إعادة تحميل الصفحة
    event.preventDefault();

    // منع تنفيذ الحفظ أكثر من مرة
    if (elements.submitButton.disabled) return;

    // التحقق من صحة الحقول المطلوبة
    if (!elements.form.reportValidity()) {
      return;
    }

    const name = elements.name.value.trim();
    const jobId = elements.jobId.value.trim();
    const job = jobId ? window.MizanData?.getJobById?.(jobId) : null;
    const occupation = job ? job.name : "";
    const mobile = elements.mobile.value.trim();
    const nationalId = elements.nationalId.value.trim();
    const nationality = elements.nationality.value.trim();
    const address = elements.address.value.trim();

    if (
      !name ||
      !jobId ||
      !job ||
      !mobile ||
      !nationalId ||
      !nationality
    ) {
      showToast(
        "من فضلك أكمل جميع الحقول المطلوبة واختر الوظيفة.",
        "error"
      );

      return;
    }

    if (job.status !== "active") {
      const existingSame = editingMemberId && members.find(m => String(m.id) === String(editingMemberId) && String(m.jobId) === String(jobId));
      if (!existingSame) {
        showToast("لا يمكن تعيين وظيفة غير مفعلة لسجل جديد.", "error");
        return;
      }
    }

    // التحقق من تكرار الهاتف أو الرقم القومي
    const duplicate = checkDuplicates(
      mobile,
      nationalId
    );

    if (duplicate) {
      if (
        normalizeText(duplicate.mobile) === normalizeText(mobile)
      ) {
        showToast(
          "رقم الهاتف مسجل بالفعل لعميل آخر.",
          "error"
        );
      } else {
        showToast(
          "الرقم القومي مسجل بالفعل لعميل آخر.",
          "error"
        );
      }

      return;
    }

    elements.submitButton.disabled = true;
    elements.submitButton.textContent = "جارٍ الحفظ...";

    try {
      let image = selectedImage;

      const imageFile = elements.imageInput?.files?.[0];

      // قراءة الصورة لو المستخدم اختار صورة جديدة
      if (imageFile) {
        image = await readImage(imageFile);
      }

      const existingMember = editingMemberId
        ? members.find(
            (item) =>
              String(item.id) === String(editingMemberId)
          )
        : null;

      const clientData = {
        id: editingMemberId || generateId(),

        name,
        jobId,
        occupation,
        mobile,
        nationalId,
        nationality,
        address,

        image: image || existingMember?.image || "",

        active: editingMemberId
          ? Boolean(elements.clientActive?.checked)
          : true,

        createdAt:
          existingMember?.createdAt ||
          new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      const oldMembers = [...members];

      if (editingMemberId) {
        members = members.map((member) =>
          String(member.id) === String(editingMemberId)
            ? clientData
            : member
        );
      } else {
        members.unshift(clientData);
      }

      // لا نغلق النافذة إلا بعد نجاح الحفظ
      const saved = saveMembers();

      if (!saved) {
        members = oldMembers;
        return;
      }

      currentPage = 1;

      renderAll();

      closeClientModal();

      showToast(
        editingMemberId
          ? "تم تحديث بيانات العميل بنجاح."
          : "تم إضافة العميل بنجاح."
      );
    } catch (error) {
      console.error("Client submit error:", error);

      showToast(
        error.message || "حدث خطأ أثناء حفظ العميل.",
        "error"
      );
    } finally {
      elements.submitButton.disabled = false;

      elements.submitButton.textContent = editingMemberId
        ? "حفظ التعديلات"
        : "حفظ العميل";
    }
  }

  /* =========================
     13. FILTER CLIENTS
  ========================= */

  function getFilteredMembers() {
    let result = [...members];

    const searchValue = normalizeText(
      elements.searchInput.value
    );

    const statusValue = elements.statusFilter.value;

    if (searchValue) {
      result = result.filter((member) => {
        const occupationName = getJobDisplayName(member);
        return (
          normalizeText(member.name).includes(searchValue) ||
          normalizeText(member.mobile).includes(searchValue) ||
          normalizeText(member.nationalId).includes(searchValue) ||
          normalizeText(occupationName).includes(searchValue) ||
          normalizeText(member.nationality).includes(searchValue)
        );
      });
    }

    if (statusValue === "active") {
      result = result.filter(
        (member) => member.active
      );
    }

    if (statusValue === "inactive") {
      result = result.filter(
        (member) => !member.active
      );
    }

    const sortValue = elements.sortFilter.value;

    if (sortValue === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    if (sortValue === "name-asc") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name, "ar")
      );
    }

    if (sortValue === "name-desc") {
      result.sort((a, b) =>
        b.name.localeCompare(a.name, "ar")
      );
    }

    return result;
  }

  /* =========================
     14. RENDER TABLE
  ========================= */

  function renderTable(data) {
    if (!data.length) {
      elements.membersTable.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:35px;">
            <div style="color:#94a3b8;font-weight:700;">
              لا توجد بيانات عملاء لعرضها.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    elements.membersTable.innerHTML = data
      .map(
        (member) => `
          <tr>
            <td>
              <div class="client-cell">
                <img
                  class="client-avatar"
                  src="${safeImageSource(member.image)}"
                  alt="${escapeHTML(member.name)}"
                  onerror="this.src='../pic/images.png'"
                />

                <div class="client-name">
                  <strong>${escapeHTML(member.name)}</strong>
                  <span>
                    ${formatDate(member.createdAt)}
                  </span>
                </div>
              </div>
            </td>

            <td>${escapeHTML(getJobDisplayName(member))}</td>

            <td class="number-cell">
              ${escapeHTML(member.mobile)}
            </td>

            <td class="number-cell">
              ${escapeHTML(member.nationalId)}
            </td>

            <td>${escapeHTML(member.nationality)}</td>

            <td>
              <span class="status-badge ${
                member.active ? "active" : "inactive"
              }">
                <span></span>
                ${member.active ? "نشط" : "غير نشط"}
              </span>
            </td>

            <td>
              <div class="row-actions">
                <button
                  type="button"
                  class="icon-button"
                  data-action="edit"
                  data-id="${escapeHTML(member.id)}"
                  title="تعديل العميل"
                  aria-label="تعديل العميل"
                >
                  <span class="material-symbols-outlined">
                    edit
                  </span>
                </button>

                <button
                  type="button"
                  class="icon-button"
                  data-action="delete"
                  data-id="${escapeHTML(member.id)}"
                  title="حذف العميل"
                  aria-label="حذف العميل"
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
      .join("");
  }

  /* =========================
     15. RENDER MOBILE CARDS
  ========================= */

  function renderCards(data) {
    if (!elements.membersCards) return;

    if (!data.length) {
      elements.membersCards.innerHTML = "";
      return;
    }

    elements.membersCards.innerHTML = data
      .map(
        (member) => `
          <article class="client-card">
            <div class="client-card-heading">
              <img
                class="client-avatar"
                src="${safeImageSource(member.image)}"
                alt="${escapeHTML(member.name)}"
                onerror="this.src='../pic/images.png'"
              />

              <div class="client-name">
                <strong>${escapeHTML(member.name)}</strong>
                <span>${escapeHTML(getJobDisplayName(member))}</span>
              </div>
            </div>

            <div class="client-card-details">
              <p>
                <strong>الهاتف:</strong>
                ${escapeHTML(member.mobile)}
              </p>

              <p>
                <strong>الرقم القومي:</strong>
                ${escapeHTML(member.nationalId)}
              </p>

              <p>
                <strong>الجنسية:</strong>
                ${escapeHTML(member.nationality)}
              </p>

              <p>
                <strong>العنوان:</strong>
                ${escapeHTML(member.address || "غير محدد")}
              </p>

              <p>
                <strong>الحالة:</strong>
                ${member.active ? "نشط" : "غير نشط"}
              </p>
            </div>

            <div class="row-actions">
              <button
                type="button"
                class="secondary-button"
                data-action="edit"
                data-id="${escapeHTML(member.id)}"
              >
                تعديل
              </button>

              <button
                type="button"
                class="secondary-button"
                data-action="delete"
                data-id="${escapeHTML(member.id)}"
              >
                حذف
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  /* =========================
     16. RENDER STATISTICS
  ========================= */

  function renderStatistics() {
    const total = members.length;

    const active = members.filter(
      (member) => member.active
    ).length;

    const inactive = total - active;

    elements.totalUsers.textContent = total;
    elements.activeUsers.textContent = active;
    elements.inactiveUsers.textContent = inactive;
  }

  /* =========================
     17. PAGINATION
  ========================= */

  function renderPagination(filteredMembers) {
    const total = filteredMembers.length;

    const totalPages = Math.max(
      1,
      Math.ceil(total / pageSize)
    );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;

    const endIndex = Math.min(
      startIndex + pageSize,
      total
    );

    const currentData = filteredMembers.slice(
      startIndex,
      endIndex
    );

    elements.pageIndicator.textContent =
      `${currentPage} / ${totalPages}`;

    elements.resultsSummary.textContent =
      total === 0
        ? "عرض 0 من 0 عميل"
        : `عرض ${startIndex + 1} - ${endIndex} من ${total} عميل`;

    elements.previousPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;

    return currentData;
  }

  /* =========================
     18. RENDER ALL
  ========================= */

  function renderAll() {
    renderStatistics();

    const filteredMembers = getFilteredMembers();

    const currentData = renderPagination(
      filteredMembers
    );

    renderTable(currentData);
    renderCards(currentData);
  }

  /* =========================
     19. EVENT LISTENERS
  ========================= */

  // فتح نافذة إضافة عميل
  elements.addButton.addEventListener(
    "click",
    openAddModal
  );

  // إغلاق النافذة
  elements.closeModal?.addEventListener(
    "click",
    closeClientModal
  );

  elements.cancelModal?.addEventListener(
    "click",
    closeClientModal
  );

  elements.overlay.addEventListener(
    "click",
    closeClientModal
  );

  // أهم جزء: ربط زرار الحفظ بالفورم
  elements.form.addEventListener(
    "submit",
    submitClientForm
  );

  // البحث
  elements.searchInput.addEventListener(
    "input",
    () => {
      currentPage = 1;
      renderAll();
    }
  );

  // الفلترة
  elements.statusFilter.addEventListener(
    "change",
    () => {
      currentPage = 1;
      renderAll();
    }
  );

  // الترتيب
  elements.sortFilter.addEventListener(
    "change",
    () => {
      currentPage = 1;
      renderAll();
    }
  );

  // عدد العناصر في الصفحة
  elements.pageSize?.addEventListener(
    "change",
    () => {
      pageSize = Number(elements.pageSize.value) || DEFAULT_PAGE_SIZE;
      currentPage = 1;
      renderAll();
    }
  );

  // الصفحة السابقة
  elements.previousPage?.addEventListener(
    "click",
    () => {
      if (currentPage > 1) {
        currentPage--;
        renderAll();
      }
    }
  );

  // الصفحة التالية
  elements.nextPage?.addEventListener(
    "click",
    () => {
      const totalPages = Math.max(
        1,
        Math.ceil(getFilteredMembers().length / pageSize)
      );

      if (currentPage < totalPages) {
        currentPage++;
        renderAll();
      }
    }
  );

  // تنفيذ التعديل والحذف من الجدول والكروت
  document.addEventListener("click", (event) => {
    const button = event.target.closest(
      "[data-action][data-id]"
    );

    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") {
      editClient(id);
    }

    if (action === "delete") {
      deleteClient(id);
    }
  });

  // إغلاق النافذة بزر Escape
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      elements.modal.classList.contains("is-visible")
    ) {
      closeClientModal();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === window.MizanData?.JOBS_KEY) {
      renderAll();
      if (elements.modal.classList.contains("is-visible")) {
        populateJobDropdown(elements.jobId.value);
      }
    }
  });

  /* =========================
     20. INITIALIZATION
  ========================= */

  loadMembers();

  if (elements.pageSize) {
    pageSize =
      Number(elements.pageSize.value) || DEFAULT_PAGE_SIZE;
  }

  renderAll();

  console.log("MIZAN Clients System Initialized Successfully");
});
