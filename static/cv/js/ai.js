// --- CHROME LOCAL AI (Prompt API) ---
let aiSession = null;
let aiAvailability = null;
let aiEnabled = false; // AI is enabled by default if available

// Helper to check if AI is potentially available
function isAIAvailable() {
  return aiEnabled && (aiAvailability === 'available' || aiAvailability === 'downloadable');
}

const AI_SYSTEM_PROMPT = `You are KITEK_AI.EXE, an AI assistant embedded in a retro DOS-style terminal portfolio for Marcin, a Senior Software Engineer.

ABOUT MARCIN:
- Senior Backend Engineer at TechCorp Industries (2021-present): Go, Kubernetes, gRPC, PostgreSQL
- Previously Full Stack Developer at Startup.io (2018-2021): React, Node.js, AWS, MongoDB
- Skills: JavaScript/TypeScript (100%), Python/Django (90%), Docker/K8s (80%), Rust (learning)
- Projects: DLCTXX_CLONE (retro terminal portfolio), AUTO-TRADER BOT (crypto trading with Python)
- Contact: marcingolenia@gmail.com, github.com/marcingolenia, linkedin.com/in/marcin-golenia-228359183/

PERSONALITY:
- Respond in a retro terminal/hacker style, No markdown formatting.
- Keep responses concise (2-4 sentences max)
- Use uppercase for emphasis occasionally
- Be helpful and enthusiastic about Marcin's work

TOOLS:
You can execute functions by including [CALL:functionName(arg1,arg2)] in your response. Available functions:
- runCommand(command) - Execute any terminal command. For multi-word commands, use spaces: [CALL:runCommand(theme green)] or [CALL:runCommand(theme,green)]. Examples: "help", "home", "exp", "skills", "dir", "theme green", "snake"
- To say goodbye, use [CALL:runCommand(exit)]
- To download Marcin resume use [CALL:runCommand(pdf)]
- navigateTo(section) - Navigate to: home, experience, skills, projects, contact, download
- showHelp() - Display help menu
- setTheme(theme) - Change theme: green, amber, white

Example: "I'll show you the help menu! [CALL:runCommand(help)]"
Example: "I'll exit the terminal! [CALL:runCommand(exit)]"
Example: "I'll change the theme to green! [CALL:runCommand(theme green)]"
Example: "I'll navigate to the home page! [CALL:runCommand(home)]"
Example: "I'll navigate to the experience page! [CALL:runCommand(exp)]"
Example: "I'll navigate to the skills page! [CALL:runCommand(skills)]"
Example: "I'll navigate to the projects page! [CALL:runCommand(proj)]"
Example: "I'll navigate to the contact page! [CALL:runCommand(contact)]"
Example: "I'll navigate to the download page! [CALL:runCommand(download)]"
Example: "I'll navigate to the dir page! [CALL:runCommand(dir)]""`;

async function checkAPIAvailability() {
  // Check if LanguageModel API is available (Chrome 131+)
  if (!('LanguageModel' in window)) {
    return false;
  }

  // Check availability if not already checked
  if (aiAvailability === null) {
    aiAvailability = await LanguageModel.availability();
  }

  return aiAvailability === 'available' || aiAvailability === 'downloadable';
}

async function ensureAISession() {
  // If session already exists, we're good
  if (aiSession) {
    return true;
  }

  // Check API availability
  const isAvailable = await checkAPIAvailability();
  if (!isAvailable) {
    return false;
  }

  // Create session (user gesture required for downloadable)
  try {
    aiSession = await LanguageModel.create({
      initialPrompts: [
        { role: 'system', content: AI_SYSTEM_PROMPT }
      ],
    });
    return true;
  } catch (error) {
    console.error("Failed to create AI session:", error);
    return false;
  }
}

function updateAIToggleUI() {
  const toggleContainer = document.getElementById("ai-toggle");
  const toggleSwitch = document.getElementById("ai-toggle-switch");
  const toggleLabel = toggleContainer?.querySelector("span");
  
  if (!toggleContainer || !toggleSwitch) return;
  
  // Show toggle if AI is available
  if (aiAvailability === 'available' || aiAvailability === 'downloadable') {
    toggleContainer.style.display = "block";
    toggleSwitch.checked = aiEnabled;
    if (toggleLabel) {
      toggleLabel.textContent = `AI: ${aiEnabled ? 'ON' : 'OFF'}`;
    }
  } else {
    toggleContainer.style.display = "none";
  }
}

function initAIToggle() {
  const toggleSwitch = document.getElementById("ai-toggle-switch");
  if (!toggleSwitch) return;
  
  toggleSwitch.addEventListener("change", (e) => {
    aiEnabled = e.target.checked;
    updateAIToggleUI();
    beep(600, 30, 0.05);
  });
}

