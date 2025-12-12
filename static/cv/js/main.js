// --- MAIN INITIALIZATION ---

// --- CLOCK ---
function initClock() {
  const clockDiv = document.getElementById("clock");
  
  setInterval(() => {
    const now = new Date();
    clockDiv.innerText = now.toLocaleTimeString();
    
    // Update Warsaw clock if visible
    const warsawClock = document.getElementById("warsaw-clock");
    if (warsawClock) {
      warsawClock.innerText = now.toLocaleTimeString("en-GB", {
        timeZone: "Europe/Warsaw",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
  }, 1000);
}

// --- INPUT HANDLING ---
function initInput() {
  const cmdInput = document.getElementById("cmd-input");
  
  // Resize input to fit content so cursor follows text
  function resizeInput() {
    cmdInput.style.width = Math.max(1, cmdInput.value.length) + "ch";
  }
  
  // Make resizeInput globally available
  window.resizeInput = resizeInput;
  
  cmdInput.addEventListener("input", resizeInput);
  resizeInput();

  // Beep on typing
  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      beep(600, 50, 0.08); // Lower beep for enter
    } else if (e.key === "Backspace") {
      beep(400, 20, 0.06); // Even lower for backspace
    } else if (e.key.length === 1) {
      beep(800 + Math.random() * 200, 25, 0.05); // Slight variation
    }
  });
}

// --- COPY TO CLIPBOARD ---
function initClipboard() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("copy-btn")) {
      const textToCopy = e.target.getAttribute("data-copy");
      navigator.clipboard.writeText(textToCopy).then(() => {
        beep(1200, 30, 0.08);
        const originalText = e.target.textContent;
        e.target.textContent = "[ COPIED! ]";
        e.target.classList.add("copied");
        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove("copied");
        }, 1500);
      });
    }
  });
}

// --- INITIAL CONTENT LOAD ---
function initContent() {
  // Load initial content based on URL hash or default to home
  const initialHash = window.location.hash.slice(1);
  if (initialHash && sections.includes(initialHash)) {
    navigateTo(initialHash, false);
    history.replaceState({ section: initialHash }, '', `#${initialHash}`);
  } else {
    loadContent("home");
    history.replaceState({ section: 'home' }, '', '#home');
  }
}

// --- STARTUP ---
function init() {
  initTheme();
  initClock();
  initInput();
  initClipboard();
  initAI();
  initContent();
  runBootSequence();
}

// Start everything when DOM is ready
document.addEventListener("DOMContentLoaded", init);

