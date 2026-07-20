import pool from "./db";

const dropTablesQuery = `
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
`;

// 마스터 데이터 테이블 (부서, 직급, 직군, 등급 등 공통 코드 관리)
const mastersTable = `
    CREATE TABLE masters (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,   -- 카테고리 구분 (예: 'DEPT', 'POSITION', 'JOB_FAMILY')
        code VARCHAR(50) NOT NULL,       -- 숫자 코드 (예: '001', '002', '003')
        code_name VARCHAR(100) NOT NULL, -- 한글 표기명 (예: '개발본부', '기획본부', '팀장')
        description TEXT,                -- 설명
        sort_order INT DEFAULT 0,        -- 정렬 순서
        is_active BOOLEAN DEFAULT TRUE,  -- 사용 여부
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (category, code)
    );
`;

// 유저 / 직원 테이블 (UI 01 반영)
const userTable = `
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(50) UNIQUE NOT NULL, -- id로 활용
        password VARCHAR(255) NOT NULL, -- 로그인 P/W로 사용
        auth VARCHAR(20) NOT NULL DEFAULT 'USER', -- 권한
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        dept VARCHAR(100),         -- 부서
        role VARCHAR(50),    -- 직군/롤 (기획, 디자인, 개발 등)
        level VARCHAR(50),         -- 등급 (초급, 중급, 고급, 특급)
        position VARCHAR(50),      -- 직급 (사원, 선임, 수석, 팀장 등)
        monthly_cost INT DEFAULT 0, -- 월 인건비/원가
        status VARCHAR(50) DEFAULT '재직', -- 상태 (재직, 휴직, 퇴사)
        note TEXT,                 -- 비고
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// 프로젝트 테이블 (UI 02, UI 04 반영)
const projectsTable = `
    CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_name VARCHAR(100),       -- 고객사 (예: OO기업)
        project_type VARCHAR(50),       -- 유형 (예: 구축/SI, 유지보수/SM)
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        budget BIGINT DEFAULT 0,        -- 수주 금액/예산
        progress_rate INT DEFAULT 0,    -- 진행률 (%)
        status VARCHAR(50) DEFAULT '진행중', -- 상태 (대기, 진행중, 완료)
        note TEXT,                      -- 비고 / 메모 / 특이사항
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// 프로젝트 인력 배치 / M/M 배정 테이블 (UI 02, UI 03 반영)
const participantsTable = `
    CREATE TABLE participants (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES projects(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        mm_value NUMERIC(3, 2) NOT NULL DEFAULT 1.0, -- 투입 공수 (예: 0.5 M/M, 1.0 M/M)
        monthly_cost INT DEFAULT 0,                  -- 프로젝트 적용 월 인건비/단가
        role VARCHAR(50),                             -- 투입 역할
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// 성능 최적화를 위한 인덱스 생성
const indexQueries = `
    -- 1. 마스터 테이블: 카테고리별 조회 및 정렬 속도 향상
    CREATE INDEX idx_masters_category ON masters(category, is_active, sort_order);

    -- 2. 유저 테이블: 부서 및 재직 상태 검색 속도 향상
    CREATE INDEX idx_users_dept ON users(dept);
    CREATE INDEX idx_users_status ON users(status);
    CREATE INDEX idx_role ON users(role);

    -- 3. 프로젝트 인력 배치 테이블: 조인 및 기간 검색(M/M 플래너) 최적화
    CREATE INDEX idx_participants_project_id ON participants(project_id);
    CREATE INDEX idx_participants_user_id ON participants(user_id);
    CREATE INDEX idx_participants_dates ON participants(start_date, end_date);
`;

const insertSeedDataQuery = `
    -- 부서
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('DEPT', '0101', '경영기획팀'),
    ('DEPT', '0102', '인사팀'),
    ('DEPT', '0103', '재무팀'),
    ('DEPT', '0104', '영업팀'),
    ('DEPT', '0105', 'IT팀'),
    ('DEPT', '0106', '마케팅팀'),
    ('DEPT', '0107', '디자인팀');

    -- 직급
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('POSITION', '0201', '대표'),
    ('POSITION', '0202', '부대표'),
    ('POSITION', '0203', '전무'),
    ('POSITION', '0204', '상무'),
    ('POSITION', '0205', '부장'),
    ('POSITION', '0206', '차장'),
    ('POSITION', '0207', '과장'),
    ('POSITION', '0208', '대리'),
    ('POSITION', '0209', '사원');

    -- 직군
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('ROLE', '0301', '기획'),
    ('ROLE', '0302', '디자인'),
    ('ROLE', '0303', '퍼블'),
    ('ROLE', '0304', '개발');

    -- 등급
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('LEVEL', '0401', '초급'),
    ('LEVEL', '0402', '중급'),
    ('LEVEL', '0403', '고급'),
    ('LEVEL', '0404', '특급');

    -- 유저
    INSERT INTO users (email, password, auth, name, phone, dept, role, level, position, monthly_cost, status, note)
    VALUES
    ('admin','0000','ADMIN','관리자','010-0000-0000','경영기획팀','기획','초급','사원',1000000,'재직','테스트'),
    ('aa@fuz.co.kr','0000','USER','김인사','010-0000-0000','인사팀','기획','고급','대리',1000000,'재직','테스트'),
    ('bb@fuz.co.kr','0000','USER','이재무','010-0000-0000','재무팀','디자인','중급','과장',1000000,'재직','테스트'),
    ('cc@fuz.co.kr','0000','USER','박영업','010-0000-0000','영업팀','퍼블','특급','부장',1000000,'재직','테스트'),
    ('dd@fuz.co.kr','0000','USER','최마케','010-0000-0000','마케팅팀','개발','초급','사원',1000000,'휴직','테스트'),
    ('ee@fuz.co.kr','0000','USER','강디자인','010-0000-0000','디자인팀','기획','고급','차장',1000000,'재직','테스트'),
    ('ff@fuz.co.kr','0000','USER','정IT','010-0000-0000','IT팀','디자인','초급','사원',1000000,'재직','테스트'),
    ('gg@fuz.co.kr','0000','USER','오기획','010-0000-0000','경영기획팀','퍼블','중급','대리',1000000,'재직','테스트'),
    ('hh@fuz.co.kr','0000','USER','신개발','010-0000-0000','개발팀','개발','고급','과장',1000000,'재직','테스트');
`;

async function initDb() {
    try {
        console.log("Dropping schema for full reset...");
        await pool.query(dropTablesQuery);

        console.log("Initializing database tables for M/M Resource Planner...");
        const createAllTables = `
            ${mastersTable}
            ${userTable}
            ${projectsTable}
            ${participantsTable}
            /*${indexQueries}*/
            ${insertSeedDataQuery}
        `;
        await pool.query(createAllTables);

        console.log("Database tables initialized and indexed successfully.");
    } catch (error) {
        console.error("Error initializing database tables:", error);
    } finally {
        await pool.end();
    }
}

initDb();

//npx ts-node src/init-db.ts
