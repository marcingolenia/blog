// --- BOOT SEQUENCE ---
const bootMessages = [
  { text: "MARCIN_BIOS v4.20.69", delay: 100, beep: true },
  { text: "Copyright (C) 1989-2025 Marcin Industries", delay: 50 },
  { text: "", delay: 200 },
  { text: "CPU: INTEL 80486DX @ 66MHz........OK", delay: 80, beep: true },
  { text: "RAM: 640K BASE, 15360K EXTENDED...OK", delay: 100, beep: true },
  { text: "FPU: DETECTED", delay: 60 },
  { text: "", delay: 150 },
  { text: "PRIMARY MASTER: QUANTUM FIREBALL 1.2GB", delay: 80 },
  { text: "PRIMARY SLAVE:  NONE", delay: 40 },
  { text: "SECONDARY MASTER: CREATIVE CD-ROM 4X", delay: 60 },
  { text: "", delay: 200 },
  { text: "CHECKING MEMORY", delay: 100 },
  { text: ".....", delay: 400, beep: true },
  { text: " 16384K OK", delay: 100, beep: true },
  { text: "", delay: 200 },
  { text: "LOADING MARCIN_DEV.EXE", delay: 150 },
  { text: "█", delay: 100 },
  { text: "██", delay: 100 },
  { text: "███", delay: 100 },
  { text: "████", delay: 100 },
  { text: "█████", delay: 100 },
  { text: "██████", delay: 100, beep: true },
  { text: "███████", delay: 100 },
  { text: "████████", delay: 100 },
  { text: "█████████", delay: 100 },
  { text: "██████████ COMPLETE!", delay: 200, beep: true },
  { text: "", delay: 300 },
  { text: "STARTING SYSTEM...", delay: 400, beep: true },
];

async function runBootSequence() {
  const bootScreen = document.getElementById("boot-screen");
  const bootText = document.getElementById("boot-text");
  const cmdInput = document.getElementById("cmd-input");
  
  let fullText = "";

  for (const msg of bootMessages) {
    if (msg.beep) {
      beep(1000 + Math.random() * 500, 30, 0.06);
    }

    if (msg.text === "") {
      fullText += "\n";
    } else if (msg.text.startsWith("█")) {
      // Progress bar - replace last line
      const lines = fullText.split("\n");
      if (lines[lines.length - 1].startsWith("█")) {
        lines[lines.length - 1] = msg.text;
        fullText = lines.join("\n");
      } else {
        fullText += msg.text;
      }
    } else {
      fullText += msg.text + "\n";
    }

    bootText.textContent = fullText;
    await new Promise((r) => setTimeout(r, msg.delay));
  }

  // Final beep and hide boot screen
  beep(800, 100, 0.1);
  await new Promise((r) => setTimeout(r, 500));

  bootScreen.classList.add("hidden");
  cmdInput.focus();
}

