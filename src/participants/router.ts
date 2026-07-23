import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import pool from "../db";

const router = Router();

/**
 * @openapi
 * /participant:
 *   post:
 *     summary: "프로젝트에 여러 투입 인원 추가"
 *     description: "특정 프로젝트에 여러 유저(직원)들을 동시 투입하여 배치 목록을 생성합니다."
 *     tags:
 *       - "Participants"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: "object"
 *             required:
 *               - "project_id"
 *               - "users"
 *             properties:
 *               project_id:
 *                 type: "integer"
 *                 example: 1
 *               users:
 *                 type: "array"
 *                 description: "투입 유저 객체들의 배열"
 *                 items:
 *                   type: "object"
 *                   required:
 *                     - "id"
 *                     - "start_date"
 *                     - "end_date"
 *                     - "mm_value"
 *                     - "monthly_cost"
 *                     - "role"
 *                     - "level"
 *                   properties:
 *                     id:
 *                       type: "integer"
 *                       example: 3
 *                     start_date:
 *                       type: "string"
 *                       example: "2026-08-01"
 *                     end_date:
 *                       type: "string"
 *                       example: "2026-12-31"
 *                     mm_value:
 *                       type: "number"
 *                       example: 1.0
 *                     monthly_cost:
 *                       type: "integer"
 *                       example: 3500000
 *                     role:
 *                       type: "string"
 *                       example: "DEVELOPER"
 *                     level:
 *                       type: "string"
 *                       example: "MID"
 *                     note:
 *                       type: "string"
 *                       example: "프로젝트 리드 개발자로 투입"
 *     responses:
 *       200:
 *         description: "투입 인력 등록 성공"
 *       400:
 *         description: "필수 값 누락 또는 데이터 포맷 에러"
 *       403:
 *         description: "권한 없음 (부서가 일치하지 않거나 일반 USER인 경우)"
 *       404:
 *         description: "프로젝트를 찾을 수 없음"
 *       500:
 *         description: "서버 오류"
 */
router.post("/", authMiddleware, async (req, res) => {
    const userAuth = (req as any).user?.auth;
    const userDept = (req as any).user?.dept;
    if (userAuth === 'USER') {
        return res.status(403).json({ message: "현재권한으로는 프로젝트에 참여할 수 없습니다." });
    }

    const { project_id, users } = req.body;

    if (!project_id || !users || users.length === 0) {
        return res.status(400).json({ message: "필수 값이 없습니다." });
    }

    let valid = true;
    for (const user of users) {
        const { id, start_date, end_date, mm_value, monthly_cost, role, level, note } = user;
        if (!id || !start_date || !end_date || mm_value === '' || mm_value === undefined || mm_value === null ||
            monthly_cost === '' || monthly_cost === undefined || monthly_cost === null || !role || !level) {
            valid = false;
            break;
        }
    }

    if (!valid) {
        return res.status(400).json({ message: "참여인력의 필수 정보가 누락되었습니다." });
    }

    const targetProject = await pool.query("SELECT * FROM projects WHERE id = $1", [project_id]);

    if (targetProject.rows.length === 0) {
        return res.status(404).json({ message: "프로젝트를 찾을 수 없습니다." });
    }

    const dept = targetProject.rows[0].dept;
    if (userDept !== dept && userAuth !== 'SUPERADMIN') {
        return res.status(403).json({ message: "권한이 없습니다." });
    }

    try {
        await pool.query("BEGIN");
        const insertQuery = `INSERT INTO participants (project_id, user_id, start_date, end_date, mm_value, monthly_cost, role, level, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

        for (const user of users) {
            const { id, start_date, end_date, mm_value, monthly_cost, role, level, note } = user;
            await pool.query(insertQuery, [project_id, id, start_date, end_date, mm_value, monthly_cost, role, level, note || '']);
        }

        await pool.query("COMMIT");
        return res.status(200).json({ message: "참여 인력 등록을 완료했습니다." });
    } catch (err) {
        await pool.query("ROLLBACK");
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

export default router;
