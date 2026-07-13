import { Router } from "express";
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

// [인증 관련]
router.get("/login", (req, res) => {
  // 1. req.body에서 아이디/비번 추출
  // 2. 유저 테이블 조회 (DB)
  // 3. 비밀번호 검증
  // 4. 세션 생성 또는 JWT 토큰 발행
  res.json({ message: "200" });
});

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

router.get("/getUserList", (req, res) => {
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

// //유저 상세 조회
// export const getUserDetail = (userId: string) => {
//   return {
//     이름: "abc",
//     연락처: "010-0000-0000",
//     부서: "파트",
//     직책: "직책",
//     상태: "휴가중",
//   };
// };

// //로그인
// export const login = (userId: string, password: string) => {
//   //세션담기
// };

// interface User {
//   userId: string;
//   password: string;
//   phone: string;
//   dept?: string;
//   roles?: string;
// }

// //회원가입
// export const signUp = (user: User) => {};

// //회원탈퇴
// export const delUser = (userId: string, password: string) => {};

export default router; // 반드시 이게 있어야 합니다!
