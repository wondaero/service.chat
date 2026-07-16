import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import jwt from "jsonwebtoken";
import pool from "../db"
import bcrypt from "bcryptjs";

const SECRET_KEY = "test1";

const router = Router();

const pepper1 = process.env.PASSWORD_PEPPER1 || "";
const pepper2 = process.env.PASSWORD_PEPPER2 || "";


interface User {
  account: string;
  password: string;
  phone: string;
  dept?: string;
  roles?: string;
}

const remakePassword = async (pw: string) => {
  return bcrypt.hash(pepper1 + pw + pepper2, 10);
}

//회원가입
router.post("/signup", async (req, res) => {
  const { account, pw, name, phone, dept, roles } = req.body;
  if (!account || !pw || !name || !phone) {
    return res.status(400).json({ message: "필수 정보를 모두 입력해주세요." })
  }

  try {
    const userCheck = await pool.query("SELECT account FROM users WHERE account = $1", [account]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "이미 사용 중인 아이디입니다." });
    }

    const insertQuery = `
      INSERT INTO users (account, password, name, phone, dept, roles)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(insertQuery, [account, await remakePassword(pw), name, phone, dept || null, roles || null]);

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.log('회원가입 에러:', err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." })
  }
});

//로그인
router.post("/login", async (req, res) => {
  const { account, pw } = req.body;

  // 1. 데이터 검증 (입력값이 없는 경우)
  if (!account || !pw) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE account = $1", [account]);

    const validUser = userCheck.rows[0];

    if (!validUser) {
      return res.status(401).json({ logined: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(pepper1 + pw + pepper2, validUser.password);

    if (isMatch) {
      // JWT 발행
      const token = jwt.sign(
        { id: validUser.id, name: validUser.name }, // 페이로드
        SECRET_KEY, // 시크릿 키
        { expiresIn: "1h" }, // 유효시간 1시간
      );

      return res.status(200).json({ logined: true, message: "성공적으로 로그인했습니다.", token });
    } else {
      return res.status(401).json({ logined: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }
  }
  catch (err) {
    console.log("로그인 에러:", err);
    return res.status(500).json({ logined: false, message: "서버 오류가 발생했습니다." })
  }
});

//로그아웃
router.post("/logout", authMiddleware, (req, res) => { });

//유저정보 변경(비밀번호 포함)
router.patch("/:userId", authMiddleware, (req, res) => { });

//유저 삭제
router.delete("/:userId", authMiddleware, (req, res) => { });

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
