
/* =========================================
   MIZAN LOGIN PAGE
========================================= */

const $ = (id) => document.getElementById(id);

// Main Elements
const form = $("loginForm");
const username = $("username");
const password = $("password");
const message = $("formMessage");

const button = $("loginButton");
const buttonText = $("loginButtonText");
const spinner = $("loginSpinner");

let toastTimer;

/* =========================================
   DARK / LIGHT MODE
========================================= */

const themeToggle = $("themeToggle");
const themeLabel = $("themeLabel");
const themeIcon = $("themeIcon");
const themeMeta = $("themeColorMeta");

function applyTheme(theme) {
  const isLight = theme === "light";

  document.body.classList.toggle("light-mode", isLight);

  document.documentElement.style.colorScheme = isLight
    ? "light"
    : "dark";

  themeMeta.setAttribute(
    "content",
    isLight ? "#f3f5f7" : "#111820"
  );

  themeLabel.textContent = isLight
    ? "الوضع الداكن"
    : "الوضع الفاتح";

  themeToggle.setAttribute(
    "aria-label",
    isLight
      ? "التبديل إلى الوضع الداكن"
      : "التبديل إلى الوضع الفاتح"
  );

  themeIcon.innerHTML = isLight
    ? `
      <path
        d="M20.9 13A8.5 8.5 0 0 1 11 3.1
        8.5 8.5 0 1 0 20.9 13Z"
      />
    `
    : `
      <circle cx="12" cy="12" r="4"/>
      <path d="
        M12 2v2
        m0 16v2
        M4.93 4.93l1.42 1.42
        m11.3 11.3 1.42 1.42
        M2 12h2
        m16 0h2
        M4.93 19.07l1.42-1.42
        m11.3-11.3 1.42-1.42
      "/>
    `;

  try {
    localStorage.setItem("mizanTheme", theme);
  } catch (error) {
    console.warn("Could not save theme preference.");
  }
}

// Load Saved Theme

let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem("mizanTheme") || "dark";
} catch (error) {
  savedTheme = "dark";
}

applyTheme(savedTheme);

// Toggle Theme

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("light-mode")
    ? "dark"
    : "light";

  applyTheme(nextTheme);
});

/* =========================================
   TOAST NOTIFICATION
========================================= */

function showToast(text) {
  const toast = $("toast");

  toast.textContent = text;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}

/* =========================================
   FIELD VALIDATION
========================================= */

function setFieldError(field, errorId, hasError) {
  $(errorId).classList.toggle("hidden", !hasError);

  field.setAttribute("aria-invalid", String(hasError));

  field.classList.toggle("ring-2", hasError);
  field.classList.toggle("ring-rose-500/50", hasError);
}

function showFormMessage(text, type = "error") {
  message.textContent = text;

  message.className = "rounded-lg border px-4 py-3 text-sm";

  if (type === "success") {
    message.classList.add(
      "border-emerald-500/30",
      "bg-emerald-500/10",
      "text-emerald-500"
    );
  } else {
    message.classList.add(
      "border-rose-500/30",
      "bg-rose-500/10",
      "text-rose-500"
    );
  }

  message.classList.remove("hidden");
}

/* =========================================
   SHOW / HIDE PASSWORD
========================================= */

$("togglePassword").addEventListener("click", () => {
  const isHidden = password.type === "password";

  password.type = isHidden ? "text" : "password";

  $("togglePassword").setAttribute(
    "aria-label",
    isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
  );

  $("eyeIcon").innerHTML = isHidden
    ? `
      <path d="M3 3 21 21"/>
      <path d="
        M10.6 10.6a2 2 0 0 0 2.8 2.8
        M9.9 5.2A10.7 10.7 0 0 1 12 5
        c6.5 0 10 7 10 7
        a16 16 0 0 1-3.1 3.8
        M6.2 6.2C3.5 8 2 12 2 12
        s3.5 7 10 7a10 10 0 0 0 4-.8
      "/>
    `
    : `
      <path d="
        M2 12s3.5-7 10-7
        10 7 10 7
        -3.5 7-10 7
        S2 12 2 12Z
      "/>
      <circle cx="12" cy="12" r="3"/>
    `;
});

