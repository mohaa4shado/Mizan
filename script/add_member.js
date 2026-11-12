const skeletonLoader = document.getElementById("skeletonLoader");
const realContent = document.getElementById("realContent");
const permissionsContainer = document.getElementById("permissionsContainer");
const permissionsCount = document.getElementById("permissionsCount");
const form = document.getElementById("memberForm");
const formMessage = document.getElementById("formMessage");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

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

  formMessage.textContent =
    "تم التحقق من البيانات بنجاح. لحفظ الحساب فعليًا، يلزم ربط النموذج بخادم التطبيق.";
  formMessage.classList.remove("hidden");
});

window.addEventListener("load", () => {
  requestAnimationFrame(() => {
    skeletonLoader.classList.add("hidden");
    realContent.classList.remove("hidden");
  });
});
