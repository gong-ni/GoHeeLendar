import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 10000;
const DATA_FILE = path.resolve("events.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..", "frontend")));

// 일정 데이터 읽기 API
app.get("/events", (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch {
    res.json({}); // 파일 없으면 빈 객체 리턴
  }
});

// 일정 저장 API
app.post("/events", (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), "utf-8");
    res.json({ message: "저장 완료" });
  } catch {
    res.status(500).json({ error: "저장 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

console.log("Static folder:", path.resolve("frontend"));

