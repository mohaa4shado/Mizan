(function () {
  function getEls() {
    return {
      overlayEl: document.getElementById("overlay"),
      modalEl: document.getElementById("modal"),
      modalTitleEl: document.getElementById("modalTitle"),
      modalContentEl: document.getElementById("modalContent"),
    };
  }

  function openNotifications() {
    const { overlayEl, modalEl, modalTitleEl, modalContentEl } = getEls();
    if (!overlayEl || !modalEl || !modalTitleEl || !modalContentEl) return;

    modalTitleEl.innerText = "الإشعارات";

    modalContentEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-start gap-3 p-3 rounded-xl bg-sky-50/60 border border-sky-100/70">
          <span class="material-symbols-outlined text-primary" aria-hidden="true">notifications_active</span>

          <div class="text-sm">
            <p class="font-bold text-on-background">لديك إشعار جديد</p>
            <p class="text-on-surface-variant">تم تحديث حالة بعض الطلبات.</p>
          </div>
          <span class="text-xs text-slate-500 mr-auto">الآن</span>
        </div>

        <div class="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-sky-100/70">
          <span class="material-symbols-outlined text-secondary" aria-hidden="true">campaign</span>

          <div class="text-sm">
            <p class="font-bold text-on-background">تذكير</p>
            <p class="text-on-surface-variant">يرجى مراجعة الإشعارات غير المقروءة.</p>
          </div>
          <span class="text-xs text-slate-500 mr-auto">قبل ساعة</span>
        </div>
      </div>
    `;

    overlayEl.classList.remove("hidden");
    modalEl.classList.remove("hidden");

    // animate: make overlay visible + modal pop
    setTimeout(() => {
      overlayEl.classList.add("opacity-100");
      overlayEl.classList.remove("opacity-0");
      modalEl.classList.add("opacity-100");
      modalEl.classList.remove("opacity-0", "scale-95");
      modalEl.classList.add("scale-100");
    }, 10);

    document.body.style.overflow = "hidden";
  }

  function closeNotificationsModal() {
    const { overlayEl, modalEl } = getEls();
    if (!overlayEl || !modalEl) return;

    overlayEl.classList.remove("opacity-100");
    overlayEl.classList.add("opacity-0");
    modalEl.classList.remove("opacity-100", "scale-100");
    modalEl.classList.add("opacity-0", "scale-95");

    setTimeout(() => {
      overlayEl.classList.add("hidden");
      modalEl.classList.add("hidden");
      document.body.style.overflow = "auto";
    }, 300);
  }

  // Expose to window so index.html inline wiring can call it
  window.openNotifications = openNotifications;
  window.closeModal = closeNotificationsModal;
})();

(function () {
  const notificationBtn = document
    .querySelector('span[data-icon="notifications"]')
    ?.closest("button");
  if (!notificationBtn) return;

  notificationBtn.addEventListener("click", function () {
    if (typeof openNotifications === "function") {
      openNotifications();
    }
  });

  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn && typeof closeModal === "function") {
    closeBtn.addEventListener("click", closeModal);
  }

  const overlayEl = document.getElementById("overlay");
  if (overlayEl) {
    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl && typeof closeModal === "function") {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && typeof closeModal === "function") {
      closeModal();
    }
  });
})();
