const STORAGE_KEY = "suppliers-html-tailwind-data";

const sampleSuppliers = [
  {
    id: 1,
    name: "يحيى الغزناوي",
    mobile: "01012345678",
    address: "دمياط",
    balance: 125000,
  },
  {
    id: 2,
    name: "أبو بكر جرت",
    mobile: "01098765432",
    address: "القاهرة",
    balance: 87500,
  },
  {
    id: 3,
    name: "فؤاد خليل",
    mobile: "01122334455",
    address: "الإسكندرية",
    balance: 210000,
  },
  {
    id: 4,
    name: "محمود عبد العزيز",
    mobile: "01234567890",
    address: "الجيزة",
    balance: 150000,
  },
  {
    id: 5,
    name: "نجاح الموجي",
    mobile: "01099887766",
    address: "المنصورة",
    balance: 98750,
  },
];

const $ = (selector) => document.querySelector(selector);
const modal = $("#supplierModal");
const form = $("#supplierForm");
const nameInput = $("#supplierName");
const mobileInput = $("#supplierMobile");
const addressInput = $("#supplierAddress");
const balanceInput = $("#supplierBalance");
const errorBox = $("#formError");

let suppliers = loadSuppliers();
let editingId = null;
let isPrinting = false;

function loadSuppliers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : sampleSuppliers;
  } catch {
    return sampleSuppliers;
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  } catch {
    showError("تعذر حفظ البيانات في المتصفح. تأكد من تفعيل التخزين المحلي.");
  }
}

function formatNumber(value) {
  return window.MizanNumbers
    ? window.MizanNumbers.formatNumber(value, { maximumFractionDigits: 2 })
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
        Number(value) || 0,
      );
}

function escapeHTML(value) {
  return String(value).replace(
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
}

function renderSuppliers() {
  const term = $("#searchInput").value.trim().toLocaleLowerCase();
  const filtered = suppliers.filter((supplier) =>
    [supplier.code, supplier.name, supplier.mobile, supplier.address].some(
      (value) => String(value).toLocaleLowerCase().includes(term),
    ),
  );

  $("#totalSuppliers").textContent = formatNumber(suppliers.length);
  $("#totalBalance").textContent = formatNumber(
    suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0),
  );
  $("#resultCount").textContent = formatNumber(filtered.length);
  $("#footerCount").textContent = formatNumber(filtered.length);

  const pageSize = $("#pageSize").value;
  const visible =
    isPrinting || pageSize === "all"
      ? filtered
      : filtered.slice(0, Number(pageSize));
  const tbody = $("#suppliersTable");

  $("#printResultCount").textContent = formatNumber(filtered.length);
  $("#printTotalBalance").textContent = formatNumber(
    filtered.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0),
  );

  if (!visible.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-14 text-center">
      <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
      </div><p class="font-bold">لا توجد نتائج</p><p class="mt-1 text-slate-500">جرّب البحث بكلمة أخرى أو أضف موردًا جديدًا.</p>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = visible
    .map(
      (supplier) => `
    <tr class="transition hover:bg-blue-50/50">
      <td class="whitespace-nowrap px-5 py-4 font-semibold">${escapeHTML(supplier.name)}</td>
      <td class="whitespace-nowrap px-5 py-4 text-slate-600">${escapeHTML(supplier.address)}</td>
      <td class="whitespace-nowrap px-5 py-4 text-slate-600" dir="ltr">${escapeHTML(supplier.mobile)}</td>
      <td class="whitespace-nowrap px-5 py-4 font-semibold">${formatNumber(supplier.balance)} <span class="text-xs text-slate-400">ج.م</span></td>
      <td class="px-5 py-4"><div class="flex items-center justify-center gap-2">
        <button type="button" data-action="edit" data-id="${supplier.id}" title="تعديل المورد" class="rounded-lg bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100 focus:ring-2 focus:ring-blue-300">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
        </button>
        <button type="button" data-action="delete" data-id="${supplier.id}" title="حذف المورد" class="rounded-lg bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 focus:ring-2 focus:ring-rose-300">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2m-10 0 1 14h10l1-14M10 10v6m4-6v6"/></svg>
        </button>
      </div></td>
    </tr>`,
    )
    .join("");
}

function openModal(supplier = null) {
  editingId = supplier ? supplier.id : null;
  form.reset();
  errorBox.classList.add("hidden");
  errorBox.textContent = "";

  $("#modalTitle").textContent = supplier
    ? "تعديل بيانات المورد"
    : "إضافة مورد جديد";
  $("#saveSupplierBtn span").textContent = supplier
    ? "حفظ التعديلات"
    : "إضافة المورد";
  nameInput.value = supplier?.name ?? "";
  mobileInput.value = supplier?.mobile ?? "";
  addressInput.value = supplier?.address ?? "";
  balanceInput.value = supplier ? supplier.balance : "0";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
  setTimeout(() => nameInput.focus(), 50);
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
  editingId = null;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
}

function nextSupplierCode() {
  const highest = suppliers.reduce((max, supplier) => {
    const number = Number(String(supplier.code).replace(/\D/g, "")) || 0;
    return Math.max(max, number);
  }, 0);
  return `SUP${String(highest + 1).padStart(4, "0")}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const mobile = mobileInput.value.trim();
  const address = addressInput.value.trim();
  const balance = Number(balanceInput.value);

  if (!name || !mobile || !address) {
    showError("من فضلك أكمل اسم المورد والموبايل والعنوان.");
    return;
  }
  if (!/^[0-9+\s()-]{8,20}$/.test(mobile)) {
    showError("من فضلك أدخل رقم موبايل صحيحًا.");
    return;
  }
  if (!Number.isFinite(balance) || balance < 0) {
    showError("الرصيد الافتتاحي يجب أن يكون رقمًا يساوي صفرًا أو أكبر.");
    return;
  }

  if (editingId !== null) {
    suppliers = suppliers.map((supplier) =>
      supplier.id === editingId
        ? { ...supplier, name, mobile, address, balance }
        : supplier,
    );
  } else {
    suppliers.push({
      id: Date.now(),
      code: nextSupplierCode(),
      name,
      mobile,
      address,
      balance,
    });
  }

  saveToStorage();
  renderSuppliers();
  closeModal();
});

$("#addSupplierBtn").addEventListener("click", () => openModal());
$("#closeModalBtn").addEventListener("click", closeModal);
$("#cancelModalBtn").addEventListener("click", closeModal);
$("#searchInput").addEventListener("input", renderSuppliers);
$("#pageSize").addEventListener("change", renderSuppliers);
$("#printReportBtn").addEventListener("click", () => window.print());

window.addEventListener("beforeprint", () => {
  isPrinting = true;
  $("#printGeneratedAt").textContent = window.MizanNumbers
    ? window.MizanNumbers.formatDate(new Date(), "ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());
  renderSuppliers();
});

window.addEventListener("afterprint", () => {
  isPrinting = false;
  renderSuppliers();
});

$("#suppliersTable").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const supplier = suppliers.find((item) => item.id === id);
  if (!supplier) return;

  if (button.dataset.action === "edit") {
    openModal(supplier);
  } else if (button.dataset.action === "delete") {
    if (confirm(`هل تريد حذف المورد "${supplier.name}"؟`)) {
      suppliers = suppliers.filter((item) => item.id !== id);
      saveToStorage();
      renderSuppliers();
    }
  }
});

modal.addEventListener("mousedown", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden"))
    closeModal();
});

renderSuppliers();
