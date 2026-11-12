
// ======================================
// Elements
// ======================================

const backdrop = document.getElementById('modalBackdrop');
const form = document.getElementById('agencyForm');
const tableBody = document.getElementById('agencyTable');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const recordCount = document.getElementById('recordCount');
const toast = document.getElementById('toast');

const modalTitle = document.getElementById('modalTitle');
const saveButton = document.getElementById('saveButton');

let editingRow = null;
let toastTimer;


// ======================================
// Modal Functions
// ======================================

function openModal() {

  backdrop.classList.add('open');

  backdrop.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('clientName').focus();
  }, 80);

}


function closeModal() {

  backdrop.classList.remove('open');

  backdrop.setAttribute('aria-hidden', 'true');

  document.body.style.overflow = '';

}


document.getElementById('openModal').addEventListener('click', () => {

  resetForm();

  openModal();

});


document.getElementById('closeModal').addEventListener('click', closeModal);

document.getElementById('cancelModal').addEventListener('click', closeModal);


backdrop.addEventListener('click', event => {

  if (event.target === backdrop) {
    closeModal();
  }

});


document.addEventListener('keydown', event => {

  if (
    event.key === 'Escape' &&
    backdrop.classList.contains('open')
  ) {
    closeModal();
  }

});


// ======================================
// Reset Form
// ======================================

function resetForm() {

  form.reset();

  editingRow = null;

  modalTitle.textContent = 'إضافة توكيل جديد';

  saveButton.textContent = 'حفظ التوكيل';

  document.getElementById('agencyDate').value =
    new Date().toLocaleDateString('en-CA');

}


// ======================================
// Escape HTML
// ======================================

function escapeHTML(value) {

  return String(value).replace(/[&<>"']/g, char => ({

    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'

  }[char]));

}


// ======================================
// Type Badge
// ======================================

function typeBadge(type) {

  const colors =
    type === 'رسمي خاص'
      ? 'bg-violet-50 text-violet-700'
      : type === 'رسمي عام قضايا'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-blue-700';

  return `
    <span class="rounded-full ${colors} px-3 py-1 text-xs font-bold">
      ${escapeHTML(type)}
    </span>
  `;

}


// ======================================
// Add Action Buttons
// ======================================

function addActionButtons(row) {

  const actionCell = document.createElement('td');

  actionCell.className = 'no-print';

  actionCell.innerHTML = `

    <div class="actions">

      <button
        type="button"
        class="btn-edit edit-agency"
        title="تعديل التوكيل">

        ✎ تعديل

      </button>

      <button
        type="button"
        class="btn-delete delete-agency"
        title="حذف التوكيل">

        🗑 حذف

      </button>

    </div>

  `;

  row.appendChild(actionCell);

}


// Add actions to existing records

[...tableBody.rows].forEach(row => {

  row.dataset.agencyNumber = row.cells[1].textContent.trim();

  row.dataset.agencyDate =
    row.cells[2].textContent.trim().replaceAll('/', '-');

  row.dataset.agencyType =
    row.cells[3].textContent.trim();

  addActionButtons(row);

});


// ======================================
// Edit Agency
// ======================================

function editAgency(row) {

  editingRow = row;

  const data = row.dataset;

  document.getElementById('clientName').value =
    row.cells[0].textContent.trim();

  document.getElementById('agencyNumber').value =
    data.agencyNumber || row.cells[1].textContent.trim();

  document.getElementById('agencyDate').value =
    data.agencyDate || '';

  document.getElementById('agencyType').value =
    data.agencyType || row.cells[3].textContent.trim();

  document.getElementById('notarizationPlace').value =
    data.place || '';

  document.getElementById('numberPart').value =
    data.number || '';

  document.getElementById('letterPart').value =
    data.letter || '';

  document.getElementById('yearPart').value =
    data.year || '';

  modalTitle.textContent = 'تعديل بيانات التوكيل';

  saveButton.textContent = 'حفظ التعديلات';

  openModal();

}


// ======================================
// Delete Agency
// ======================================

