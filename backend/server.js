import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateHint } from "./hintGenerator.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-hint", async (req, res) => {
  const { title, level, description } = req.body;

  try {
    const hint = await generateHint(title, level, description);
    res.json({ hint });
  } catch (err) {
    res.status(500).json({ hint: "Failed to generate hint." });
  }
});

app.listen(3000, () => {
  console.log("Hint server running on http://localhost:3000");
});
