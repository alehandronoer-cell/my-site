(() => {
  "use strict";

  const FORMSPREE_ENDPOINT = ""; // вставить endpoint формы при необходимости

  /* ---------- бургер ---------- */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = burger.classList.toggle("open");
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open);
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        burger.classList.remove("open");
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- модалки ---------- */
  const modals = document.querySelectorAll(".modal");

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  };

  const closeModal = (modal) => {
    modal.style.display = "none";
    document.body.style.overflow = "";
    const result = modal.querySelector(".form__result");
    if (result) result.textContent = "";
    clearErrors(modal.querySelector("form"));
  };

  document.querySelectorAll("[data-modal]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(el.dataset.modal);
    });
  });

  modals.forEach((modal) => {
    const overlay = modal.querySelector(".modal__overlay");
    const closeBtn = modal.querySelector(".modal__close");

    if (overlay) overlay.addEventListener("click", () => closeModal(modal));
    if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modals.forEach((m) => {
        if (m.style.display === "flex") closeModal(m);
      });
    }
  });

  /* ---------- табы услуг ---------- */
  const tabs = document.querySelectorAll(".services__tab");
  const grids = document.querySelectorAll('[id^="services-grid-"]');

  const showTab = (targetId) => {
    tabs.forEach((t) => {
      t.classList.remove("services__tab_active");
      t.setAttribute("aria-selected", "false");
    });
    grids.forEach((g) => {
      g.classList.add("hidden");
      g.setAttribute("aria-hidden", "true");
    });

    const activeTab = document.querySelector(`[data-tab="${targetId}"]`);
    const activeGrid = document.getElementById(`services-grid-${targetId}`);

    if (activeTab) {
      activeTab.classList.add("services__tab_active");
      activeTab.setAttribute("aria-selected", "true");
    }
    if (activeGrid) {
      activeGrid.classList.remove("hidden");
      activeGrid.setAttribute("aria-hidden", "false");
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      showTab(tab.dataset.tab);
    });
  });

  /* ---------- валидация ---------- */
  const clearErrors = (form) => {
    if (!form) return;
    form.querySelectorAll(".field__error").forEach((e) => (e.textContent = ""));
    form.querySelectorAll(".field__input").forEach((i) => i.classList.remove("error"));
  };

  const showError = (input, msg) => {
    input.classList.add("error");
    const field = input.closest(".field");
    const err = field ? field.querySelector(".field__error") : null;
    if (err) err.textContent = msg;
  };

  const sanitize = (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const validatePhone = (phone) => /^\+?\d[\d\s\-\(\)]{6,}\d$/.test(phone.trim());

  const submitForm = async (form, resultEl) => {
    /* ---------- защита от ботов: хонипот ---------- */
    const honey = form.querySelector('input[name="website"]');
    if (honey && honey.value.trim() !== "") {
      if (resultEl) resultEl.textContent = "Обнаружена автоматическая отправка. Заявка не принята.";
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    clearErrors(form);
    let ok = true;

    if (data.name && data.name.length < 2) {
      showError(form.elements.name, "Имя слишком короткое");
      ok = false;
    }
    if (data.phone && !validatePhone(data.phone)) {
      showError(form.elements.phone, "Неверный телефон");
      ok = false;
    }
    if (data.vin && data.vin.length < 8) {
      showError(form.elements.vin, "Укажите корректный VIN или год выпуска");
      ok = false;
    }

    if (!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Отправка...";

    if (!FORMSPREE_ENDPOINT) {
      console.log("Форма готова к отправке. Вставьте Formspree endpoint в script.js (FORMSPREE_ENDPOINT).", data);
      if (resultEl) resultEl.textContent = "Демо: данные готовы к отправке. Endpoint не указан — заявка не ушла на сервер.";
      btn.disabled = false;
      btn.textContent = btnText;
      return;
    }

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (res.ok) {
        if (resultEl) resultEl.textContent = "Готово. Мы свяжемся с вами.";
        form.reset();
      } else {
        throw new Error("Ошибка сервера");
      }
    } catch (err) {
      if (resultEl) resultEl.textContent = "Не удалось отправить. Попробуйте позже.";
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = btnText;
    }
  };

  /* ---------- инициализация форм ---------- */
  document.querySelectorAll("form[data-ajax]").forEach((form) => {
    const resultEl = form.querySelector(".form__result");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(form, resultEl);
    });
  });

  /* ---------- маска телефона ---------- */
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.startsWith("375")) value = value.slice(3);
      if (value.startsWith("8")) value = value.slice(1);
      if (value.length > 9) value = value.slice(0, 9);
      let formatted = "+375 ";
      if (value.length > 0) formatted += value.slice(0, 2);
      if (value.length > 2) formatted += ` (${value.slice(2, 5)})`;
      if (value.length > 5) formatted += ` ${value.slice(5, 8)}`;
      if (value.length > 8) formatted += ` ${value.slice(8)}`;
      e.target.value = formatted.trim();
    });
  });

  /* ---------- год в футере ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- защита от ботов: хонипот ---------- */
  document.querySelectorAll("form[data-ajax]").forEach((form) => {
    const honey = document.createElement("input");
    honey.type = "text";
    honey.name = "website";
    honey.tabIndex = -1;
    honey.autocomplete = "off";
    honey.style = "position:absolute;left:-9999px;opacity:0;";
    honey.tabIndex = -1;
    form.appendChild(honey);
  });

  /* ---------- препятствие правой кнопке и консоли (для обычных пользователей) ---------- */
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "j" || e.key === "c" || e.key === "u")) {
      e.preventDefault();
    }
  });
})();