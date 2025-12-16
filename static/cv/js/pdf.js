// --- PDF DOWNLOAD WITH FAKE PROGRESS ---
let isDownloading = false;

function startPdfDownload() {
  if (isDownloading) return;
  isDownloading = true;

  const contentScreen = document.getElementById("content-screen");

  // Play dot matrix printer sound
  if (typeof downloadSound === "function") {
    downloadSound();
  }

  const progressDiv = document.getElementById("download-progress");
  if (!progressDiv) return;

  const steps = [
    { text: "SCANNING RESUME DATA...", delay: 400 },
    { text: "COMPILING EXPERIENCE.LOG...", delay: 600 },
    { text: "LOADING SKILLS.DAT...", delay: 500 },
    { text: "INDEXING PROJECTS.DIR...", delay: 450 },
    { text: "ENCRYPTING CONTACT INFO...", delay: 550 },
    { text: "GENERATING PDF BUFFER...", delay: 700 },
    { text: "OPTIMIZING FILE SIZE...", delay: 400 },
    { text: "FINALIZING DOCUMENT...", delay: 500 },
  ];

  let html = "";
  let totalDelay = 0;

  // Show each step with a progress bar
  steps.forEach((step, i) => {
    totalDelay += step.delay;
    setTimeout(() => {
      html += `<p style="color: var(--term-light)">> ${step.text}</p>\n`;
      progressDiv.innerHTML = html + renderProgressBar(i + 1, steps.length);
      contentScreen.scrollTop = contentScreen.scrollHeight;
    }, totalDelay);
  });

  // Final completion message
  totalDelay += 800;
  setTimeout(() => {
    html += `<br><p style="color: var(--term-green); font-size: 1.2em">████████████████████████████████ 100%</p>\n`;
    html += `<br><p>═══════════════════════════════════════════</p>`;
    html += `<p style="color: var(--term-green)">DOWNLOAD COMPLETE!</p>`;
    html += `<p>═══════════════════════════════════════════</p>`;
    html += `<br><p>> Opening print dialog...</p>`;
    html += `<p style="color: var(--term-light)">> Select "Save as PDF" to download.</p>`;
    progressDiv.innerHTML = html;
    contentScreen.scrollTop = contentScreen.scrollHeight;

    // Trigger print dialog after a short delay
    setTimeout(() => {
      isDownloading = false;
      generatePrintableCV();
      window.print();
      // Restore normal view after print dialog closes
      setTimeout(() => {
        loadContent("download");
        currentIndex = 0;
      }, 500);
    }, 1000);
  }, totalDelay);
}

function generatePrintableCV() {
  const contentScreen = document.getElementById("content-screen");
  
  // Get content from templates
  const experience = document.getElementById("template-experience")?.innerHTML || "";
  const skills = document.getElementById("template-skills")?.innerHTML || "";
  const projects = document.getElementById("template-projects")?.innerHTML || "";

  // Combine all sections for printing
  contentScreen.innerHTML = `
    <div class="print-header" style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 2em; margin: 0;">MARCIN DEVELOPER</h1>
      <p style="color: var(--term-light);">SENIOR SOFTWARE ENGINEER</p>
      <p style="font-size: 0.9em; color: #888;">marcingolenia@gmail.com | github.com/marcingolenia | linkedin.com/in/marcin-golenia-228359183/</p>
    </div>
    
    ${experience}
    ${skills}
    ${projects}
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed var(--term-green);">
      <p style="text-align: center; color: #888; font-size: 0.8em;">
        Generated from MARCIN_DEV.EXE v2.4.0 | Terminal Portfolio System
      </p>
    </div>
  `;
}

function renderProgressBar(current, total) {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 32);
  const empty = 32 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `<p style="color: var(--term-dim)">[${bar}] ${percent}%</p>`;
}