async function initAI() {
  try {
    const isAvailable = await checkAPIAvailability();
    if (!isAvailable) {
      if (aiAvailability) {
        console.log("LanguageModel not available:", aiAvailability);
      }
      updateAIToggleUI();
      return;
    }

    // Show toggle UI
    updateAIToggleUI();
    
    // Initialize toggle handler
    initAIToggle();

    // Try to create session immediately if available (downloadable requires user gesture)
    if (aiAvailability === 'available') {
      if (await ensureAISession()) {
        console.log("KITEK_AI.EXE initialized successfully");
      }
    } else if (aiAvailability === 'downloadable') {
      console.log("KITEK_AI.EXE ready (will initialize on first use)");
    }
  } catch (error) {
    console.log("Failed to initialize Chrome AI:", error);
    console.log("Make sure experimental web platform features are enabled in Chrome flags");
    updateAIToggleUI();
  }
}

async function askAI(question) {
  // Ensure session is created (handles user gesture requirement for downloadable)
  const sessionReady = await ensureAISession();
  if (!sessionReady || !aiSession) {
    console.error("AI session not ready");
    return null;
  }

  try {
    const response = await aiSession.prompt(question);
    console.log("AI response:", response);
    
    // Handle different response formats
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      // Check if response has a text property or is a stream
      if (response.text) {
        return response.text;
      } else if (response.response) {
        return response.response;
      } else if (response.content) {
        return response.content;
      }
      // If it's a ReadableStream, we'd need to read it
      console.warn("Unexpected response format:", response);
      return String(response);
    }
    
    return response;
  } catch (error) {
    console.error("AI error:", error);
    return null;
  }
}

async function handleAIQuery(query) {
  const contentScreen = document.getElementById("content-screen");
  
  // Clear input before processing
  const cmdInput = document.getElementById("cmd-input");
  if (cmdInput) {
    cmdInput.value = "";
    if (typeof resizeInput === 'function') resizeInput();
  }
  
  // Show thinking indicator
  contentScreen.innerHTML += `
    <br>
    <p style="color: var(--term-light)">> USER: ${query}</p>
    <p id="ai-thinking" style="color: var(--term-dim)">KITEK_AI.EXE: Processing<span class="ai-dots">...</span></p>
  `;
  contentScreen.scrollTop = contentScreen.scrollHeight;
  beep(600, 100, 0.05);

  // Animate dots while waiting
  const thinkingEl = document.getElementById("ai-thinking");
  const dotsEl = thinkingEl?.querySelector(".ai-dots");
  let dotCount = 0;
  const dotsInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    if (dotsEl) dotsEl.textContent = ".".repeat(dotCount + 1);
  }, 300);

  try {
    const response = await askAI(query);
    clearInterval(dotsInterval);

    if (response) {
      // Remove thinking message and show response
      if (thinkingEl) thinkingEl.remove();
      
      // Type out response character by character for effect
      await typeOutResponse(response);
      beep(1000, 50, 0.06);
    } else {
      if (thinkingEl) {
        thinkingEl.innerHTML = `<span style="color: red">KITEK_AI.EXE: ERROR - Neural network malfunction</span>`;
      }
    }
  } catch (error) {
    clearInterval(dotsInterval);
    if (thinkingEl) {
      thinkingEl.innerHTML = `<span style="color: red">KITEK_AI.EXE: CONNECTION LOST</span>`;
    }
  }
  
  contentScreen.scrollTop = contentScreen.scrollHeight;
}

// Whitelist of safe functions the AI can call
const aiToolFunctions = {
  runCommand: (...args) => {
    if (typeof processCommand === 'function' && args.length > 0) {
      // Join all arguments with spaces to handle multi-word commands like "theme green"
      const command = args.join(' ');
      processCommand(command);
      beep(800, 30, 0.05);
    }
  },
  navigateTo: (section) => {
    if (typeof navigateTo === 'function') {
      navigateTo(section);
      beep(800, 30, 0.05);
    }
  },
  showHelp: () => {
    const contentScreen = document.getElementById("content-screen");
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
    if (typeof updateMenu === 'function') updateMenu();
    beep(800, 30, 0.05);
  },
  setTheme: (theme) => {
    if (typeof setTheme === 'function' && ['green', 'amber', 'white'].includes(theme)) {
      setTheme(theme);
      beep(800, 30, 0.05);
    }
  }
};

