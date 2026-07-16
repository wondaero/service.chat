import { Pool } from "pg";
import dotenv from "dotenv";

// .env 파일의 데이터베이스 연결 정보를 읽어옵니다.
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
});

export default pool;