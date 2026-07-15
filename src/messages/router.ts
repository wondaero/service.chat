import { Router } from "express";

const router = Router();

//메시지 추가
router.post("/regMessage", (req, res) => {});
//메시지 수정(삭제 기능 포함(isHidden))
router.post("/editMessage", (req, res) => {});

export default router; // 반드시 이게 있어야 합니다!