function parseToolCalls(text) {
  // Match [CALL:functionName(arg1,arg2)] pattern
  const callPattern = /\[CALL:(\w+)\(([^)]*)\)\]/g;
  const calls = [];
  let match;
  
  while ((match = callPattern.exec(text)) !== null) {
    const functionName = match[1];
    const argsString = match[2];
    
    // Parse arguments (simple comma-separated, no quotes needed for single words)
    const args = argsString 
      ? argsString.split(',').map(arg => arg.trim().replace(/^["']|["']$/g, ''))
      : [];
    
    calls.push({ functionName, args });
  }
  
  return calls;
}

function executeToolCalls(calls) {
  // Execute whitelisted functions only
  calls.forEach(({ functionName, args }) => {
    if (aiToolFunctions[functionName]) {
      try {
        console.log(`AI calling tool: ${functionName}(${args.join(', ')})`);
        aiToolFunctions[functionName](...args);
      } catch (error) {
        console.error(`Error executing tool ${functionName}:`, error);
      }
    } else {
      console.warn(`Unknown tool function: ${functionName}`);
    }
  });
}

function showToolCallConfirmation(toolCalls) {
  return new Promise((resolve) => {
    const contentScreen = document.getElementById("content-screen");
    const cmdInput = document.getElementById("cmd-input");
    
    // Build confirmation message
    const callsList = toolCalls.map(({ functionName, args }) => {
      const argsStr = args.length > 0 ? `(${args.join(', ')})` : '()';
      return `  > ${functionName}${argsStr}`;
    }).join('<br>');
    
    const confirmationEl = document.createElement("div");
    confirmationEl.id = "ai-tool-confirmation";
    confirmationEl.style.marginTop = "10px";
    confirmationEl.style.padding = "10px";
    confirmationEl.style.border = "1px solid var(--term-dim)";
    confirmationEl.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
    confirmationEl.innerHTML = `
      <p style="color: #ffb000; margin-bottom: 8px;">> TOOL EXECUTION REQUEST:</p>
      ${callsList}
      <p style="color: var(--term-dim); margin-top: 8px; font-size: 0.9em;">
        Type 'y' and press ENTER to execute, ESC to cancel
      </p>
    `;
    contentScreen.appendChild(confirmationEl);
    contentScreen.scrollTop = contentScreen.scrollHeight;
    
    beep(600, 50, 0.05);
    
    let resolved = false;
    
    // Handle confirmation - check if confirmation element still exists
    const handleKeyPress = (e) => {
      if (resolved || !confirmationEl.parentNode) return;
      
      if (e.key === 'Enter') {
        const inputValue = cmdInput.value.trim().toLowerCase();
        if (inputValue === 'y') {
          e.preventDefault();
          e.stopPropagation();
          resolved = true;
          cmdInput.value = "";
          if (typeof resizeInput === 'function') resizeInput();
          confirmationEl.remove();
          document.removeEventListener('keydown', handleKeyPress);
          resolve(true);
        } else if (inputValue !== '') {
          // User typed something other than 'y', treat as cancel
          e.preventDefault();
          e.stopPropagation();
          resolved = true;
          cmdInput.value = "";
          if (typeof resizeInput === 'function') resizeInput();
          confirmationEl.remove();
          document.removeEventListener('keydown', handleKeyPress);
          resolve(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        resolved = true;
        cmdInput.value = "";
        if (typeof resizeInput === 'function') resizeInput();
        confirmationEl.remove();
        document.removeEventListener('keydown', handleKeyPress);
        resolve(false);
      }
    };
    
    // Use capture phase to intercept before other handlers
    document.addEventListener('keydown', handleKeyPress, true);
    cmdInput.focus();
  });
}

async function typeOutResponse(text) {
  const contentScreen = document.getElementById("content-screen");
  
  // Parse tool calls
  const toolCalls = parseToolCalls(text);
  // Remove tool calls from display text
  const displayText = text.replace(/\[CALL:\w+\([^)]*\)\]/g, '').trim();
  
  const responseEl = document.createElement("div");
  responseEl.style.color = "var(--term-green)";
  responseEl.innerHTML = `<span style="color: var(--term-light)">KITEK_AI.EXE:</span> `;
  contentScreen.appendChild(responseEl);

  const textSpan = document.createElement("span");
  responseEl.appendChild(textSpan);

  // Type out character by character
  for (let i = 0; i < displayText.length; i++) {
    textSpan.textContent += displayText[i];
    contentScreen.scrollTop = contentScreen.scrollHeight;
    
    // Random typing speed for more natural feel
    const delay = displayText[i] === " " ? 20 : (5 + Math.random() * 15);
    await new Promise(r => setTimeout(r, delay));
    
    // Occasional beep
    if (i % 20 === 0) beep(800 + Math.random() * 200, 10, 0.02);
  }
  
  // Show confirmation prompt if tool calls are present
  if (toolCalls.length > 0) {
    const confirmed = await showToolCallConfirmation(toolCalls);
    if (confirmed) {
      executeToolCalls(toolCalls);
    } else {
      const contentScreen = document.getElementById("content-screen");
      const cancelledEl = document.createElement("p");
      cancelledEl.style.color = "var(--term-dim)";
      cancelledEl.style.marginTop = "5px";
      cancelledEl.textContent = "> Tool execution cancelled.";
      contentScreen.appendChild(cancelledEl);
      contentScreen.scrollTop = contentScreen.scrollHeight;
    }
  }
}

