import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import jwt from "jsonwebtoken";

const SECRET_KEY = "test1";

const router = Router();

const tmpData = {
  users: [
    { id: "a", pw: "11", name: "사용자a" },
    { id: "b", pw: "22", name: "사용자b" },
    { id: "c", pw: "33", name: "사용자c" },
  ],
};

interface User {
  userId: string;
  password: string;
  phone: string;
  dept?: string;
  roles?: string;
}

//회원가입
router.post("/signUp", (req, res) => {});

//로그인
router.post("/login", (req, res) => {
  const { id, pw } = req.body;

  // 1. 데이터 검증 (입력값이 없는 경우)
  if (!id || !pw) {
    return res
      .status(400)
      .json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  // 2. 유저 조회
  const validUser = tmpData.users.find(
    (user) => user.id === id && user.pw === pw,
  );

  // 3. 결과 응답 (Early Return 패턴 사용)
  if (!validUser) {
    return res.status(401).json({ logined: false, message: "로그인 실패" });
  }

  // JWT 발행
  const token = jwt.sign(
    { id: validUser.id, name: validUser.name }, // 페이로드
    SECRET_KEY, // 시크릿 키
    { expiresIn: "1h" }, // 유효시간 1시간
  );

  // 4. 성공 시 처리
  res.json({ logined: true, message: "로그인 성공", token });
});

//로그아웃
router.post("/logout", authMiddleware, (req, res) => {});

//유저정보 변경(비밀번호 포함)
router.patch("/:userId", authMiddleware, (req, res) => {});

//유저 삭제
router.delete("/:userId", authMiddleware, (req, res) => {});

//유저 목록
router.get("/", authMiddleware, (req, res) => {
  res.json([
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
    {
      이름: "abc",
      부서: "파트",
      직책: "직책",
      상태: "접속중",
    },
  ]);
});

//유저 상세 정보
router.get("/:userId", authMiddleware, (req, res) => {
  return {
    이름: "abc",
    연락처: "010-0000-0000",
    부서: "파트",
    직책: "직책",
    상태: "휴가중",
  };
});

export default router;
