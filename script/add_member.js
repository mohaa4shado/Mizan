const skeletonLoader = document.getElementById("skeletonLoader");
const realContent = document.getElementById("realContent");
const permissionsContainer = document.getElementById("permissionsContainer");
const permissionsCount = document.getElementById("permissionsCount");
const form = document.getElementById("memberForm");
const formMessage = document.getElementById("formMessage");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const jobPositionSelect = document.getElementById("jobPosition");
const jobPositionSearch = document.getElementById("jobPositionSearch");

const permissions = [
  "إضافة المستخدم",
  "إضافة عميل",
  "أنواع العملاء",
  "الموردين",
  "المحاكم",
  "الدوائر",
  "أنواع القضايا",
  "القضايا",
  "مواعيد الجلسات",
  "الوكالات",
  "مهام الموظفين العامة",
  "الالتزامات",
  "دفعات التحصيل",
  "دفعات السداد",
  "الإيرادات والمصروفات",
  "التقارير",
  "الصندوق",
  "أوقات المستخدمين",
];

function updatePermissionsCount() {
  const selectedCount = permissionsContainer.querySelectorAll(
    ".permission-card.active",
  ).length;
  permissionsCount.textContent = `تم اختيار ${selectedCount} من ${permissions.length} صلاحية`;
}

function setAllPermissions(selected) {
  permissionsContainer.querySelectorAll(".permission-card").forEach((card) => {
    card.classList.toggle("active", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
  updatePermissionsCount();
}

permissions.forEach((permission) => {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "permission-card";
  card.setAttribute("aria-pressed", "false");

  const indicator = document.createElement("span");
  indicator.className = "permission-indicator";
  indicator.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "permission-label";
  label.textContent = permission;

  card.append(indicator, label);
  card.addEventListener("click", () => {
    const selected = card.classList.toggle("active");
    card.setAttribute("aria-pressed", String(selected));
    updatePermissionsCount();
  });

  permissionsContainer.appendChild(card);
});

document
  .getElementById("selectAllPermissions")
  .addEventListener("click", () => setAllPermissions(true));
document
  .getElementById("clearPermissions")
  .addEventListener("click", () => setAllPermissions(false));

togglePassword.addEventListener("click", () => {
  const showPassword = passwordInput.type === "password";
  passwordInput.type = showPassword ? "text" : "password";
  togglePassword.setAttribute("aria-pressed", String(showPassword));
  togglePassword.setAttribute(
    "aria-label",
    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور",
  );
  togglePassword.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">${showPassword ? "visibility_off" : "visibility"}</span>`;
});

form.addEventListener("input", () => {
  formMessage.classList.add("hidden");
  formMessage.textContent = "";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.classList.add("hidden");

  if (!form.reportValidity()) return;

  const selectedPermissions = Array.from(
    permissionsContainer.querySelectorAll(".permission-card.active .permission-label"),
    (label) => label.textContent,
  );

  if (selectedPermissions.length === 0) {
    formMessage.textContent = "يرجى اختيار صلاحية واحدة على الأقل.";
    formMessage.classList.remove("hidden");
    document.getElementById("permissionsHeading").scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    return;
  }

  const member = {
    id: `member-${Date.now()}`,
    fullName: document.getElementById("fullName").value.trim(),
    username: document.getElementById("username").value.trim(),
    jobPosition: jobPositionSelect ? jobPositionSelect.value : "",
    permissions: selectedPermissions,
    createdAt: new Date().toISOString(),
  };

  try {
    const key = "mizan_members";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const list = Array.isArray(existing) ? existing : [];
    list.unshift(member);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // non-blocking; form still considered captured
  }

  formMessage.textContent =
    "تم حفظ بيانات المستخدم والمسمى الوظيفي بنجاح.";
  formMessage.classList.remove("hidden");
  form.reset();
  setAllPermissions(false);
  if (jobPositionSelect) jobPositionSelect.value = "";
  if (jobPositionSearch) jobPositionSearch.value = "";
});

function initJobPositionDropdown() {
  if (!jobPositionSelect || !window.MizanData) return;
  window.MizanData.populateJobPositionSelect(jobPositionSelect, {
    placeholder: "اختر المسمى الوظيفي",
    includeEmpty: true,
  });

  if (jobPositionSearch) {
    jobPositionSearch.addEventListener("input", () => {
      const q = jobPositionSearch.value.trim().toLocaleLowerCase("ar");
      const options = Array.from(jobPositionSelect.options);
      options.forEach((opt, index) => {
        if (index === 0) {
          opt.hidden = false;
          return;
        }
        const text = `${opt.textContent || ""} ${opt.value || ""}`.toLocaleLowerCase("ar");
        opt.hidden = q ? !text.includes(q) : false;
      });
      // if current selection hidden, reset to placeholder
      if (jobPositionSelect.selectedOptions[0]?.hidden) {
        jobPositionSelect.value = "";
      }
    });
  }
}

initJobPositionDropdown();

window.addEventListener("load", () => {
  requestAnimationFrame(() => {
    skeletonLoader.classList.add("hidden");
    realContent.classList.remove("hidden");
  });
});
