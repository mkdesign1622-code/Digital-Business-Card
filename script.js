const app = document.querySelector("#app");
const loader = document.querySelector("#loader");
const loaderValue = document.querySelector("#loaderValue");
const profile = document.querySelector("#profile");
const contacts = document.querySelector("#contacts");
const contactsSheet = contacts.querySelector(".contacts__sheet");
const openContactsButton = document.querySelector("#openContacts");
const closeContactsButton = document.querySelector("#closeContacts");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const loaderDelay = reducedMotion ? 0 : 420;
const loaderDuration = reducedMotion ? 0 : 3000;
const loaderHold = reducedMotion ? 0 : 300;
let lastFocusedElement = null;
let touchStartY = 0;
let touchOffset = 0;

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function finishLoader() {
  loaderValue.textContent = "100";
  loader.style.setProperty("--progress", 1);
  app.classList.add("is-ready");
  profile.setAttribute("aria-hidden", "false");
  loader.classList.add("is-leaving");
}

function runLoader() {
  if (reducedMotion) {
    finishLoader();
    return;
  }

  const startTime = performance.now() + loaderDelay;

  function frame(currentTime) {
    if (currentTime < startTime) {
      requestAnimationFrame(frame);
      return;
    }

    const elapsed = currentTime - startTime;
    const linearProgress = Math.min(elapsed / loaderDuration, 1);
    const easedProgress = easeInOutCubic(linearProgress);
    const percentage = Math.round(easedProgress * 100);

    loader.style.setProperty("--progress", easedProgress.toFixed(4));
    loaderValue.textContent = String(percentage).padStart(2, "0");

    if (linearProgress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    window.setTimeout(finishLoader, loaderHold);
  }

  requestAnimationFrame(frame);
}

function getFocusableElements() {
  return [...contacts.querySelectorAll("a[href], button:not([disabled])")];
}

function openContacts() {
  if (contacts.classList.contains("is-open")) return;

  lastFocusedElement = document.activeElement;
  contacts.classList.add("is-open");
  contacts.setAttribute("aria-hidden", "false");
  openContactsButton.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";

  window.setTimeout(() => closeContactsButton.focus({ preventScroll: true }), reducedMotion ? 0 : 360);
}

function closeContacts() {
  if (!contacts.classList.contains("is-open")) return;

  contacts.classList.remove("is-open");
  contacts.setAttribute("aria-hidden", "true");
  openContactsButton.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  contactsSheet.style.transform = "";

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus({ preventScroll: true });
  }
}

function trapFocus(event) {
  if (event.key !== "Tab" || !contacts.classList.contains("is-open")) return;

  const focusable = getFocusableElements();
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handlePointerDown(event) {
  if (window.innerWidth >= 720 || event.pointerType === "mouse") return;
  touchStartY = event.clientY;
  touchOffset = 0;
  contactsSheet.setPointerCapture(event.pointerId);
  contactsSheet.style.transition = "none";
}

function handlePointerMove(event) {
  if (!touchStartY || window.innerWidth >= 720) return;
  touchOffset = Math.max(0, event.clientY - touchStartY);
  contactsSheet.style.transform = `translateY(${touchOffset}px)`;
}

function handlePointerUp() {
  if (!touchStartY || window.innerWidth >= 720) return;
  contactsSheet.style.transition = "";

  if (touchOffset > 110) {
    closeContacts();
  } else {
    contactsSheet.style.transform = "";
  }

  touchStartY = 0;
  touchOffset = 0;
}

openContactsButton.setAttribute("aria-expanded", "false");
openContactsButton.addEventListener("click", openContacts);
closeContactsButton.addEventListener("click", closeContacts);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeContacts();
  trapFocus(event);
});

contactsSheet.addEventListener("pointerdown", handlePointerDown);
contactsSheet.addEventListener("pointermove", handlePointerMove);
contactsSheet.addEventListener("pointerup", handlePointerUp);
contactsSheet.addEventListener("pointercancel", handlePointerUp);

runLoader();
