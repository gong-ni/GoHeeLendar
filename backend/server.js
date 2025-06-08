const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const filePath = "events.json";

app.get("/events", (req, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).json({});
    res.json(JSON.parse(data || "{}"));
  });
});

app.post("/events", (req, res) => {
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).send("저장 실패");
    res.send("저장 완료");
  });
});

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
