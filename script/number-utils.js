"use strict";

/**
 * MIZAN - Global English Number Standardization
 * ------------------------------------------------
 * Single source of truth for converting Arabic-Indic (٠-٩) and Persian (۰-۹)
 * digits to English digits (0-9) across every page of the application.
 *
 * Responsibilities:
 *   1. Convert digits in existing LocalStorage values (without changing keys,
 *      structures, or deleting records).
 *   2. Convert digits while the user types (text, tel, number, search, etc.),
 *      preserving the caret position and never touching non-digit text.
 *   3. Convert digits in all rendered DOM text (tables, cards, modals,
 *      notifications, print views, JS-generated content) via a MutationObserver.
 *   4. Expose reusable helpers (window.MizanNumbers / window.toEnglishNumbers).
 *
 * The application stays Arabic / RTL. Only the digit characters are changed.
 */
(function (global) {
  const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const FOREIGN_DIGIT_GLOBAL = /[٠-٩۰-۹]/g;
  const FOREIGN_DIGIT_TEST = /[٠-٩۰-۹]/;
  const TEXT_ATTRIBUTES = ["title", "placeholder", "aria-label", "alt"];
  const SEGMENTED_INPUT_TYPES = new Set(["date", "time", "datetime-local", "month", "week"]);

  /** Convert every Arabic-Indic / Persian digit in a value to an English digit. */
  function toEnglishNumbers(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(FOREIGN_DIGIT_GLOBAL, (digit) => {
      const arabicIndex = ARABIC_DIGITS.indexOf(digit);
      if (arabicIndex !== -1) return String(arabicIndex);
      const persianIndex = PERSIAN_DIGITS.indexOf(digit);
      if (persianIndex !== -1) return String(persianIndex);
      return digit;
    });
  }

  /** True when the value contains at least one non-English digit. */
  function hasForeignDigits(value) {
    return FOREIGN_DIGIT_TEST.test(String(value ?? ""));
  }

  /** Locale-independent number formatting that always yields English digits. */
  function formatNumber(value, options) {
    try {
      return toEnglishNumbers(
        new Intl.NumberFormat("en-US", options || {}).format(Number(value) || 0),
      );
    } catch {
      return toEnglishNumbers(String(Number(value) || 0));
    }
  }

  /**
   * Date formatting that keeps the requested locale's text (e.g. Arabic month
   * names) while guaranteeing English digits in the result.
   */
  function formatDate(value, locale = "en-GB", options) {
    if (value === null || value === undefined || value === "") return "";
    try {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return toEnglishNumbers(value);
      return toEnglishNumbers(new Intl.DateTimeFormat(locale, options).format(date));
    } catch {
      return toEnglishNumbers(value);
    }
  }

  /* =========================================================
     Existing stored data (safe, in-place, idempotent migration)
     ========================================================= */

  function normalizeDeep(value, seen) {
    if (typeof value === "string") return toEnglishNumbers(value);
    if (Array.isArray(value)) {
      if (seen.has(value)) return value;
      seen.add(value);
      return value.map((item) => normalizeDeep(item, seen));
    }
    if (value && typeof value === "object") {
      if (seen.has(value)) return value;
      seen.add(value);
      const result = {};
      // Object keys / data structure are deliberately left untouched.
      Object.keys(value).forEach((key) => {
        result[key] = normalizeDeep(value[key], seen);
      });
      return result;
    }
    return value;
  }

  function migrateStorage() {
    let migrated = 0;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }

      keys.forEach((key) => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw || !hasForeignDigits(raw)) return;

          let nextRaw;
          try {
            nextRaw = JSON.stringify(normalizeDeep(JSON.parse(raw), new WeakSet()));
          } catch {
            // Plain (non-JSON) values: convert the string itself.
            nextRaw = toEnglishNumbers(raw);
          }

          if (nextRaw !== raw) {
            localStorage.setItem(key, nextRaw); // same key, same structure
            migrated += 1;
          }
        } catch {
          /* A single inaccessible/quota-blocked key must not stop the rest. */
        }
      });
    } catch {
      /* LocalStorage may be unavailable in restricted contexts. */
    }
    return migrated;
  }

  /* =========================================================
     Live user input
     ========================================================= */

  function isSkipField(element) {
    return !!(
      element &&
      (element.hasAttribute?.("data-mizan-number-skip") ||
        element.getAttribute?.("autocomplete") === "current-password" ||
        element.getAttribute?.("autocomplete") === "new-password")
    );
  }

  function isEditable(element) {
    if (!element || element.nodeType !== 1 || isSkipField(element)) return false;
    const tag = element.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || element.isContentEditable === true;
  }

  function normalizeFieldValue(element) {
    if (!isEditable(element) || element.isComposing) return;
    const tag = element.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      let value;
      try {
        value = element.value;
      } catch {
        return;
      }
      if (typeof value !== "string" || !hasForeignDigits(value)) return;

      const converted = toEnglishNumbers(value);
      let start = null;
      let end = null;
      try {
        start = element.selectionStart;
        end = element.selectionEnd;
      } catch {
        /* Some input types do not expose a selection. */
      }
      try {
        element.value = converted;
      } catch {
        return;
      }
      if (start !== null && end !== null) {
        try {
          element.setSelectionRange(start, end);
        } catch {
          /* Unsupported on number/date inputs; value is already converted. */
        }
      }
    } else {
      // contenteditable - text nodes are also handled by the DOM observer.
      const text = element.textContent;
      if (text && hasForeignDigits(text)) element.textContent = toEnglishNumbers(text);
    }
  }

  function insertDigitAtCursor(element, digit) {
    const tag = element.tagName.toLowerCase();
    try {
      const start = element.selectionStart ?? element.value.length;
      const end = element.selectionEnd ?? start;
      if (typeof element.setRangeText === "function") {
        element.setRangeText(digit, start, end, "end");
      } else {
        element.value = element.value.slice(0, start) + digit + element.value.slice(end);
      }
    } catch {
      // Segmented inputs (e.g. type=date) may reject setRangeText.
      try {
        element.value = element.value + digit;
      } catch {
        return;
      }
    }
    element.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }

  function installInputHandlers() {
    // Keydown: convert a single typed Arabic/Persian digit *before* insertion,
    // which also covers inputs that only accept ASCII (type=number).
    document.addEventListener(
      "keydown",
      (event) => {
        const element = event.target;
        if (!isEditable(element) || event.isComposing) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const key = event.key;
        if (!key || key.length !== 1 || !hasForeignDigits(key)) return;
        if (
          element.tagName.toLowerCase() === "input" &&
          SEGMENTED_INPUT_TYPES.has((element.type || "").toLowerCase())
        ) {
          return; // Let the browser's native segmented date/time editor work.
        }
        event.preventDefault();
        insertDigitAtCursor(element, toEnglishNumbers(key));
      },
      true,
    );

    // Input/change/IME/focus: normalize whatever actually reached the field.
    const handleValueEvent = (event) => {
      const element = event.target;
      if (!isEditable(element)) return;
      if (event.isComposing || (event.inputType || "").indexOf("composition") === 0) return;
      normalizeFieldValue(element);
    };
    ["input", "change", "focusin", "blur", "compositionend"].forEach((type) => {
      document.addEventListener(type, handleValueEvent, true);
    });
  }

  /* =========================================================
     Rendered DOM (tables, cards, modals, print, notifications)
     ========================================================= */

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== 3) return;
    const value = node.nodeValue;
    if (value && hasForeignDigits(value)) node.nodeValue = toEnglishNumbers(value);
  }

  function normalizeAttributes(element) {
    if (!element || element.nodeType !== 1) return;
    TEXT_ATTRIBUTES.forEach((name) => {
      const value = element.getAttribute?.(name);
      if (value && hasForeignDigits(value)) element.setAttribute(name, toEnglishNumbers(value));
    });
  }

  /** Normalize a newly inserted subtree (all nested text, fields and attributes). */
  function normalizeElement(element) {
    if (!element || element.nodeType !== 1) return;
    if (element.hasAttribute?.("data-mizan-number-skip")) return;

    const tag = element.tagName.toLowerCase();
    normalizeAttributes(element);
    if (tag === "script" || tag === "style") return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && !isSkipField(parent)) {
        const parentTag = parent.tagName.toLowerCase();
        if (parentTag !== "script" && parentTag !== "style") normalizeTextNode(node);
      }
      node = walker.nextNode();
    }

    if (tag === "input" || tag === "textarea") normalizeFieldValue(element);
    if (element.querySelectorAll) {
      element.querySelectorAll("input, textarea").forEach(normalizeFieldValue);
    }
  }

  function normalizeDom() {
    if (!document.body) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || isSkipField(parent)) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
        return hasForeignDigits(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(normalizeTextNode);

    document
      .querySelectorAll("[" + TEXT_ATTRIBUTES.join("], [") + "]")
      .forEach(normalizeAttributes);
    document.querySelectorAll("input, textarea").forEach(normalizeFieldValue);
  }

  function observeDom() {
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "characterData") {
          normalizeTextNode(record.target);
          return;
        }
        if (record.type !== "childList") return;
        record.addedNodes.forEach((node) => {
          if (node.nodeType === 3) normalizeTextNode(node);
          else if (node.nodeType === 1) normalizeElement(node);
        });
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  /* =========================================================
     Public API / boot
     ========================================================= */

  global.MizanNumbers = {
    toEnglishNumbers,
    hasForeignDigits,
    formatNumber,
    formatDate,
    migrateStorage,
    normalizeDom,
    normalizeElement,
    normalizeFieldValue,
  };
  // Convenience global matching the requested utility name.
  global.toEnglishNumbers = toEnglishNumbers;

  // Run storage migration as early as possible (this script is loaded first).
  migrateStorage();
  installInputHandlers();

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        migrateStorage();
        normalizeDom();
        observeDom();
      },
      { once: true },
    );
  } else {
    normalizeDom();
    observeDom();
  }

  // Refresh before printing and when returning to the tab (data may have
  // changed in another tab or been injected by another script).
  window.addEventListener("beforeprint", () => {
    migrateStorage();
    normalizeDom();
  });
  window.addEventListener("pageshow", normalizeDom);
  window.addEventListener("focus", () => {
    migrateStorage();
    normalizeDom();
  });
  window.addEventListener("storage", () => {
    migrateStorage();
    normalizeDom();
  });
})(window);
