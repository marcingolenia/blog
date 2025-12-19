const menuItems = document.querySelectorAll(".menu-item");
let currentIndex = 0;

function updateMenu() {
  menuItems.forEach((item, i) => {
    item.classList.toggle("active", i === currentIndex);
  });
}

function triggerSelection() {
  const selectedItem = menuItems[currentIndex];
  const target = selectedItem.getAttribute("data-target");
  navigateTo(target);
}

function navigateTo(key, pushHistory = true) {
  loadContent(key);
  if (pushHistory) {
    history.pushState({ section: key }, '', `#${key}`);
  }
  const menuIndex = Array.from(menuItems).findIndex(
    item => item.getAttribute('data-target') === key
  );
  if (menuIndex !== -1) {
    currentIndex = menuIndex;
    updateMenu();
  }
}

window.addEventListener('popstate', (e) => {
  const section = e.state?.section || 'home';
  loadContent(section);
  const menuIndex = Array.from(menuItems).findIndex(
    item => item.getAttribute('data-target') === section
  );
  if (menuIndex !== -1) {
    currentIndex = menuIndex;
    updateMenu();
  }
});

document.addEventListener("keydown", (e) => {
  const cmdInput = document.getElementById("cmd-input");
  
  if (e.key === "ArrowUp") {
    currentIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
    updateMenu();
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    currentIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
    updateMenu();
    e.preventDefault();
  } else if (e.key === "Enter") {
    if (document.activeElement === cmdInput && cmdInput.value.trim() !== "") {
      processCommand(cmdInput.value.trim());
    } else {
      triggerSelection();
    }
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    beep(1000, 20, 0.06);
  }
});

menuItems.forEach((item, index) => {
  item.addEventListener("click", (e) => {
    const cmdInput = document.getElementById("cmd-input");
    e.stopPropagation();
    currentIndex = index;
    updateMenu();
    triggerSelection();
    cmdInput.focus();
  });
});

document.addEventListener("click", (e) => {
  const cmdInput = document.getElementById("cmd-input");
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  if (!hasSelection) {
    cmdInput.focus();
  }
});

