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
        status VARCHAR(50) DEFAULT 'ACTIVE', -- 상태 (ACTIVE, ON_LEAVE, RETIRED)
        is_approved BOOLEAN DEFAULT FALSE,  -- 가입 승인 여부 (기본값 FALSE)
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
        status VARCHAR(50) DEFAULT '진행중', -- 상태 (대기, 진행중, 완료)
        required_planner INT DEFAULT 0, -- 필요한 기획자
        required_designer INT DEFAULT 0, -- 필요한 디자이너
        required_publisher INT DEFAULT 0, -- 필요한 퍼블리셔
        required_developer INT DEFAULT 0, -- 필요한 개발자
        required_etc INT DEFAULT 0, -- 기타 필요한 인력
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        dept VARCHAR(50) NOT NULL,
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
        level VARCHAR(50),                            -- 투입 당시 등급 (예: JUNIOR, MID, SENIOR, EXPERT)
        note TEXT,                                    -- 비고
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// 화면 및 세부 기능 단위 권한 관리 테이블 (UI 01~05 세부 권한 반영)
const screenPermissionsTable = `
    CREATE TABLE screen_permissions (
        id SERIAL PRIMARY KEY,
        screen_id VARCHAR(50) NOT NULL,      -- 화면 ID (예: 'USER_LIST', 'PROJECT_DETAIL')
        feature_code VARCHAR(50) NOT NULL,   -- 기능 코드 (예: 'BTN_CREATE_USER', 'COL_MONTHLY_COST')
        feature_name VARCHAR(100) NOT NULL,  -- 기능 이름 (예: '직원 등록 버튼', '원가 컬럼')
        description TEXT,                    -- 기능 설명
        allow_admin BOOLEAN DEFAULT TRUE,    -- admin 허용 여부 (true/false)
        allow_user BOOLEAN DEFAULT FALSE,    -- user 허용 여부 (true/false)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (screen_id, feature_code)
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
    ('DEPT', 'PLANNING', '경영기획팀'),
    ('DEPT', 'HR', '인사팀'),
    ('DEPT', 'FINANCE', '재무팀'),
    ('DEPT', 'SALES', '영업팀'),
    ('DEPT', 'IT', 'IT팀'),
    ('DEPT', 'MARKETING', '마케팅팀'),
    ('DEPT', 'DESIGN', '디자인팀');

    -- 직급
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('POSITION', 'CEO', '대표'),
    ('POSITION', 'V_PRESIDENT', '부대표'),
    ('POSITION', 'EX_DIRECTOR', '전무'),
    ('POSITION', 'DIRECTOR', '상무'),
    ('POSITION', 'GENERAL_MGR', '부장'),
    ('POSITION', 'DEPUTY_MGR', '차장'),
    ('POSITION', 'MANAGER', '과장'),
    ('POSITION', 'ASSISTANT', '대리'),
    ('POSITION', 'STAFF', '사원');

    -- 직군
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('ROLE', 'PLANNER', '기획'),
    ('ROLE', 'DESIGNER', '디자인'),
    ('ROLE', 'PUBLISHER', '퍼블'),
    ('ROLE', 'DEVELOPER', '개발');

    -- 등급
    INSERT INTO masters (category, code, code_name)
    VALUES
    ('LEVEL', 'JUNIOR', '초급'),
    ('LEVEL', 'MID', '중급'),
    ('LEVEL', 'SENIOR', '고급'),
    ('LEVEL', 'EXPERT', '특급');

    -- 유저
    INSERT INTO users (email, password, auth, name, phone, dept, role, level, position, monthly_cost, status, is_approved, note)
    VALUES
    ('admin','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','SUPERADMIN','관리자','010-0000-0000','PLANNING','PLANNER','JUNIOR','STAFF',1000000,'ACTIVE',TRUE,'테스트'),
    ('aa@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','ADMIN','김인사','010-0000-0000','HR','PLANNER','SENIOR','ASSISTANT',1000000,'ACTIVE',TRUE,'테스트'),
    ('bb@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','ADMIN','이재무','010-0000-0000','FINANCE','DESIGNER','MID','MANAGER',1000000,'ACTIVE',TRUE,'테스트'),
    ('cc@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','박영업','010-0000-0000','SALES','PUBLISHER','EXPERT','GENERAL_MGR',1000000,'ACTIVE',TRUE,'테스트'),
    ('dd@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','최마케','010-0000-0000','MARKETING','DEVELOPER','JUNIOR','STAFF',1000000,'ON_LEAVE',TRUE,'테스트'),
    ('ee@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','강디자인','010-0000-0000','DESIGN','PLANNER','SENIOR','DEPUTY_MGR',1000000,'ACTIVE',TRUE,'테스트'),
    ('ff@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','정IT','010-0000-0000','IT','DESIGNER','JUNIOR','STAFF',1000000,'ACTIVE',TRUE,'테스트'),
    ('gg@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','오기획','010-0000-0000','PLANNING','PUBLISHER','MID','ASSISTANT',1000000,'ACTIVE',TRUE,'테스트'),
    ('hh@fuz.co.kr','$2b$10$qG6mVKuW3g8ZShVxVRfDDeH9.ZBwUl5Wyz4xG8n7tnQ7xCKm0Ch86','USER','신개발','010-0000-0000','IT','DEVELOPER','SENIOR','MANAGER',1000000,'ACTIVE',TRUE,'테스트');


    -- 프로젝트
    INSERT INTO projects (name, client_name, project_type, start_date, end_date, budget, status, required_planner, required_designer, required_publisher, required_developer, required_etc, created_by, dept, note)
    VALUES
    ('테스트 프로젝트1', '테스터', '유지보수', '2026-07-16', '2026-07-30', 10000000, '대기', 1, 1, 1, 0, 0, 2, 'HR', '테스트 프로젝트1'),
    ('테스트 프로젝트2', '테스터2', '유지보수', '2026-08-16', '2026-08-30', 8000000, '대기', 0, 1, 1, 1, 0, 2, 'HR', '테스트 프로젝트2');

    --투입인원
    INSERT INTO participants (project_id, user_id, start_date, end_date, mm_value, monthly_cost, role, level, note)
    VALUES
    (1, 1, '2026-01-01', '2026-01-31', 1.0, 3500000, 'PLANNER', 'SENIOR', '테스트'),
    (1, 2, '2026-01-01', '2026-01-31', 0.5, 2000000, 'DEVELOPER', 'MID', '테스트'),
    (1, 3, '2026-01-15', '2026-02-15', 1.0, 4000000, 'DESIGNER', 'EXPERT', '테스트'),

    (2, 1, '2026-01-01', '2026-01-31', 1.0, 3500000, 'PLANNER', 'SENIOR', '테스트'),
    (2, 4, '2026-01-01', '2026-01-31', 0.5, 2000000, 'DEVELOPER', 'MID', '테스트'),
    (2, 5, '2026-01-15', '2026-02-15', 1.0, 4000000, 'DESIGNER', 'EXPERT', '테스트');


    -- 화면 세부 기능 권한 샘플 (UI 01 유저 목록 화면)
    INSERT INTO screen_permissions (screen_id, feature_code, feature_name, description, allow_admin, allow_user)
    VALUES
    ('DASHBOARD', 'CREATEPROJECT_BTN', '새 프로젝트 등록', '신규 프로젝트 등록', TRUE, FALSE),
    ('DASHBOARD', 'ALERTBOX', '알림 영역', '알림영역', TRUE, FALSE),
    ('USER_LIST', 'BTN_CREATE_USER', '신규 유저 등록 버튼', '신규 직원을 등록하는 버튼', TRUE, FALSE),
    ('USER_LIST', 'COL_MONTHLY_COST', '월 인건비/원가 컬럼', '목록 표 내부의 인건비 원가 컬럼', TRUE, FALSE),
    ('USER_LIST', 'BTN_EXCEL_DOWNLOAD', '엑셀 다운로드 버튼', '유저 목록을 엑셀로 다운받는 버튼', TRUE, TRUE);
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
            ${screenPermissionsTable}
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
