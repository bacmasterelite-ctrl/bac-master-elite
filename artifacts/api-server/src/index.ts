import express from "express";

const app = express();

// Route test
app.get("/", (req, res) => {
  res.send("SERVER OK");
});

// Port Replit
const PORT = process.env.PORT || 3000;

// ⚡ IMPORTANT : ajouter "0.0.0.0"
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});