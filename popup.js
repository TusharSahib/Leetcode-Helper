document.addEventListener("DOMContentLoaded", function () {
  // Set the problem title in the popup
  chrome.runtime.sendMessage(
    { type: "GET_PROBLEM_TITLE" },
    function (response) {
      if (response && response.title) {
        document.querySelector("h3").innerText = response.title;
      } else {
        document.querySelector("h3").innerText = "LeetCode Helper";
      }
    }
  );

  // Add event listeners to buttons
  [
    { id: "hintBrute", type: "Brute" },
    { id: "hintOptimal", type: "Optimal" },
    { id: "hintMostOptimal", type: "MostOptimal" },
  ].forEach(({ id, type }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", function () {
        // Get the current problem title again
        chrome.runtime.sendMessage(
          { type: "GET_PROBLEM_TITLE" },
          function (response) {
            const title = response && response.title ? response.title : "";
            if (!title) {
              document.getElementById("hintOutput").innerText =
                "❌ No problem detected.";
              return;
            }
            chrome.runtime.sendMessage(
              { type, problem: title },
              function (resp) {
                document.getElementById("hintOutput").innerText =
                  resp && resp.hint
                    ? resp.hint
                    : "❌ Unable to fetch hint. Try again.";
              }
            );
          }
        );
      });
    }
  });
});
