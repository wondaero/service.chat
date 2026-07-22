import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "M/M Resource Planner API 문서",
      version: "1.0.0",
      description: "인력 관리 및 자원 배정 시스템 백엔드 API 명세서",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "로컬 개발 서버",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    path.resolve(process.cwd(), "src/users/router.ts").replace(/\\/g, "/"),
    path.resolve(process.cwd(), "src/**/*.ts").replace(/\\/g, "/"),
    path.resolve(__dirname, "./**/*.ts").replace(/\\/g, "/"),
  ], // Windows 경로 슬래시(/) 변환 매칭
};

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, (req: any, res: any, next: any) => {
    const specs = swaggerJsdoc(options);
    swaggerUi.setup(specs)(req, res, next);
  });
  console.log("📑 Swagger API 문서 준비 완료: http://localhost:3000/api-docs");
};
