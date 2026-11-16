"use strict";

/**
 * Shared data access for MIZAN pages.
 * Centralized LocalStorage access for cases and jobs (single source of truth).
 */
(function (global) {
  const CASES_KEY = "mizan_cases";
  const JOBS_KEY = "mizan_jobs";
  const JOBS_SEEDED_KEY = "mizan_jobs_seeded_v1";
  const CLIENTS_KEY = "members";
  const EMPLOYEES_KEY = "employee-list-html-js";

  const PREDEFINED_JOBS = [
    "مدير المكتب",
    "شريك مؤسس",
    "مستشار قانوني",
    "محامي",
    "محامي استئناف",
    "محامي نقض",
    "محامي تحت التمرين",
    "باحث قانوني",
    "مساعد قانوني",
    "سكرتير قانوني",
    "مسؤول القضايا",
    "مندوب محاكم",
    "مدير إداري",
    "سكرتير إداري",
    "موظف استقبال",
    "مسؤول خدمة العملاء",
    "محاسب",
    "أمين خزينة",
    "مسؤول موارد بشرية",
    "مسؤول تسويق",
    "مسؤول تكنولوجيا المعلومات",
    "مسؤول أرشيف",
    "مدخل بيانات",
    "سائق",
    "عامل خدمات",
  ];

  // Legacy list kept for backward compatibility with earlier UI usage
  const JOB_POSITIONS = PREDEFINED_JOBS.map((name) => ({ value: name, ar: name, en: "" }));

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ar");
  }

  /* =========================
     Cases
  ========================= */
  function getCases() {
    const parsed = safeParse(localStorage.getItem(CASES_KEY), []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function normalizeCaseNumber(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase("ar")
      .replace(/\s+/g, "");
  }

  function findCasesByNumber(caseNumber) {
    const needle = normalizeCaseNumber(caseNumber);
    if (!needle) return [];
    return getCases().filter(
      (item) => normalizeCaseNumber(item && item.caseNumber) === needle,
    );
  }

  function getCaseById(id) {
    if (!id) return null;
    return getCases().find((item) => String(item.id) === String(id)) || null;
  }

  /* =========================
     Jobs (single source of truth)
  ========================= */
  function normalizeJob(job, index = 0) {
    const safe = job && typeof job === "object" ? job : {};
    const status = safe.status === "inactive" ? "inactive" : "active";
    const name = String(safe.name ?? "").trim();
    return {
      id: String(safe.id || `JOB${String(index + 1).padStart(4, "0")}`),
      code: String(safe.code || safe.id || `JOB${String(index + 1).padStart(4, "0")}`),
      name,
      status,
      createdAt: safe.createdAt || new Date().toISOString(),
      updatedAt: safe.updatedAt || safe.createdAt || new Date().toISOString(),
    };
  }

  function sortJobs(jobs) {
    return [...jobs].sort((a, b) => String(a.code || a.id).localeCompare(String(b.code || b.id), "en", { numeric: true }));
  }

  function saveJobs(jobs) {
    const normalized = sortJobs((Array.isArray(jobs) ? jobs : []).map((j, i) => normalizeJob(j, i)));
    localStorage.setItem(JOBS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function ensureSeedJobs() {
    let jobs = safeParse(localStorage.getItem(JOBS_KEY), []);
    jobs = Array.isArray(jobs) ? jobs : [];
    const seeded = localStorage.getItem(JOBS_SEEDED_KEY) === "1";

    if (!seeded && jobs.length === 0) {
      const now = new Date().toISOString();
      jobs = PREDEFINED_JOBS.map((name, index) => ({
        id: `JOB${String(index + 1).padStart(4, "0")}`,
        code: `JOB${String(index + 1).padStart(4, "0")}`,
        name,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }));
      saveJobs(jobs);
      localStorage.setItem(JOBS_SEEDED_KEY, "1");
      return jobs;
    }

    // Normalize any existing data (including legacy/manual entries) and persist once normalized
    const normalized = sortJobs(jobs.map((j, i) => normalizeJob(j, i)));
    if (JSON.stringify(normalized) !== JSON.stringify(jobs)) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(normalized));
    }
    if (!seeded && normalized.length > 0) {
      localStorage.setItem(JOBS_SEEDED_KEY, "1");
    }
    return normalized;
  }

  function getJobs() {
    return ensureSeedJobs();
  }

  function getActiveJobs() {
    return getJobs().filter((job) => job.status === "active");
  }

  function getJobById(id) {
    if (!id) return null;
    return getJobs().find((job) => String(job.id) === String(id)) || null;
  }

  function getJobByName(name) {
    const needle = normalizeText(name);
    if (!needle) return null;
    return getJobs().find((job) => normalizeText(job.name) === needle) || null;
  }

  function resolveJobName(jobId, fallbackName = "") {
    const job = getJobById(jobId);
    if (job) return job.name;
    return String(fallbackName ?? "").trim();
  }

  function getNextJobCode(jobs) {
    const max = (jobs || getJobs()).reduce((acc, job) => {
      const m = String(job.code || job.id || "").match(/(\d+)/);
      const n = m ? parseInt(m[1], 10) : 0;
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 0);
    return `JOB${String(max + 1).padStart(4, "0")}`;
  }

  function jobNameExists(name, excludeId = null) {
    const needle = normalizeText(name);
    return getJobs().some(
      (job) => String(job.id) !== String(excludeId || "") && normalizeText(job.name) === needle,
    );
  }

  function addJob(name) {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return { ok: false, error: "يرجى إدخال اسم الوظيفة." };
    if (jobNameExists(trimmed)) return { ok: false, error: "اسم الوظيفة موجود بالفعل." };
    const jobs = getJobs();
    const code = getNextJobCode(jobs);
    const now = new Date().toISOString();
    const job = { id: code, code, name: trimmed, status: "active", createdAt: now, updatedAt: now };
    jobs.push(job);
    saveJobs(jobs);
    return { ok: true, job: normalizeJob(job) };
  }

  function updateJob(id, updates = {}) {
    const jobs = getJobs();
    const idx = jobs.findIndex((j) => String(j.id) === String(id));
    if (idx === -1) return { ok: false, error: "الوظيفة غير موجودة." };
    const nextName = updates.name !== undefined ? String(updates.name).trim() : jobs[idx].name;
    if (!nextName) return { ok: false, error: "يرجى إدخال اسم الوظيفة." };
    if (jobNameExists(nextName, id)) return { ok: false, error: "اسم الوظيفة موجود بالفعل." };
    jobs[idx] = {
      ...jobs[idx],
      name: nextName,
      updatedAt: new Date().toISOString(),
    };
    saveJobs(jobs);
    return { ok: true, job: jobs[idx] };
  }

  function setJobStatus(id, status) {
    const jobs = getJobs();
    const idx = jobs.findIndex((j) => String(j.id) === String(id));
    if (idx === -1) return { ok: false, error: "الوظيفة غير موجودة." };
    jobs[idx] = { ...jobs[idx], status: status === "inactive" ? "inactive" : "active", updatedAt: new Date().toISOString() };
    saveJobs(jobs);
    return { ok: true, job: jobs[idx] };
  }

  function isJobInUse(id) {
    if (!id) return false;
    const jobId = String(id);
    const clients = safeParse(localStorage.getItem(CLIENTS_KEY), []);
    const employees = safeParse(localStorage.getItem(EMPLOYEES_KEY), []);
    const inClients = Array.isArray(clients) && clients.some((c) => String(c && c.jobId) === jobId);
    const inEmployees = Array.isArray(employees) && employees.some((e) => String(e && e.jobId) === jobId);
    return inClients || inEmployees;
  }

  function populateJobsSelect(select, options = {}) {
    if (!select) return;
    const {
      includePlaceholder = true,
      placeholder = "اختر الوظيفة",
      onlyActive = true,
      selectedValue = "",
      includeJobId = null, // always include this job if provided (for existing inactive records)
    } = options;
    const jobs = onlyActive ? getActiveJobs() : getJobs();
    const list = [...jobs];
    if (includeJobId) {
      const extra = getJobById(includeJobId);
      if (extra && !list.some((j) => String(j.id) === String(extra.id))) {
        list.unshift(extra);
      }
    }
    const current = selectedValue || select.value || "";
    select.innerHTML = "";
    if (includePlaceholder) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      select.appendChild(opt);
    }
    list.forEach((job) => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = job.name + (job.status === "inactive" ? " (غير مفعلة)" : "");
      opt.dataset.jobName = job.name;
      opt.dataset.status = job.status;
      if (job.status === "inactive" && String(job.id) !== String(current)) {
        opt.disabled = true;
      }
      select.appendChild(opt);
    });
    if (current) select.value = current;
  }

  function formatJobLabel(position) {
    if (!position) return "";
    if (position.ar && position.en) return `${position.ar} - ${position.en}`;
    return position.ar || position.en || position.value || position.name || "";
  }

  function populateJobPositionSelect(select, options = {}) {
    // Backward-compatible wrapper now backed by jobs data source
    populateJobsSelect(select, {
      includePlaceholder: options.includeEmpty !== false,
      placeholder: options.placeholder || "اختر المسمى الوظيفي",
      onlyActive: true,
      selectedValue: options.selectedValue || "",
    });
  }

  global.MizanData = {
    CASES_KEY,
    JOBS_KEY,
    JOBS_SEEDED_KEY,
    CLIENTS_KEY,
    EMPLOYEES_KEY,
    PREDEFINED_JOBS,
    JOB_POSITIONS,
    // cases
    getCases,
    getCaseById,
    findCasesByNumber,
    normalizeCaseNumber,
    // jobs
    ensureSeedJobs,
    getJobs,
    getActiveJobs,
    getJobById,
    getJobByName,
    resolveJobName,
    saveJobs,
    addJob,
    updateJob,
    setJobStatus,
    isJobInUse,
    jobNameExists,
    getNextJobCode,
    populateJobsSelect,
    // legacy helpers
    formatJobLabel,
    populateJobPositionSelect,
    normalizeText,
  };
})(window);
