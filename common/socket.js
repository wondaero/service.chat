let socket;

function connectSocket(token) {
    if (socket) {
        console.log("이미 연결된 소켓이 있음");
        return;
    }
    socket = io("http://localhost:3000", {
        auth: {
            token: token
        },
    });

    // 1. 연결 성공 이벤트
    socket.on("connect", () => {
        console.log("서버와 연결 성공! 연결 ID:", socket.id);
    });

    // 2. 서버로부터 메시지 수신 (이벤트명: 'message')
    socket.on("message", (data) => {
        console.log("서버에서 받은 데이터:", data);
    });

    // 3. 서버로 데이터 전송
    const sendToServer = () => {
        socket.emit("chat", { msg: "안녕 서버야" });
    };

    // 4. 연결 종료 처리
    socket.on("disconnect", () => {
        console.log("연결이 끊어졌습니다.");
    });

    socket.on("welcome-msg", (data) => {
        console.log("서버로부터 받은 메시지:", data);
    });
}
