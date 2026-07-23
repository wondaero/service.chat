import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import pool from "../db"
import { PROJECT_STATUS } from "../../common/constants";

const router = Router();

interface Participant {
    id: number;
    name: string;
    mm_value: number;
    monthly_cost: number;
}

interface RawProject {
    id: number;
    name: string;
    client_name: string;
    project_type: string;
    start_date: string;
    end_date: string;
    budget: number | string; // 마스킹 후에는 '********' 문자열이 되므로 유니온 타입!
    status: string;
    dept: string;
    created_by: number;
    required_planner: number;
    required_designer: number;
    required_publisher: number;
    required_developer: number;
    required_etc: number;
    note: string | null;
    participants: Participant[]; // 🎯 JSON_AGG로 묶인 배열 타입 지정!
    totalCost?: number;
}


/**
 * @openapi
 * /screen/dashboard:
 *   get:
 *     summary: 대시보드 화면 초기화 데이터 조회
 *     description: 대시보드 화면 진입 시 필요한 화면 권한(screen_permissions) 및 진행 중인 프로젝트 목록을 조회합니다.
 *     tags: [Screens & UI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 데이터 조회 성공
 */
router.get("/dashboard", authMiddleware, async (req, res) => {

    const userAuth = (req as any).user?.auth;
    const userId = (req as any).user?.id;
    const userDept = (req as any).user?.dept;
    try {
        const screenPermission = await pool.query("SELECT * FROM screen_permissions WHERE screen_id = 'DASHBOARD'");
        const cstmScreenPermission: Record<string, { name: string; allow: boolean }> = {};
        screenPermission.rows.forEach((d: any) => {
            cstmScreenPermission[d.feature_code] = {
                name: d.feature_name,
                allow: userAuth === 'USER' ? d.allow_user : d.allow_admin,
            }
        });
        const projectQuery = `
            SELECT pj.*,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', pt.user_id, 
                        'mm_value', pt.mm_value,
                        'monthly_cost', pt.monthly_cost,
                        'name', u.name
                    )
                ) FILTER (WHERE pt.id IS NOT NULL),
                 '[]'::json
            ) AS participants
            FROM projects AS pj
            LEFT JOIN participants AS pt ON pj.id = pt.project_id
            LEFT JOIN users AS u ON pt.user_id = u.id
            WHERE pj.status != '${PROJECT_STATUS.COMPLETED}'
            GROUP BY pj.id
            ORDER BY pj.start_date DESC;
        `;
        const currentProject = await pool.query(projectQuery);

        const authFilter = () => userAuth !== 'USER';

        const cstmProjectData = currentProject.rows.map((p: RawProject) => {
            return ({
                ...p,
                budget: authFilter() ? p.budget : '***',
                totalCost: authFilter() ? (p.participants.reduce((prev: number, curr: Participant) => prev + Number(curr.monthly_cost), 0) || 0) : '***',
                participants: p.participants.map((u: Participant) => ({ id: u.id, name: u.name }))
            })
        })

        // 🎯 오늘 날짜 기준선 정의 (비교용)
        const today = new Date();

        return res.status(200).json({
            message: "성공적으로 대시보드 데이터를 가져왔습니다",
            data: {
                screenPermission: cstmScreenPermission,
                projects: cstmProjectData,
                allBudge: authFilter() ? cstmProjectData.reduce((prev: number, curr: RawProject) => prev + Number(curr.budget), 0) : '***',
                allCost: authFilter() ? cstmProjectData.reduce((prev: number, curr: RawProject) => prev + (curr.totalCost || 0), 0) : '***',
                // 🎯 예산 초과(totalBudget < totalCost) 혹은 종료 일자가 지났는데 완료되지 않은 경우(new Date(p.end_date) < today) 경고 카운트!
                warningCnt: authFilter()
                    ? cstmProjectData.filter((p: any) =>
                        Number(p.budget) < Number(p.totalCost) || new Date(p.end_date) < today
                    ).length
                    : '***',
                overBudgetCnt: authFilter()
                    ? cstmProjectData.filter((p: any) => Number(p.budget) < Number(p.totalCost)).length : '***',
                overdueCnt: authFilter()
                    ? cstmProjectData.filter((p: any) => new Date(p.end_date) < today).length : '***',
            }
        });
    }
    catch (err) {
        console.error("대시보드 데이터 조회 에러:", err);
        return res.status(500).json({ message: "서버 오류가 발생했습니다." })
    }
});

export default router;
