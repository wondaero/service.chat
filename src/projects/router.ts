import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import pool from "../db";

const router = Router();

//프로젝트 생성
router.post("/", authMiddleware, async (req, res) => {
    const userAuth = (req as any).user?.auth;
    const userId = (req as any).user?.id;
    if (userAuth === 'USER') {
        return res.status(403).json({ message: "현재권한으로는 프로젝트를 생성할 수 없습니다." });
    }

    const { name, client_name, project_type, start_date, end_date, budget, status, note, required_planner, required_designer, required_publisher, required_developer, required_etc } = req.body;
    if (!name || !client_name || !project_type || !start_date || !end_date || !budget || !status) {
        return res.status(400).json({ message: "필수 정보를 모두 입력해주세요." })
    }


    try {
        const insertQuery = `
            INSERT INTO projects (name, client_name, project_type, start_date, end_date, budget, status, required_planner, required_designer, required_publisher, required_developer, required_etc, note, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id;
        `;

        const newProject = await pool.query(insertQuery, [name, client_name, project_type, start_date, end_date, budget, status, required_planner || 0, required_designer || 0, required_publisher || 0, required_developer || 0, required_etc || 0, note || null, userId]);

        return res.status(201).json({ message: "새로운 프로젝트 등록을 완료했습니다.", data: newProject.rows[0] });
    } catch (err) {
        console.error("프로젝트 생성 에러:", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }

});
//프로젝트 목록
router.get("/", authMiddleware, (req, res) => { });
//프로젝트 상세
router.get("/:projectId", authMiddleware, (req, res) => { });

export default router;
