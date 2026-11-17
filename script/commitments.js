"use strict";
const KEY = "mizan-commitments-list",
  $ = (s) => document.querySelector(s);
const seed = [
  {
    id: 1,
    customerName: "بهاء سلطان",
    date: "2026-04-22",
    caseNumber: "555-20",
    amount: 100,
    commitment: "توثيق شهادة",
    statement: "توثيق شهادة",
  },
  {
    id: 2,
    customerName: "بهاء سلطان",
    date: "2026-01-07",
    caseNumber: "222-25",
    amount: 120,
    commitment: "مستخرج حكومي",
    statement: "مستخرج حكومي",
  },
];
const fields = [
  "customerName",
  "caseNumber",
  "date",
  "amount",
  "commitment",
  "statement",
];
let data = load(),
  editId = null,
  timer;
function load() {
  try {
    const x = localStorage.getItem(KEY);
    if (x === null) return [...seed];
    const v = JSON.parse(x);
    return Array.isArray(v) ? v : [...seed];
  } catch (e) {
    return [...seed];
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    toast("تعذر حفظ البيانات");
    return false;
  }
}
function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function money(v) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0);
}
function stats() {
  $("#totalCount").textContent = data.length.toLocaleString("en-US");
  $("#totalAmount").textContent =
    money(data.reduce((s, x) => s + (+x.amount || 0), 0)) + " ج.م";
  $("#customerCount").textContent = new Set(
    data.map((x) => x.customerName.trim()),
  ).size.toLocaleString("en-US");
}
function render() {
  stats();
  const q = $("#searchInput").value.trim().toLowerCase(),
    filtered = data.filter((x) =>
      [x.customerName, x.caseNumber, x.commitment, x.statement, x.date].some(
        (v) =>
          String(v || "")
            .toLowerCase()
            .includes(q),
      ),
    ),
    size = $("#pageSize").value,
    shown = size === "all" ? filtered : filtered.slice(0, +size);
  $("#resultsCount").textContent = filtered.length.toLocaleString("en-US");
  $("#shownCount").textContent = shown.length.toLocaleString("en-US");
  $("#tableBody").innerHTML = shown.length
    ? shown
        .map(
          (x) =>
            `<tr><td>${esc(x.customerName)}</td><td dir="ltr">${esc(x.date)}</td><td><span class="case">${esc(x.caseNumber)}</span></td><td class="money">${money(x.amount)} ج.م</td><td class="statement">${esc(x.statement || x.commitment)}</td><td><div class="row-actions"><button class="icon-btn edit" data-action="edit" data-id="${x.id}" title="تعديل"><span class="material-symbols-outlined">edit</span></button><button class="icon-btn delete" data-action="delete" data-id="${x.id}" title="حذف"><span class="material-symbols-outlined">delete</span></button></div></td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6"><div class="empty"><span class="material-symbols-outlined">search_off</span>لا توجد التزامات مطابقة</div></td></tr>`;
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.add("hidden"), 2500);
}
function open(item = null) {
  editId = item?.id ?? null;
  $("#commitmentForm").reset();
  $("#error").classList.add("hidden");
  $("#modalTitle").textContent = item ? "تعديل الالتزام" : "إضافة التزام";
  fields.forEach((f) => ($("#" + f).value = item ? (item[f] ?? "") : ""));
  $("#modal").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  $("#customerName").focus();
}
function close() {
  $("#modal").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  editId = null;
}
$("#addBtn").addEventListener("click", () => open());
$("#closeBtn").addEventListener("click", close);
$("#cancelBtn").addEventListener("click", close);
$("#modal").addEventListener("mousedown", (e) => {
  if (e.target === $("#modal")) close();
});
$("#commitmentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = {};
  fields.forEach(
    (f) =>
      (item[f] =
        f === "amount" ? Number($("#" + f).value) : $("#" + f).value.trim()),
  );
  if (
    !item.customerName ||
    !item.caseNumber ||
    !item.date ||
    !item.commitment
  ) {
    $("#error").textContent = "يرجى استكمال الحقول المطلوبة.";
    $("#error").classList.remove("hidden");
    return;
  }
  if (!Number.isFinite(item.amount) || item.amount < 0) {
    $("#error").textContent = "يرجى إدخال مبلغ صحيح لا يقل عن صفر.";
    $("#error").classList.remove("hidden");
    return;
  }
  if (editId !== null) {
    data = data.map((x) => (x.id === editId ? { ...x, ...item } : x));
  } else data.unshift({ id: Date.now(), ...item });
  if (!save()) return;
  render();
  close();
  toast(editId === null ? "تمت إضافة الالتزام" : "تم تحديث الالتزام");
});
$("#tableBody").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-action]");
  if (!b) return;
  const id = Number(b.dataset.id),
    item = data.find((x) => x.id === id);
  if (!item) return;
  if (b.dataset.action === "edit") open(item);
  else if (
    confirm(`هل أنت متأكد من حذف التزام العميل "${item.customerName}"؟`)
  ) {
    data = data.filter((x) => x.id !== id);
    save();
    render();
    toast("تم حذف الالتزام");
  }
});
$("#searchInput").addEventListener("input", render);
$("#pageSize").addEventListener("change", render);
let oldSize = null;
$("#printBtn").addEventListener("click", () => {
  oldSize = $("#pageSize").value;
  $("#pageSize").value = "all";
  render();
  window.print();
});
window.addEventListener("afterprint", () => {
  if (oldSize !== null) {
    $("#pageSize").value = oldSize;
    oldSize = null;
    render();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
render();
