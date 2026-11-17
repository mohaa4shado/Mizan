        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-bright": "#f2f7ff",
                        "outline-variant": "#8fb1d2",
                        "primary-fixed-dim": "#00abeb",
                        "on-surface-variant": "#3d5f7c",
                        "tertiary-fixed": "#86fea7",
                        "primary-dim": "#005578",
                        "error-dim": "#9f0519",
                        "inverse-surface": "#000f1d",
                        "surface-container-lowest": "#ffffff",
                        "on-primary": "#e8f4ff",
                        "on-secondary-fixed": "#463600",
                        "surface-container-high": "#cde5ff",
                        "surface-tint": "#006289",
                        "error": "#b31b25",
                        "on-secondary": "#fff2d4",
                        "surface-container-low": "#e8f2ff",
                        "inverse-on-surface": "#7fa0c1",
                        "on-background": "#08314d",
                        "surface-dim": "#b2d8ff",
                        "surface-variant": "#c2e0ff",
                        "surface-container": "#d8eaff",
                        "on-primary-container": "#003248",
                        "on-error-container": "#570008",
                        "tertiary-container": "#86fea7",
                        "background": "#f2f7ff",
                        "on-secondary-fixed-variant": "#675200",
                        "primary-container": "#00baff",
                        "on-tertiary-container": "#00612f",
                        "on-secondary-container": "#5c4900",
                        "secondary": "#705900",
                        "on-primary-fixed-variant": "#003c55",
                        "secondary-dim": "#624d00",
                        "error-container": "#fb5151",
                        "secondary-container": "#fdd34d",
                        "outline": "#587a99",
                        "tertiary-fixed-dim": "#78ef9a",
                        "inverse-primary": "#00baff",
                        "on-surface": "#08314d",
                        "on-tertiary": "#cdffd4",
                        "tertiary": "#006a34",
                        "secondary-fixed": "#fdd34d",
                        "on-primary-fixed": "#001723",
                        "surface-container-highest": "#c2e0ff",
                        "surface": "#f2f7ff",
                        "on-error": "#ffefee",
                        "on-tertiary-fixed-variant": "#006c35",
                        "tertiary-dim": "#005c2d",
                        "primary": "#006289",
                        "secondary-fixed-dim": "#eec540",
                        "primary-fixed": "#00baff",
                        "on-tertiary-fixed": "#004c23"
                    },
                    "borderRadius": {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    },
                    "fontFamily": {
                        "headline": ["Tajawal", "Plus Jakarta Sans"],
                        "display": ["Tajawal", "Plus Jakarta Sans"],
                        "body": ["Tajawal", "Plus Jakarta Sans"],
                        "label": ["Tajawal", "Plus Jakarta Sans"]
                    }
                },
            },
        };

