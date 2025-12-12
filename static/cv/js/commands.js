// --- COMMAND DEFINITIONS ---
const commands = [
  { keywords: ["home", "cls", "clear"], index: 0, target: "home" },
  { keywords: ["exp", "work"], index: 1, target: "experience" },
  { keywords: ["skill"], index: 2, target: "skills" },
  { keywords: ["proj"], index: 3, target: "projects" },
  { keywords: ["contact", "mail"], index: 4, target: "contact" },
  { keywords: ["download", "pdf", "print"], index: 5, target: "download" },
  { keywords: ["snake", "game", "play"], index: -1, target: "snake" },
  { keywords: ["exit", "quit", "shutdown", "poweroff"], index: -1, target: "exit" },
];

async function processCommand(cmd) {
  const contentScreen = document.getElementById("content-screen");
  const cmdInput = document.getElementById("cmd-input");
  const cleanCmd = cmd.toLowerCase().trim();

  // Theme command handling
  if (cleanCmd.startsWith('theme')) {
    const parts = cleanCmd.split(/\s+/);
    if (parts.length === 1) {
      // Just "theme" - show current options
      contentScreen.innerHTML = `
        <h2>/// PHOSPHOR THEMES ///</h2>
        <p>CHANGE CRT PHOSPHOR COLOR:</p>
        <br>
        <p>> <span style="color: #4af626">THEME GREEN</span> - Classic P1 phosphor</p>
        <p>> <span style="color: #ffb000">THEME AMBER</span> - Warm P3 phosphor</p>
        <p>> <span style="color: #e0e0e0">THEME WHITE</span> - P4 white phosphor</p>
        <br>
        <p style="color: var(--term-dim)">Usage: THEME [green|amber|white]</p>
      `;
    } else {
      const themeName = parts[1];
      if (themes.includes(themeName)) {
        setTheme(themeName);
        contentScreen.innerHTML = `
          <h2>/// DISPLAY CONFIG ///</h2>
          <p>PHOSPHOR TYPE: ${themeName.toUpperCase()}</p>
          <p>STATUS: <span style="color: var(--term-light)">APPLIED</span></p>
          <br>
          <p>> CRT recalibration complete.</p>
        `;
      } else {
        contentScreen.innerHTML = `
          <p style="color: red">ERROR: Unknown theme "${themeName}"</p>
          <p>Available: green, amber, white</p>
        `;
      }
    }
    cmdInput.value = "";
    resizeInput();
    return;
  }

  // DIR / LS command - funny directory listing
  if (cleanCmd === "dir" || cleanCmd === "ls" || cleanCmd === "ls -la") {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    
    contentScreen.innerHTML = `
<h2>/// DIRECTORY OF C:\\USERS\\GUEST\\ ///</h2>
<pre style="line-height: 1.6;">
 Volume in drive C is MARCIN_DRIVE
 Volume Serial Number is 1337-CAFE

 Directory of C:\\USERS\\GUEST

${dateStr}  09:41 AM    &lt;DIR&gt;          .
${dateStr}  09:41 AM    &lt;DIR&gt;          ..
${dateStr}  03:14 AM    &lt;DIR&gt;          definitely_not_memes
${dateStr}  04:20 PM    &lt;DIR&gt;          taxes_2019_FINAL_v3_REAL
${dateStr}  11:59 PM         4,206,969  project_deadline_tomorrow.zip
${dateStr}  02:30 AM    &lt;DIR&gt;          stackoverflow_answers
${dateStr}  08:00 AM           420,420  todo_list_2019.txt
${dateStr}  05:00 PM    &lt;DIR&gt;          node_modules
${dateStr}  05:01 PM    &lt;DIR&gt;          node_modules_backup
${dateStr}  05:02 PM    &lt;DIR&gt;          node_modules_backup_2
${dateStr}  06:66 PM                 0  bugs.txt
${dateStr}  11:11 AM    &lt;DIR&gt;          totally_legal_movies
${dateStr}  01:23 AM         1,337,420  sleep_schedule.exe [CORRUPTED]
${dateStr}  09:00 AM    &lt;DIR&gt;          meeting_notes_i_never_read
${dateStr}  04:04 PM           123,456  my_code_works_idk_why.js
${dateStr}  03:33 AM    &lt;DIR&gt;          3am_ideas [ENCRYPTED]
${dateStr}  12:00 PM                42  meaning_of_life.txt
${dateStr}  07:30 AM    &lt;DIR&gt;          coffee_consumption_logs
               5 File(s)      6,088,307 bytes
              13 Dir(s)   4,206,969,420 bytes free
</pre>
<p style="color: var(--term-dim); margin-top: 15px;">> Nothing suspicious here...</p>`;
    cmdInput.value = "";
    resizeInput();
    return;
  }

  if (cleanCmd === "help") {
    const aiStatus = isAIAvailable() 
      ? '<li>> Or just ASK ME ANYTHING! (AI-powered)</li>'
      : '<li style="color: var(--term-dim)">> AI assistant unavailable (requires Chrome 127+)</li>';
    
    contentScreen.innerHTML = `
      <h2>/// HELP MENU ///</h2>
      <p>AVAILABLE COMMANDS:</p>
      <ul>
        <li>> HOME / CLEAR</li>
        <li>> EXP / WORK</li>
        <li>> SKILLS</li>
        <li>> PROJ / PROJECTS</li>
        <li>> CONTACT</li>
        <li>> DOWNLOAD / PDF / PRINT</li>
        <li>> SNAKE / GAME / PLAY</li>
        <li>> THEME [green|amber|white]</li>
        <li>> DIR / LS</li>
        <li>> EXIT / QUIT / SHUTDOWN</li>
        ${aiStatus}
      </ul>`;
  } else {
    const match = commands.find((c) =>
      c.keywords.some((k) => cleanCmd === k.toLowerCase())
    );
    if (match) {
      // Power off effect
      if (match.target === "exit") {
        powerOff();
      } else {
        navigateTo(match.target);
        // Auto-start PDF download when using command
        if (match.target === "download") {
          startPdfDownload();
        }
      }
    } else {
      // No command match - try AI fallback
      if (isAIAvailable()) {
        await handleAIQuery(cmd);
      } else {
        contentScreen.innerHTML += `<br><p style="color:red">ERROR: COMMAND NOT RECOGNIZED</p>`;
        contentScreen.innerHTML += `<p style="color: var(--term-dim)">Type 'help' for available commands</p>`;
        contentScreen.scrollTop = contentScreen.scrollHeight;
      }
    }
  }

  updateMenu();
  cmdInput.value = "";
  resizeInput();
}

// --- POWER OFF EFFECT ---
function powerOff() {
  beep(200, 500, 0.1); // Low shutdown sound
  document.body.classList.add("power-off");
}

