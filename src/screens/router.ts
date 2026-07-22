import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import pool from "../db"
import { PROJECT_STATUS } from "../../common/constants";

const router = Router();


//로그인
router.post("/dashboard", authMiddleware, async (req, res) => {
    try {
        const screenPermission = await pool.query("SELECT * FROM screen_permissions WHERE screen_id = 'dashboard'");
        const projectQuery = `
            SELECT pj.*,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        id: pt.user_id, 
                        mm_value: pt.mm_value,
                        monthly_cost: pt.monthly_cost
                        name: u.name
                    )
                ) FILTER (WHERE pt.id IS NOT NULL),
                 '[]'::json
            ) AS participants
            FROM projects AS pj
            LEFT JOIN participants AS pt
            ON pj.id = pt.project_id
            LEFT JOIN users as u
            ON pt.user_id = u.id
            WHERE pj.status != '${PROJECT_STATUS.COMPLETED}'
            GROUP BY pj.id;
        `;
        const currentProject = await pool.query(projectQuery);




        return;

        if (!validUser) {
            return res.status(401).json({ message: "아이디 또는 비밀번호가 잘못되었습니다2." });
        }

        const isMatch = await bcrypt.compare(getPepperedPw(pw), validUser.password);

        if (isMatch) {
            // JWT 발행
            const token = jwt.sign(
                { id: validUser.id, email: validUser.email, name: validUser.name, auth: validUser.auth }, // 페이로드
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

export default router;
