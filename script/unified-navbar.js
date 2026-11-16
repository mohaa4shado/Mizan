(function () {
  "use strict";

  function createUnifiedNavbar() {
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const basePath = isInPagesFolder ? "../" : "./";
    const logoPath = basePath + "pic/Mizan Logo 02.png";

    const navbar = document.createElement("header");
    navbar.className = "unified-navbar";
    navbar.setAttribute("dir", "rtl");

    navbar.innerHTML = `
      <div class="unified-navbar-container">
        <div class="unified-navbar-right">
          <a href="${basePath}index.html" class="unified-navbar-brand" aria-label="الصفحة الرئيسية">
            <img src="${logoPath}" alt="شعار ميزان" class="unified-navbar-logo" />
            <div class="unified-navbar-brand-text">
              <div class="unified-navbar-brand-name">ميزان</div>
            </div>
          </a>
        </div>
        
        <div class="unified-navbar-left">
          <a href="${basePath}index.html" class="unified-navbar-icon-btn" title="الصفحة الرئيسية" aria-label="الصفحة الرئيسية">
            <span class="material-symbols-outlined">home</span>
            <span class="unified-navbar-btn-label">الرئيسية</span>
          </a>

         <a href="${basePath}index.html" class="unified-navbar-icon-btn" title="الصفحة الرئيسية" aria-label="الصفحة الرئيسية">
            <span class="material-symbols-outlined">
           account_circle
           </span>
            <span class="unified-navbar-btn-label"> محمد شدوفة </span>
          </a>
             
        </div>
      </div>
    `;
     
    return navbar;
  }

  function injectNavbarStyles() {
    if (document.getElementById("unified-navbar-styles")) return;

    const style = document.createElement("style");
    style.id = "unified-navbar-styles";
    style.textContent = `
      .unified-navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(194, 224, 255, 0.6);
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
        font-family: "Tajawal", "Cairo", sans-serif;
      }
      
      .unified-navbar-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
      }
      
      .unified-navbar-right {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex: 1;
      }
      
      .unified-navbar-brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: var(--mizan-text-primary, #08314d);
        transition: opacity 0.2s ease;
      }
      
      .unified-navbar-brand:hover {
        opacity: 0.8;
      }
      
      .unified-navbar-logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: 12px;
      }
      
      .unified-navbar-brand-text {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }
      
      .unified-navbar-brand-name {
        font-size: 1.25rem;
        font-weight: 800;
        line-height: 1.2;
      }
      
      .unified-navbar-brand-subtitle {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--mizan-text-secondary, #3d5f7c);
        line-height: 1.2;
      }
      
      .unified-navbar-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .unified-navbar-icon-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 0.875rem;
        background: transparent;
        border: none;
        border-radius: 12px;
        color: var(--mizan-text-secondary, #3d5f7c);
        cursor: pointer;
        text-decoration: none;
        font-family: "Tajawal", "Cairo", sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      
      .unified-navbar-icon-btn:hover {
        background: rgba(0, 98, 137, 0.08);
        color: var(--mizan-primary, #006289);
      }
      
      .unified-navbar-icon-btn:active {
        transform: scale(0.95);
      }
      
      .unified-navbar-icon-btn .material-symbols-outlined {
        font-size: 1.25rem;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
      
      .unified-navbar-btn-label {
        display: inline;
      }
      
      .unified-navbar-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(0, 186, 255, 0.3);
        cursor: pointer;
        transition: all 0.2s ease;
        margin-right: 0.5rem;
      }
      
      .unified-navbar-avatar:hover {
        border-color: var(--mizan-primary, #006289);
        box-shadow: 0 0 0 3px rgba(0, 98, 137, 0.1);
      }
      
      .unified-navbar-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      body {
        padding-top: 80px;
      }
      
      @media (max-width: 768px) {
        .unified-navbar-container {
          padding: 0 1rem;
          height: 70px;
        }
        
        body {
          padding-top: 70px;
        }
        
        .unified-navbar-logo {
          width: 42px;
          height: 42px;
        }
        
        .unified-navbar-brand-name {
          font-size: 1.125rem;
        }
        
        .unified-navbar-brand-subtitle {
          font-size: 0.7rem;
        }
        
        .unified-navbar-btn-label {
          display: none;
        }
        
        .unified-navbar-icon-btn {
          padding: 0.5rem;
        }
        
        .unified-navbar-avatar {
          width: 38px;
          height: 38px;
        }
      }
      
      @media (max-width: 480px) {
        .unified-navbar-container {
          padding: 0 0.75rem;
        }
        
        .unified-navbar-brand-text {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectNavbarStyles();

    // Remove existing navbars
    const existingHeaders = document.querySelectorAll(
      "header.topbar, header.app-navbar, .navbar",
    );
    existingHeaders.forEach((h) => {
      if (h !== document.querySelector(".unified-navbar")) {
        h.style.display = "none";
      }
    });

    // Add unified navbar if not login page
    if (
      !window.location.pathname.includes("login") &&
      !window.location.pathname.includes("LogIn")
    ) {
      // Don't add if already exists
      if (!document.querySelector(".unified-navbar")) {
        const navbar = createUnifiedNavbar();
        document.body.insertBefore(navbar, document.body.firstChild);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
