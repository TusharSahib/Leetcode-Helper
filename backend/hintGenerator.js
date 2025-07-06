import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function generateHint(
  title,
  level,
  description = "",
  customPrompt = ""
) {
  console.log(
    "generateHint called with title:",
    title,
    "level:",
    level,
    "description:",
    description
  );
  if (!title || !level) {
    console.log("Missing title or level:", title, level);
    return "❌ Problem title or approach not detected.";
  }
  // Use custom prompt if provided, else default
  //Created by Tushar Goyal
  const prompt =
    customPrompt ||
    `\nYou are a helpful LeetCode tutor.\n\nGiven the following LeetCode problem:\nTitle: \"${title}\"\nDescription: \"${description}\"\nProvide a step-by-step hint for the \"${level}\" approach.\nDo NOT provide code. Only describe the logic and reasoning needed to solve the problem at this level.\nIf brute force and optimal are the same, mention that.\nBe clear, concise, and helpful.`;
  console.log("Prompt sent to Gemini:", prompt);

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    console.log("Gemini API raw response:", JSON.stringify(data, null, 2));
    // Gemini's response format
    const hint =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.error?.message ||
      "Failed to get hint from Gemini API.";
    return hint;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gemini API failed");
  }
}
