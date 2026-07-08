import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import userRouter from "./users/router"; // 작성한 함수 임포트

const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }, // 프론트엔드 연결 허용
});

io.on("connection", (socket) => {
  console.log("사용자 접속:", socket.id);

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // 모든 클라이언트에게 전송
  });
});

app.use("/user", userRouter);

httpServer.listen(3000, () => {
  console.log("채팅 서버가 http://localhost:3000 에서 실행 중입니다.");
});
