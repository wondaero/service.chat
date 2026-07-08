import { Router } from "express";

const router = Router();

// [인증 관련]
router.get("/login", (req, res) => {
  // 1. req.body에서 아이디/비번 추출
  // 2. 유저 테이블 조회 (DB)
  // 3. 비밀번호 검증
  // 4. 세션 생성 또는 JWT 토큰 발행
  res.json({ message: "200" });
});
router.post("/login", (req, res) => {
  // 1. req.body에서 아이디/비번 추출
  // 2. 유저 테이블 조회 (DB)
  // 3. 비밀번호 검증
  // 4. 세션 생성 또는 JWT 토큰 발행
  res.json({ res: 200 });
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
