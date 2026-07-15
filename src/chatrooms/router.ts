import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
const router = Router();

//방생성
router.post("/", authMiddleware, (req, res) => {});
//방목록
router.get("/", authMiddleware, (req, res) => {});
//방상세
router.get("/:roomId", authMiddleware, (req, res) => {});
//방나가기
router.post("/:roomId/leave", authMiddleware, (req, res) => {});
//과거 대화 내역 조회
router.get("/:roomId/messages", authMiddleware, (req, res) => {});

//참여 추가
router.post("/:roomId/participants/:userId", authMiddleware, (req, res) => {});
//참여 수정(마지막 읽은 페이지, 마지막 메시지)
router.patch("/:roomId/participants/:userId", authMiddleware, (req, res) => {});

export default router;
