// Try to select the problem title from h1 or fallback to anchor tag
let titleElement = document.querySelector("h1");
let cleanTitle = "";
let problemUrl = "";

if (!titleElement) {
  // Use a robust selector for LeetCode problem links
  titleElement = document.querySelector('a[href^="/problems/"]');
  if (titleElement) {
    cleanTitle = titleElement.innerText;
    problemUrl = titleElement.href;
  } else {
    console.warn("❌ LeetCode title not found.");
    // return;
  }
} else {
  cleanTitle = titleElement.innerText;
}

// Send the problem title to the background script for popup use
if (cleanTitle) {
  chrome.runtime.sendMessage({ type: "SET_PROBLEM_TITLE", title: cleanTitle });
}

console.log("✅ LeetHelper content script loaded on:", cleanTitle, problemUrl);

// --- Gemini Hint Fetcher for LeetCode ---
// (No API key in frontend! This is for backend proxy use only)

// Helper to fetch Gemini hint from backend
async function fetchGeminiHint(problemTitle, problemDescription) {
  // Call your backend, not Gemini API directly from frontend!
  const endpoint = "http://localhost:3000/generate-hint";

  const prompt = `You are an expert coding tutor as good as striver. Given the LeetCode problem below, generate a clean, readable breakdown of the solution in the following 3 formats:\n\n1. **Brute Force Hint**:\n   - Clearly explain the naive approach.\n   - Time complexity.\n   - Key idea.\n\n2. **Optimal Hint**:\n   - Improved approach with better time complexity.\n   - Use of data structures if any.\n   - Key logic and pseudocode.\n\n3. **Most Optimal Hint**:\n   - Most efficient solution.\n   - Time and space complexity.\n   - Edge case handling.\n   - Why it's better than others.\n\n🔒 Do not include full code. Focus only on **step-by-step logic** and **reasoning** in a markdown-style format.\n\nLeetCode Problem:\nTitle: ${problemTitle}\nDescription: ${problemDescription}`;

  const body = {
    title: problemTitle,
    level: "All",
    description: problemDescription,
    customPrompt: prompt,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data?.hint || "⚠️ No hint returned.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "❌ Failed to fetch Gemini hint.";
  }
}

// Get real title & description from the LeetCode page
const title =
  document.querySelector("div[role='main'] h4")?.innerText ||
  document.querySelector("h1")?.innerText ||
  "Unknown Problem";

const descriptionElement =
  document.querySelector("div[data-track-load='description_content']") ||
  document.querySelector(".description__24sA") ||
  document.querySelector(".xFUwe");

const description =
  descriptionElement?.innerText || "No problem description found.";

// Step 1: Draggable “💡 Show Hints” Button
const showHintBtn = document.createElement("button");
showHintBtn.innerText = "💡 Show Hints";
showHintBtn.style.cssText = `
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 9999;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: move;
`;
document.body.appendChild(showHintBtn);

// Make the button draggable
let isDragging = false,
  offsetX,
  offsetY;

showHintBtn.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - showHintBtn.getBoundingClientRect().left;
  offsetY = e.clientY - showHintBtn.getBoundingClientRect().top;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    showHintBtn.style.left = `${e.clientX - offsetX}px`;
    showHintBtn.style.top = `${e.clientY - offsetY}px`;
    showHintBtn.style.right = "unset"; // override initial right
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// Step 2: Render Buttons + Auto Hide After 5 Seconds
let autoHideTimer = null;

showHintBtn.addEventListener("click", () => {
  // Remove existing buttons if already open
  const existing = document.getElementById("hint-options");
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = "hint-options";
  container.style.cssText = `
    position: fixed;
    top: ${showHintBtn.getBoundingClientRect().bottom + 10}px;
    left: ${showHintBtn.getBoundingClientRect().left}px;
    background: #222;
    padding: 20px;
    border-radius: 12px;
    color: white;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  ["Brute Force", "Optimal", "Most Optimal"].forEach((label) => {
    const btn = document.createElement("button");
    btn.innerText = label;
    btn.style.cssText = `
      background: #00aaff;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
    `;
    btn.onclick = () => {
      clearTimeout(autoHideTimer); // 🛑 Stop the timer on click
      handleHintSelection(label, container);
    };
    container.appendChild(btn);
  });

  document.body.appendChild(container);

  // 🕒 Start 5s auto-hide timer
  autoHideTimer = setTimeout(() => {
    container.remove();
  }, 5000);
});

// Step 3: Handle Hint Selection + Back Button
async function handleHintSelection(type, optionsContainer) {
  optionsContainer.remove(); // Remove buttons

  // Remove any existing hint box
  //Created by Tushar Goyal
  document.getElementById("gemini-hint-box")?.remove();

  const hintBox = document.createElement("div");
  hintBox.id = "gemini-hint-box";
  hintBox.className = "hint-box";
  hintBox.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    max-width: 600px;
    background-color: #1e1e1e;
    color: #00ff88;
    border-left: 5px solid #00ff88;
    padding: 1rem;
    font-family: 'Fira Code', monospace;
    line-height: 1.6;
    border-radius: 12px;
    z-index: 9999;
    font-size: 15px;
    overflow-y: auto;
    max-height: 70vh;
  `;

  const heading = document.createElement("h3");
  heading.innerHTML = `💡 <span style=\"color: #00ff44\">${type} Hint:</span>`;
  hintBox.appendChild(heading);

  const content = document.createElement("div");
  content.innerHTML = "<span style='color:yellow'>⏳ Loading...</span>";
  hintBox.appendChild(content);

  const backBtn = document.createElement("button");
  backBtn.innerText = "🔙 Back";
  backBtn.style.cssText = `
    margin-top: 20px;
    padding: 8px 14px;
    background: #222;
    color: white;
    border-radius: 6px;
    border: 1px solid #333;
    cursor: pointer;
  `;
  backBtn.id = "backBtn";

  backBtn.onclick = () => {
    hintBox.remove();
    showHintBtn.click(); // Restart options + auto-hide
  };

  hintBox.appendChild(backBtn);
  document.body.appendChild(hintBox);

  // Fetch and display the hint (markdown-style)
  const title = document.querySelector("h4")?.innerText || "Unknown";
  const description =
    document.querySelector("div[data-track-load='description_content']")
      ?.innerText || "No description.";
  const markdown = await fetchGeminiHint(title, description);
  // Simple markdown to HTML (basic)
  //Created by Tushar Goyal
  content.innerHTML = markdown
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>")
    .replace(/\- ([^<]+)/g, "<li>$1</li>")
    .replace(/<br>\s*<li>/g, "<ul><li>")
    .replace(/(<\/li>)(?!<li>)/g, "$1</ul>");
}
