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
    "./src/users/router.ts",
    "./src/**/*.ts",
    path.join(process.cwd(), "src/**/*.ts").replace(/\\/g, "/"),
  ], // Windows 경로 슬래시(/) 변환 매칭
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
  console.log("📑 Swagger API 문서 준비 완료: http://localhost:3000/api-docs");
};