function deleteAgency(row) {

  const clientName = row.cells[0].textContent.trim();

  const confirmed = confirm(
    `هل أنت متأكد من حذف توكيل العميل "${clientName}"؟\n\nلا يمكن التراجع عن هذه العملية.`
  );

  if (!confirmed) return;

  // Remove record

  row.remove();

  // Update table

  applySearch();

  // Notification

  showToast('تم حذف التوكيل بنجاح');

}


// ======================================
// Table Actions (Event Delegation)
// ======================================

tableBody.addEventListener('click', event => {

  const editButton = event.target.closest('.edit-agency');

  const deleteButton = event.target.closest('.delete-agency');

  if (editButton) {

    const row = editButton.closest('tr');

    editAgency(row);

  }

  if (deleteButton) {

    const row = deleteButton.closest('tr');

    deleteAgency(row);

  }

});


// ======================================
// Search
// ======================================

function applySearch() {

  const term = searchInput.value
    .trim()
    .toLocaleLowerCase('ar');

  let visible = 0;

  [...tableBody.rows].forEach(row => {

    const match = row.textContent
      .toLocaleLowerCase('ar')
      .includes(term);

    row.hidden = !match;

    if (match) {
      visible++;
    }

  });

  recordCount.textContent = visible;

  emptyState.classList.toggle('hidden', visible !== 0);

}


searchInput.addEventListener('input', applySearch);


// ======================================
// Toast Notification
// ======================================

function showToast(message) {

  toast.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    toast.classList.remove('show');

  }, 2600);

}


// ======================================
// Add / Update Agency
// ======================================

form.addEventListener('submit', event => {

  event.preventDefault();

  if (!form.reportValidity()) return;

  const data = new FormData(form);

  const client = data.get('clientName').trim();

  const agencyNumber = data.get('agencyNumber').trim();

  const date = data.get('agencyDate');

  const type = data.get('agencyType');

  const place = data.get('notarizationPlace').trim();

  const number = data.get('numberPart').trim();

  const letter = data.get('letterPart').trim();

  const year = data.get('yearPart').trim();


  const numberParts = [
    number,
    letter,
    year,
    place
  ].filter(Boolean).join(' / ');

  const displayNumber = numberParts || agencyNumber;


  // ==================================
  // Update Existing Record
  // ==================================

  if (editingRow) {

    const row = editingRow;

    row.cells[0].textContent = client;

    row.cells[1].textContent = displayNumber;

    row.cells[2].textContent = date.replaceAll('-', '/');

    row.cells[3].innerHTML = typeBadge(type);

    // Store original data

    row.dataset.agencyNumber = agencyNumber;

    row.dataset.agencyDate = date;

    row.dataset.agencyType = type;

    row.dataset.place = place;

    row.dataset.number = number;

    row.dataset.letter = letter;

    row.dataset.year = year;

    resetForm();

    closeModal();

    applySearch();

    showToast('تم تعديل بيانات التوكيل بنجاح');

    return;

  }


  // ==================================
  // Add New Record
  // ==================================

  const row = document.createElement('tr');

  row.innerHTML = `

    <td class="font-bold text-slate-700">
      ${escapeHTML(client)}
    </td>

    <td>
      ${escapeHTML(displayNumber)}
    </td>

    <td>
      ${escapeHTML(date.replaceAll('-', '/'))}
    </td>

    <td>
      ${typeBadge(type)}
    </td>

  `;


  // Save original data

  row.dataset.agencyNumber = agencyNumber;

  row.dataset.agencyDate = date;

  row.dataset.agencyType = type;

  row.dataset.place = place;

  row.dataset.number = number;

  row.dataset.letter = letter;

  row.dataset.year = year;


  // Add edit and delete buttons

  addActionButtons(row);


  // Add row to table

  tableBody.prepend(row);


  resetForm();

  closeModal();

  searchInput.value = '';

  applySearch();

  showToast('تمت إضافة التوكيل بنجاح');

});


// ======================================
// Print PDF
// ======================================

document.getElementById('printPDF').addEventListener('click', () => {

  // Remove search filter before printing

  searchInput.value = '';

  applySearch();

  // Open browser print window

  window.print();

});


// ======================================
// Initialize
// ======================================

resetForm();

applySearch();
