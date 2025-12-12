// --- CONTENT LOADING ---
const sections = ["home", "experience", "skills", "projects", "contact", "download", "snake"];

function loadContent(key) {
  const contentScreen = document.getElementById("content-screen");
  
  // Stop snake game if running
  if (typeof stopSnakeGame === "function") {
    stopSnakeGame();
  }
  
  // Floppy disk seek sound when switching sections
  if (typeof floppySeek === "function") {
    floppySeek();
  }

  // Get content from template
  const template = document.getElementById(`template-${key}`);
  if (!template) {
    contentScreen.innerHTML = `<p style="color:red">ERROR: Template not found: ${key}</p>`;
    return;
  }

  contentScreen.innerHTML = template.innerHTML;
  contentScreen.scrollTop = 0;

  // Setup download button
  if (key === "download") {
    const btn = document.getElementById("start-download");
    if (btn) {
      btn.addEventListener("click", startPdfDownload);
    }
  }

  // Start snake game
  if (key === "snake") {
    startSnakeGame();
  }

  // Animate score circles
  if (key === "projects") {
    animateScoreCircles();
  }
}

// --- SCORE CIRCLE ANIMATION ---
function animateScoreCircles() {
  const circles = document.querySelectorAll(".score-circle");
  const circumference = 2 * Math.PI * 22; // r=22

  circles.forEach((circle, index) => {
    const score = parseInt(circle.dataset.score) || 0;
    const progress = circle.querySelector(".circle-progress");
    const offset = circumference - (score / 100) * circumference;

    // Reset the animation
    progress.style.strokeDasharray = circumference;
    progress.style.strokeDashoffset = circumference;

    // Animate with delay for staggered effect
    setTimeout(() => {
      progress.style.transition = "stroke-dashoffset 0.8s ease-out";
      progress.style.strokeDashoffset = offset;
    }, 150 + index * 100);
  });
}

