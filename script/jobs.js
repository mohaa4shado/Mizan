"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const table = $("jobsTable");
  const searchInput = $("searchInput");
  const statusFilter = $("statusFilter");
  const pageSizeSelect = $("pageSize");
  const previousPageButton = $("previousPage");
  const nextPageButton = $("nextPage");
  const pageIndicator = $("pageIndicator");
  const tableInfo = $("tableInfo");
  const addButton = $("addJobButton");
  const modal = $("jobModal");
  const overlay = $("jobOverlay");
  const closeModalButton = $("closeModal");
  const cancelModalButton = $("cancelModal");
  const form = $("jobForm");
  const jobNameInput = $("jobName");
  const jobCodeInput = $("jobCode");
  const modalTitle = $("jobModalTitle");
  const submitButton = $("jobSubmitBtn");
  const formError = $("formError");
  const toastElement = $("toast");

  let editingId = null;
  let currentPage = 1;
  let toastTimer = null;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      const formatted = new Date(value).toLocaleDateString("ar-EG");
      return window.MizanNumbers
        ? window.MizanNumbers.toEnglishNumbers(formatted)
        : formatted;
    } catch {
      return String(value);
    }
  }

  function toast(message, error = false) {
    if (!toastElement) return;
    clearTimeout(toastTimer);
    toastElement.textContent = message;
    toastElement.className = error ? "toast show error" : "toast show";
    toastTimer = setTimeout(() => { toastElement.className = "toast"; }, 3000);
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
  }

  function clearFormError() {
    formError.textContent = "";
    formError.classList.add("hidden");
  }

  function openModal(job = null) {
    editingId = job ? job.id : null;
    clearFormError();
    form.reset();
    modalTitle.textContent = job ? "تعديل الوظيفة" : "إضافة وظيفة جديدة";
    submitButton.textContent = job ? "حفظ التعديلات" : "حفظ الوظيفة";
    jobNameInput.value = job ? job.name : "";
    jobCodeInput.value = job ? (job.code || job.id) : (window.MizanData?.getNextJobCode?.() || "تلقائي");
    overlay.classList.add("is-visible");
    modal.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setTimeout(() => jobNameInput.focus(), 50);
  }

  function closeModal() {
    overlay.classList.remove("is-visible");
    modal.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    editingId = null;
    clearFormError();
  }

  function getFilteredJobs() {
    const query = String(searchInput.value || "").trim().toLocaleLowerCase("ar");
    const status = statusFilter.value;
    return (window.MizanData?.getJobs?.() || []).filter((job) => {
      const text = `${job.name} ${job.code || job.id}`.toLocaleLowerCase("ar");
      const matchesQuery = !query || text.includes(query);
      const matchesStatus = status === "all" || job.status === status;
      return matchesQuery && matchesStatus;
    });
  }

  function renderStats() {
    const jobs = window.MizanData?.getJobs?.() || [];
    const active = jobs.filter((j) => j.status === "active").length;
    $("totalJobs").textContent = String(jobs.length);
    $("activeJobs").textContent = String(active);
    $("inactiveJobs").textContent = String(jobs.length - active);
  }

  function render() {
    const filtered = getFilteredJobs();
    const pageSize = Number(pageSizeSelect.value) || 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    renderStats();

    if (!pageItems.length) {
      table.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <h3>لا توجد وظائف مطابقة</h3>
              <p>جرّب تغيير البحث أو عامل التصفية.</p>
            </div>
          </td>
        </tr>`;
    } else {
      table.innerHTML = pageItems.map((job) => `
        <tr>
          <td class="number-cell"><strong>${escapeHTML(job.code || job.id)}</strong></td>
          <td>${escapeHTML(job.name)}</td>
          <td>
            <span class="status-badge ${job.status === "active" ? "active" : "inactive"}">
              ${job.status === "active" ? "مفعلة" : "غير مفعلة"}
            </span>
          </td>
          <td>${escapeHTML(formatDate(job.createdAt))}</td>
          <td>
            <div class="row-actions">
              <button class="action-button" type="button" data-action="edit" data-id="${escapeHTML(job.id)}" title="تعديل">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="action-button ${job.status === "active" ? "warn" : "ok"}" type="button" data-action="toggle" data-id="${escapeHTML(job.id)}" title="${job.status === "active" ? "إلغاء التفعيل" : "تفعيل"}">
                <span class="material-symbols-outlined">${job.status === "active" ? "toggle_off" : "toggle_on"}</span>
              </button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    const from = filtered.length ? start + 1 : 0;
    const to = Math.min(start + pageSize, filtered.length);
    tableInfo.textContent = `عرض ${from}-${to} من ${filtered.length} وظيفة`;
    pageIndicator.textContent = `${currentPage} / ${totalPages}`;
    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
  }

  addButton.addEventListener("click", () => openModal());
  closeModalButton.addEventListener("click", closeModal);
  cancelModalButton.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormError();
    const name = jobNameInput.value.trim();
    if (!name) {
      showFormError("يرجى إدخال اسم الوظيفة.");
      return;
    }

    let result;
    if (editingId) {
      result = window.MizanData.updateJob(editingId, { name });
    } else {
      result = window.MizanData.addJob(name);
    }

    if (!result || !result.ok) {
      showFormError(result?.error || "تعذر حفظ الوظيفة.");
      return;
    }

    closeModal();
    currentPage = 1;
    render();
    toast(editingId ? "تم تحديث الوظيفة بنجاح." : "تمت إضافة الوظيفة بنجاح. ستظهر في قوائم العملاء والموظفين.");
  });

  table.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const job = window.MizanData.getJobById(id);
    if (!job) return;

    if (btn.dataset.action === "edit") {
      openModal(job);
      return;
    }

    if (btn.dataset.action === "toggle") {
      const nextStatus = job.status === "active" ? "inactive" : "active";
      if (nextStatus === "inactive" && window.MizanData.isJobInUse(job.id)) {
        // Allowed to deactivate? requirement says "when a job is deactivated, prevent assigning it to new records while preserving existing employee and client records" - so deactivation is allowed even if in use.
      }
      const res = window.MizanData.setJobStatus(job.id, nextStatus);
      if (!res.ok) {
        toast(res.error || "تعذر تغيير حالة الوظيفة.", true);
        return;
      }
      render();
      toast(nextStatus === "active" ? "تم تفعيل الوظيفة." : "تم إلغاء تفعيل الوظيفة. لن تظهر في السجلات الجديدة مع الحفاظ على السجلات الحالية.");
    }
  });

  [searchInput, statusFilter, pageSizeSelect].forEach((el) => {
    el.addEventListener(el === searchInput ? "input" : "change", () => {
      currentPage = 1;
      render();
    });
  });

  previousPageButton.addEventListener("click", () => { if (currentPage > 1) { currentPage--; render(); } });
  nextPageButton.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFilteredJobs().length / (Number(pageSizeSelect.value) || 10)));
    if (currentPage < totalPages) { currentPage++; render(); }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-visible")) closeModal();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === window.MizanData?.JOBS_KEY) {
      render();
    }
  });

  // Ensure seed once and render
  window.MizanData?.ensureSeedJobs?.();
  render();
});