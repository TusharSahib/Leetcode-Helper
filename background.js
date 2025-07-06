let currentProblemTitle = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const levelMap = {
    Brute: "Brute Force",
    Optimal: "Optimal",
    MostOptimal: "Most Optimal",
  };

  // Store the current problem title for popup
  if (request.type === "SET_PROBLEM_TITLE") {
    currentProblemTitle = request.title;
    return;
  }
  // Provide the current problem title to popup
  if (request.type === "GET_PROBLEM_TITLE") {
    sendResponse({ title: currentProblemTitle });
    return;
  }

  fetch("http://localhost:3000/generate-hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: request.problem,
      level: levelMap[request.type],
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      sendResponse({ hint: data.hint });
    })
    .catch((err) => {
      console.error("Backend error:", err);
      sendResponse({ hint: "Failed to get hint from AI" });
    });

  // Needed for async response
  return true;
});
