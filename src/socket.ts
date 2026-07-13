import { Server } from "socket.io";
import { Server as HttpServer } from "http";

const corsOptions = {
  // 클라이언트가 요청을 보내는 정확한 주소와 포트를 지정하세요
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // 쿠키나 인증 헤더(토큰)를 사용한다면 필수
};

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: corsOptions, // 필요시 corsOptions 설정
  });

  io.use((socket, next) => {
    // 여기서 인증(Auth) 로직 수행
    const token = socket.handshake.auth.token;
    if (token) {
      next();
    } else {
      next(new Error("인증 실패"));
    }
  });

  io.on("connection", (socket) => {
    console.log("사용자 접속:", socket.id);

    // 알림 채널 자동 Join 등 서버 주도 로직
    socket.on("login", (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on("chat message", (msg) => {
      io.emit("chat message", msg);
    });
  });

  return io;
};
