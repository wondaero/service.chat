import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: "인증 토큰이 없습니다." });
    return; // TypeScript에서는 여기서 return을 명시해주는 것이 좋습니다.
  }

  // 인증 로직...
  next();
};
