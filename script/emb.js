"use strict";

/* ========================================
   Mizan - Employee Management
   ======================================== */

// Local Storage Key
const KEY = "employee-list-html-js";

// Default Employees
const seed = [
  {
    id: 1,
    name: "محمد تكال",
    role: "محامي",
    salary: 10000,
    address: "بورسعيد",
    mobile: "01012345678",
    balance: 0,
  },
  {
    id: 2,
    name: "احمد تكال",
    role: "محامي",
    salary: 9500,
    address: "بورسعيد",
    mobile: "01098765432",
    balance: 0,
  },
  {
    id: 3,
    name: "بسمة خالد",
    role: "سكرتير",
    salary: 8000,
    address: "بورسعيد",
    mobile: "01122334455",
    balance: 0,
  },
  {
    id: 4,
    name: "عادل أدهم",
    role: "عامل",
    salary: 6000,
    address: "بورسعيد",
    mobile: "01234567890",
    balance: 0,
  },
  {
    id: 5,
    name: "فريد شوقي",
    role: "فني",
    salary: 8500,
    address: "بورسعيد",
    mobile: "01099887766",
    balance: 0,
  },
  {
    id: 6,
    name: "منى زكي",
    role: "سكرتير",
    salary: 9000,
    address: "بورسعيد",
    mobile: "01199887766",
    balance: 0,
  },
  {
    id: 7,
    name: "فاروق الفيشاوي",
    role: "محاسب",
    salary: 12000,
    address: "بورسعيد",
    mobile: "01055443322",
    balance: 0,
  },
  {
    id: 8,
    name: "أكرم حسني",
    role: "محامي",
    salary: 11000,
    address: "بورسعيد",
    mobile: "01255443322",
    balance: 0,
  },
  {
    id: 9,
    name: "خالد الصاوي",
    role: "محامي",
    salary: 10500,
    address: "بورسعيد",
    mobile: "01066778899",
    balance: 0,
  },
];

/* ========================================
   Helpers
   ======================================== */

// Select Element
const $ = (selector) => document.querySelector(selector);

// Form Fields
const fields = ["name", "role", "salary", "mobile", "address", "balance"];

// Format Numbers
const fmt = (number) =>
  new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2,
  }).format(Number(number) || 0);

// Escape HTML
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

// Format Salary
const formatMoney = (amount) => `${fmt(amount)} ج.م`;

// Get Role Color
function getRoleClass(role) {
  const roles = {
    محامي: "role-lawyer",
    سكرتير: "role-secretary",
    عامل: "role-worker",
    فني: "role-technician",
    محاسب: "role-accountant",
    مدير: "role-manager",
    "موظف إداري": "role-administrative",
  };

  return roles[role] || "role-default";
}

/* ========================================
   Data Management
   ======================================== */

// Load Employees
function loadData() {
  try {
    const saved = localStorage.getItem(KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    return [...seed];
  } catch (error) {
    console.error("Error loading employees:", error);
    return [...seed];
  }
}

// Employees Data
let data = loadData();

// Current Editing Employee
let editId = null;

// Save Employees
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving employees:", error);

    alert("تعذر حفظ البيانات. تحقق من مساحة التخزين المتاحة.");
  }
}

/* ========================================
   Statistics
   ======================================== */

function updateStatistics() {
  // Total Employees
  $("#count").textContent = fmt(data.length);

  // Total Salaries
  const totalSalary = data.reduce(
    (total, employee) => total + Number(employee.salary || 0),
    0,
  );

  $("#salarySum").textContent = formatMoney(totalSalary);

  // Total Unique Roles
  const totalRoles = new Set(data.map((employee) => employee.role)).size;

  $("#roles").textContent = fmt(totalRoles);
}

/* ========================================
   Render Employees
   ======================================== */

function draw() {
  const searchInput = $("#search");
  const pageSizeInput = $("#pageSize");

  const query = searchInput.value.trim().toLowerCase();

  // Filter Employees
  const filtered = data.filter((employee) =>
    [employee.name, employee.role, employee.mobile, employee.address].some(
      (value) => String(value).toLowerCase().includes(query),
    ),
  );

  // Pagination
  const size = pageSizeInput.value;

  const shown = size === "all" ? filtered : filtered.slice(0, Number(size));

  // Update Statistics
  updateStatistics();

  // Update Results
  $("#results").textContent = fmt(filtered.length);

  // Render Table
  $("#rows").innerHTML = shown.length
    ? shown
        .map(
          (employee) => `
            <tr>
              <!-- Employee Name -->
              <td class="employee-name">
                ${esc(employee.name)}
              </td>

              <!-- Employee Role -->
              <td>
                <span class="role-badge ${getRoleClass(employee.role)}">
                  ${esc(employee.role)}
                </span>
              </td>

              <!-- Salary -->
              <td class="salary-cell">
                ${formatMoney(employee.salary)}
              </td>

              <!-- Address -->
              <td>
                <span class="address-cell">
                  ${esc(employee.address)}
                </span>
              </td>

              <!-- Mobile -->
              <td>
                <span class="mobile-cell" dir="ltr">
                  ${esc(employee.mobile)}
                </span>
              </td>

              <!-- Opening Balance -->
              <td class="balance-cell">
                ${formatMoney(employee.balance)}
              </td>

              <!-- Actions -->
              <td>
                <div class="employee-actions">

                  <button
                    type="button"
                    class="edit-btn"
                    data-action="edit"
                    data-id="${employee.id}"
                    title="تعديل بيانات الموظف"
                    aria-label="تعديل ${esc(employee.name)}"
                  >
                    <span class="material-symbols-outlined">
                      edit
                    </span>
                  </button>

                  <button
                    type="button"
                    class="delete-btn"
                    data-action="delete"
                    data-id="${employee.id}"
                    title="حذف الموظف"
                    aria-label="حذف ${esc(employee.name)}"
                  >
                    <span class="material-symbols-outlined">
                      delete
                    </span>
                  </button>

                </div>
              </td>
            </tr>
          `,
        )
        .join("")
    : `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <span class="material-symbols-outlined">
                person_search
              </span>

              <h3>لا توجد نتائج</h3>

              <p>
                لم يتم العثور على موظفين مطابقين لعملية البحث.
              </p>
            </div>
          </td>
        </tr>
      `;
}