/* =========================================
   CLEAR ERRORS WHILE TYPING
========================================= */

username.addEventListener("input", () => {
  setFieldError(username, "usernameError", false);
  message.classList.add("hidden");
});

password.addEventListener("input", () => {
  setFieldError(password, "passwordError", false);
  message.classList.add("hidden");
});

/* =========================================
   REMEMBER USERNAME
========================================= */

const rememberMe = $("rememberMe");

try {
  const savedUsername = sessionStorage.getItem(
    "mizanRememberUsername"
  );

  if (savedUsername) {
    username.value = savedUsername;
    rememberMe.checked = true;
  }
} catch (error) {
  console.warn("Could not load saved username.");
}

/* =========================================
   LOGIN FORM
========================================= */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.classList.add("hidden");

  const usernameInvalid = !username.value.trim();
  const passwordInvalid = !password.value;

  setFieldError(
    username,
    "usernameError",
    usernameInvalid
  );

  setFieldError(
    password,
    "passwordError",
    passwordInvalid
  );

  // Stop if fields are empty

  if (usernameInvalid || passwordInvalid) {
    showFormMessage(
      "يرجى إدخال اسم المستخدم وكلمة المرور للمتابعة."
    );

    (usernameInvalid ? username : password).focus();

    return;
  }

  // Loading State

  button.disabled = true;

  button.classList.add(
    "cursor-wait",
    "opacity-80"
  );

  buttonText.textContent = "PLEASE WAIT...";

  spinner.classList.remove("hidden");

  try {
    // Demo delay only.
    // Replace this with your actual authentication API.

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Remember Username

    if (rememberMe.checked) {
      try {
        sessionStorage.setItem(
          "mizanRememberUsername",
          username.value.trim()
        );
      } catch (error) {
        console.warn("Could not save username.");
      }
    } else {
      try {
        sessionStorage.removeItem("mizanRememberUsername");
      } catch (error) {
        console.warn("Could not remove saved username.");
      }
    }

    // Demo success message

    showFormMessage(
       " تم التسجيل بنجاح ",
      "success"
    );

  } catch (error) {
    showFormMessage(
      "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
    );

  } finally {
    button.disabled = false;

    button.classList.remove(
      "cursor-wait",
      "opacity-80"
    );

    buttonText.textContent = "LOGIN";

    spinner.classList.add("hidden");
  }
});

/* =========================================
   FORGOT PASSWORD MODAL
========================================= */

const modal = $("forgotModal");
const forgotPassword = $("forgotPassword");
const closeModalButton = $("closeModal");
const resetForm = $("resetForm");

function openModal() {
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  setTimeout(() => {
    $("email").focus();
  }, 100);
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  forgotPassword.focus();
}

// Open Modal

forgotPassword.addEventListener("click", openModal);

// Close Modal

closeModalButton.addEventListener("click", closeModal);

// Close When Clicking Outside

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Close With Escape

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !modal.classList.contains("hidden")
  ) {
    closeModal();
  }
});

/* =========================================
   RESET PASSWORD FORM
========================================= */

resetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("email");
  const emailError = $("emailError");
  const resetMessage = $("resetMessage");

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.value.trim()
  );

  emailError.classList.toggle("hidden", valid);

  email.setAttribute("aria-invalid", String(!valid));

  resetMessage.classList.add("hidden");

  if (!valid) {
    email.focus();
    return;
  }

  resetMessage.textContent =
    "تم التحقق من البريد الإلكتروني بنجاح. "
  resetMessage.classList.remove("hidden");
});

// Clear Email Error

$("email").addEventListener("input", () => {
  $("emailError").classList.add("hidden");
  $("email").setAttribute("aria-invalid", "false");
});
