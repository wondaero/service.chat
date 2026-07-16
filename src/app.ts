import express from "express";
import { createServer } from "http";
import { initSocket } from "./socket"; // 분리한 소켓 모듈 임포트

import userRouter from "./users/router"; // 작성한 함수 임포트
import cors from "cors";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  // 클라이언트가 요청을 보내는 정확한 주소와 포트를 지정하세요
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // 쿠키나 인증 헤더(토큰)를 사용한다면 필수
};

app.use(cors(corsOptions));

app.use("/user", userRouter);

// [중요] 여기서 소켓을 초기화해야 합니다!
initSocket(httpServer);

httpServer.listen(3000, () => {
  console.log("채팅 서버가 http://localhost:3000 에서 실행 중입니다.");
});