/* =========================================
   MIZAN Dashboard - Live Statistics Cards
   - Clients card: fixed IDs and Egypt-local weekly calculation using client creation date only
   - Cases/Sessions cards: keep existing behavior/IDs unchanged
========================================= */
(function () {
  "use strict";

  const KEYS = {
    clients: "members",
    cases: "mizan_cases",
    sessions: "mizan-sessions-list",
  };

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function formatNumber(value) {
    // Centralized English-digit formatting (MizanNumbers is loaded first).
    if (window.MizanNumbers) return window.MizanNumbers.formatNumber(value);
    try {
      return new Intl.NumberFormat("en-US").format(Number(value) || 0);
    } catch {
      return String(Number(value) || 0);
    }
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* ---------- Shared (cases/sessions existing logic) ---------- */
  function getWeekRanges(now = new Date()) {
    const today = startOfDay(now);
    const day = today.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7; // Monday start
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - diffToMonday);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7); // exclusive
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(thisWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(thisWeekStart);
    return { thisWeekStart, thisWeekEnd, prevWeekStart, prevWeekEnd };
  }

  function parseDateValue(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value) ? null : value;
    const str = String(value).trim();
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return isNaN(d) ? null : d;
    }
    const d = new Date(str);
    return isNaN(d) ? null : d;
  }

  function inRange(date, start, endExclusive) {
    if (!date) return false;
    const t = date.getTime();
    return t >= start.getTime() && t < endExclusive.getTime();
  }

  function countByDate(items, getDate, ranges) {
    let thisWeek = 0;
    let prevWeek = 0;
    items.forEach((item) => {
      const d = parseDateValue(getDate(item));
      if (!d) return;
      const day = startOfDay(d);
      if (inRange(day, ranges.thisWeekStart, ranges.thisWeekEnd)) thisWeek += 1;
      else if (inRange(day, ranges.prevWeekStart, ranges.prevWeekEnd)) prevWeek += 1;
    });
    return { thisWeek, prevWeek };
  }

  function getChange(current, previous) {
    if (current === 0 && previous === 0) {
      return { label: "0%", icon: "trending_flat", state: "neutral", title: "لا يوجد تغيير (0 هذا الأسبوع، 0 الأسبوع الماضي)" };
    }
    if (previous === 0 && current > 0) {
      return { label: "جديد", icon: "trending_up", state: "up", title: `زيادة جديدة: ${current} هذا الأسبوع مقابل 0 الأسبوع الماضي` };
    }
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct * 10) / 10;
    const abs = Math.abs(rounded);
    const formatted = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
    if (rounded > 0) {
      return { label: `${formatted}%`, icon: "trending_up", state: "up", title: `ارتفاع بنسبة ${formatted}% مقارنة بالأسبوع الماضي` };
    }
    if (rounded < 0) {
      return { label: `${formatted}%`, icon: "trending_down", state: "down", title: `انخفاض بنسبة ${formatted}% مقارنة بالأسبوع الماضي` };
    }
    return { label: "0%", icon: "trending_flat", state: "neutral", title: "لا يوجد تغيير مقارنة بالأسبوع الماضي" };
  }

  function setBadge(badgeId, iconId, textId, change) {
    const badge = document.getElementById(badgeId);
    const icon = document.getElementById(iconId);
    const text = document.getElementById(textId);
    if (!badge || !icon || !text) return;

    icon.textContent = change.icon;
    text.textContent = change.label;

    const up = "bg-emerald-50 text-emerald-600";
    const down = "bg-red-50 text-red-600";
    const neutral = "bg-slate-100 text-slate-600";
    badge.classList.remove(
      "bg-emerald-50", "text-emerald-600",
      "bg-red-50", "text-red-600",
      "bg-slate-100", "text-slate-600"
    );
    const cls = change.state === "up" ? up : change.state === "down" ? down : neutral;
    cls.split(" ").forEach((c) => badge.classList.add(c));
    badge.title = change.title;
  }

  function updateCard(prefix, stats) {
    const totalEl = document.getElementById(`${prefix}TotalCount`);
    const thisEl = document.getElementById(`${prefix}ThisWeek`);
    const prevEl = document.getElementById(`${prefix}PrevWeek`);
    if (totalEl) totalEl.textContent = formatNumber(stats.total);
    if (thisEl) thisEl.textContent = formatNumber(stats.thisWeek);
    if (prevEl) prevEl.textContent = formatNumber(stats.prevWeek);
    const change = getChange(stats.thisWeek, stats.prevWeek);
    setBadge(`${prefix}ChangeBadge`, `${prefix}ChangeIcon`, `${prefix}ChangePercent`, change);
  }

  function getCasesStats(ranges) {
    const list = safeParse(localStorage.getItem(KEYS.cases), []);
    const items = Array.isArray(list) ? list : [];
    const weekly = countByDate(items, (c) => c && (c.registrationDate || c.createdAt), ranges);
    return { total: items.length, ...weekly };
  }

  function getSessionsStats(ranges) {
    const list = safeParse(localStorage.getItem(KEYS.sessions), []);
    const items = Array.isArray(list) ? list : [];
    const weekly = countByDate(items, (s) => s && (s.sessionDate || s.createdAt), ranges);
    return { total: items.length, ...weekly };
  }

  /* ---------- Clients (Egypt local time, creation date only) ---------- */
  function getEgyptDateParts(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const map = {};
      parts.forEach((p) => { if (p.type !== "literal") map[p.type] = p.value; });
      const y = Number(map.year);
      const m = Number(map.month);
      const d = Number(map.day);
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) throw new Error("Invalid Egypt date parts");
      return { year: y, month: m, day: d };
    } catch {
      // Fallback to local environment time if Intl/timezone unavailable
      return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
    }
  }

  function ymdToUtcDayIndex(year, month, day) {
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  }

  function getEgyptWeekRanges(now = new Date()) {
    const today = getEgyptDateParts(now);
    const todayIndex = ymdToUtcDayIndex(today.year, today.month, today.day);
    const dow = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay(); // 0 Sun..6 Sat
    const diffToMonday = (dow + 6) % 7; // Monday start
    const thisWeekStart = todayIndex - diffToMonday;
    const thisWeekEnd = thisWeekStart + 7; // exclusive
    const lastWeekStart = thisWeekStart - 7;
    const lastWeekEnd = thisWeekStart;
    return { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd };
  }

  function parseClientCreationYmd(createdAt) {
    if (createdAt == null || createdAt === "") return null;
    if (createdAt instanceof Date) {
      if (isNaN(createdAt.getTime())) return null;
      return getEgyptDateParts(createdAt);
    }
    const str = String(createdAt).trim();
    if (!str) return null;

    // ISO strings / parseable date-times -> convert to Egypt local date
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      // If it's a plain YYYY-MM-DD, treat it as that calendar date (safe for missing time)
      const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
      if (m) {
        return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
      }
      return getEgyptDateParts(dateObj);
    }

    // Fallback: try to extract YYYY-MM-DD from string
    const m2 = /([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(str);
    if (m2) {
      return { year: Number(m2[1]), month: Number(m2[2]), day: Number(m2[3]) };
    }
    return null;
  }

  function getClientsStats() {
    const list = safeParse(localStorage.getItem(KEYS.clients), []);
    const clients = Array.isArray(list) ? list : [];
    const ranges = getEgyptWeekRanges(new Date());
    let thisWeek = 0;
    let lastWeek = 0;

    clients.forEach((client) => {
      if (!client || typeof client !== "object") return;
      // Use actual client creation date only (do not use update dates)
      const ymd = parseClientCreationYmd(client.createdAt);
      if (!ymd) return; // missing/invalid creation date handled safely
      const idx = ymdToUtcDayIndex(ymd.year, ymd.month, ymd.day);
      if (idx >= ranges.thisWeekStart && idx < ranges.thisWeekEnd) thisWeek += 1;
      else if (idx >= ranges.lastWeekStart && idx < ranges.lastWeekEnd) lastWeek += 1;
    });

    return { total: clients.length, thisWeek, lastWeek };
  }

  function updateClientsCard(stats) {
    const totalEl = document.getElementById("clientsTotal");
    const thisEl = document.getElementById("clientsThisWeek");
    const lastEl = document.getElementById("clientsLastWeek");
    if (totalEl) totalEl.textContent = formatNumber(stats.total);
    if (thisEl) thisEl.textContent = formatNumber(stats.thisWeek);
    if (lastEl) lastEl.textContent = formatNumber(stats.lastWeek);

    const change = getChange(stats.thisWeek, stats.lastWeek);
    setBadge("clientsChangeBadge", "clientsChangeIcon", "clientsChangePercent", change);
  }

  function renderDashboardStats() {
    // Only run on dashboard where cards exist
    if (!document.getElementById("dashboardClientsCard")) return;

    // Clients card (fixed/improved)
    updateClientsCard(getClientsStats());

    // Cases & Sessions cards (unchanged behavior/IDs)
    const ranges = getWeekRanges(new Date());
    updateCard("cases", getCasesStats(ranges));
    updateCard("sessions", getSessionsStats(ranges));
  }

  function init() {
    renderDashboardStats();
    window.addEventListener("storage", (e) => {
      if (!e || [KEYS.clients, KEYS.cases, KEYS.sessions].includes(e.key)) {
        renderDashboardStats();
      }
    });
    window.addEventListener("focus", renderDashboardStats);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") renderDashboardStats();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();