/* ========================================
   Employee Modal
   ======================================== */

// Open Employee Modal
function open(employee = null) {
  editId = employee?.id ?? null;

  $("#employeeForm").reset();

  $("#error").classList.add("hidden");

  // Modal Title
  $("#modalTitle").textContent = employee
    ? "تعديل بيانات الموظف"
    : "إضافة موظف جديد";

  // Fill Form
  fields.forEach((field) => {
    const input = $("#" + field);

    input.value = employee ? employee[field] : field === "balance" ? "0" : "";
  });

  // Show Modal
  $("#employeeModal").classList.remove("hidden");
  $("#employeeModal").classList.add("flex");

  // Disable Background Scroll
  document.body.classList.add("overflow-hidden");

  // Focus Employee Name
  $("#name").focus();
}

// Close Employee Modal
function close() {
  $("#employeeModal").classList.add("hidden");
  $("#employeeModal").classList.remove("flex");

  document.body.classList.remove("overflow-hidden");

  editId = null;
}

// New Employee Button
$("#newBtn").addEventListener("click", () => {
  open();
});

// Close Buttons
$("#closeModal").addEventListener("click", close);

$("#cancelModal").addEventListener("click", close);

/* ========================================
   Add / Update Employee
   ======================================== */

$("#employeeForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const employee = {};

  // Collect Form Data
  fields.forEach((field) => {
    const input = $("#" + field);

    employee[field] =
      field === "salary" || field === "balance"
        ? Number(input.value || 0)
        : input.value.trim();
  });

  // Validation
  if (
    !employee.name ||
    !employee.role ||
    !employee.mobile ||
    !employee.address
  ) {
    showError("أكمل الحقول المطلوبة من فضلك");
    return;
  }

  // Validate Salary and Balance
  if (
    !Number.isFinite(employee.salary) ||
    !Number.isFinite(employee.balance) ||
    employee.salary < 0 ||
    employee.balance < 0
  ) {
    showError("الراتب والرصيد يجب أن يكونا أرقامًا صحيحة");
    return;
  }

  // Validate Mobile
  if (!/^[0-9+\s()-]{8,20}$/.test(employee.mobile)) {
    showError("يرجى إدخال رقم موبايل صحيح");
    return;
  }

  // Update Existing Employee
  if (editId !== null) {
    data = data.map((item) =>
      item.id === editId
        ? {
            ...item,
            ...employee,
          }
        : item,
    );
  }

  // Add New Employee
  else {
    data.push({
      id: Date.now(),
      ...employee,
    });
  }

  // Save and Render
  save();

  draw();

  close();
});

// Show Form Error
function showError(message) {
  $("#error").textContent = message;

  $("#error").classList.remove("hidden");
}

/* ========================================
   Edit / Delete Employees
   ======================================== */

$("#rows").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);

  const employee = data.find((item) => item.id === id);

  if (!employee) return;

  // Edit Employee
  if (button.dataset.action === "edit") {
    open(employee);
  }

  // Delete Employee
  else if (button.dataset.action === "delete") {
    const confirmed = confirm(`هل أنت متأكد من حذف الموظف "${employee.name}"؟`);

    if (!confirmed) return;

    data = data.filter((item) => item.id !== id);

    save();

    draw();
  }
});

/* ========================================
   Search and Page Size
   ======================================== */

// Search
$("#search").addEventListener("input", draw);

// Page Size
$("#pageSize").addEventListener("change", draw);

/* ========================================
   Modal Events
   ======================================== */

// Close Modal When Clicking Outside
$("#employeeModal").addEventListener("mousedown", (event) => {
  if (event.target === $("#employeeModal")) {
    close();
  }
});

// Close Modal With Escape
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    close();
    closeLogin();
  }
});

/* ========================================
   Login Modal
   ======================================== */

// Show Login Modal
function showLogin() {
  const modal = $("#loginModal");

  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Close Login Modal
function closeLogin() {
  const modal = $("#loginModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// Login Button
// يتم ربطه فقط إذا كان موجودًا في HTML
const accountBtn = $("#accountBtn");

if (accountBtn) {
  accountBtn.addEventListener("click", showLogin);
}

// Close Login
const closeLoginBtn = $("#closeLogin");

if (closeLoginBtn) {
  closeLoginBtn.addEventListener("click", closeLogin);
}

// Close Login Modal When Clicking Outside
const loginModal = $("#loginModal");

if (loginModal) {
  loginModal.addEventListener("mousedown", (event) => {
    if (event.target === loginModal) {
      closeLogin();
    }
  });
}

// Login Form
const loginForm = $("#loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const loginMessage = $("#loginMessage");

    if (!loginMessage) return;

    loginMessage.textContent =
      "واجهة تجريبية: اربطها بخادم للتحقق من بيانات الحساب.";

    loginMessage.classList.remove("hidden");
  });
}

/* ========================================
   Initialize Application
   ======================================== */

draw();
