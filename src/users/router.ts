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
  role?: string;
}

const getPepperedPw = (pw: string) => pepper1 + pw + pepper2;

const remakePassword = async (pw: string) => {
  return bcrypt.hash(getPepperedPw(pw), 10);
}


/**
 * @openapi
 * /user/signup:
 *   post:
 *     summary: 회원가입 (신규 직원 계정 생성)
 *     tags: [Users & Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pw
 *               - name
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@company.com
 *               pw:
 *                 type: string
 *                 example: "1234"
 *               name:
 *                 type: string
 *                 example: 홍길동
 *               phone:
 *                 type: string
 *                 example: 010-1234-5678
 *     responses:
 *       201:
 *         description: 회원가입 완료 성공
 *       400:
 *         description: 필수 정보 입력 누락
 *       409:
 *         description: 이미 사용 중인 이메일
 */
//회원가입
router.post("/signup", async (req, res) => {
  const { email, pw, name, phone, dept, role } = req.body;
  if (!email || !pw || !name || !phone) {
    return res.status(400).json({ message: "필수 정보를 모두 입력해주세요." })
  }

  try {
    const userCheck = await pool.query("SELECT email FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "이미 사용 중인 이메일입니다." });
    }

    const insertQuery = `
      INSERT INTO users (email, password, name, phone, dept, role)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(insertQuery, [email, await remakePassword(pw), name, phone, dept || null, role || null]);

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.log('회원가입 에러:', err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." })
  }
});

/**
 * @openapi
 * /user/login:
 *   post:
 *     summary: 로그인 (JWT 토큰 발급)
 *     tags: [Users & Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - pw
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin
 *               pw:
 *                 type: string
 *                 example: "0000"
 *     responses:
 *       200:
 *         description: 로그인 성공 및 토큰 반환
 *       401:
 *         description: 아이디 또는 비밀번호 불일치
 */
//로그인
router.post("/login", async (req, res) => {
  const { email, pw } = req.body;

  console.log(11, req.body)

  // 1. 데이터 검증 (입력값이 없는 경우)
  if (!email || !pw) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    const validUser = userCheck.rows[0];

    console.log(validUser);

    if (!validUser) {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(getPepperedPw(pw), validUser.password);

    if (isMatch) {
      // JWT 발행
      const token = jwt.sign(
        { id: validUser.id, name: validUser.name, auth: validUser.auth }, // 페이로드
        SECRET_KEY, // 시크릿 키
        { expiresIn: "1h" }, // 유효시간 1시간
      );

      const { password, ...userInfo } = validUser;

      return res.status(200).json({ message: "성공적으로 로그인했습니다.", data: userInfo, token });
    } else {
      return res.status(401).json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }
  }
  catch (err) {
    console.log("로그인 에러:", err);
    return res.status(500).json({ logined: false, message: "서버 오류가 발생했습니다." })
  }
});

//유저정보 변경(비밀번호 포함)
router.patch("/:userId", authMiddleware, (req, res) => { });

//유저 삭제
router.delete("/:userId", authMiddleware, (req, res) => { });

/**
 * @openapi
 * /user:
 *   get:
 *     summary: 유저 목록 조회
 *     tags: [Users & Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 유저 목록 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   dept:
 *                     type: string
 *                   role:
 *                     type: string
 *                   status:
 *                     type: string
 */
//유저 목록
router.get("/", authMiddleware, async (req, res) => {
  const { name, email, phone, dept, role, level, position, status } = req.query;

  try {
    const conditions: string[] = [];
    const values: any[] = [];


    const addWhere = (obj: Record<string, any>) => {
      const colName = Object.keys(obj)[0];
      const val = Object.values(obj)[0];

      if (val) {
        values.push(val);
        conditions.push(`${colName} = $${values.length}`);
      }
    }


    addWhere({ name });
    addWhere({ email });
    addWhere({ phone });
    addWhere({ dept });
    addWhere({ role });
    addWhere({ level });
    addWhere({ position });
    addWhere({ status });


    const whereSql = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const userList = await pool.query(`SELECT * FROM users ${whereSql} ORDER BY name ASC`, values);

    const currentUserAuth = (req as any).user?.auth;

    let resultData = userList.rows;
    if (currentUserAuth !== 'ADMIN') {
      // 일반 유저 (USER): 비밀번호, monthly_cost 제거
      resultData = userList.rows.map((user: any) => {
        const { password, monthly_cost, ...safeUser } = user;
        return safeUser;
      });
    } else {
      // 관리자 (ADMIN): 비밀번호만 제거 (monthly_cost는 보임)
      resultData = userList.rows.map((user: any) => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
    }
    return res.status(200).json({ message: "유저 목록 조회가 완료되었습니다.", data: resultData });
  } catch (err) {
    return res.status(500).json({ message: "서버 오류가 발생했습니다." })
  }

});

/**
 * @openapi
 * /user/{userId}:
 *   get:
 *     summary: 유저 상세 정보 조회
 *     tags: [Users & Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 유저 상세 정보 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 dept:
 *                   type: string
 *                 role:
 *                   type: string
 *                 level:
 *                   type: string
 *                 position:
 *                   type: string
 *                 monthly_cost:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 note:
 *                   type: string
 */
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
