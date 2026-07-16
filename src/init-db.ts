import pool from "./db";

const dropTablesQuery = `
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS participants CASCADE;
    DROP TABLE IF EXISTS chatrooms CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
`;

const userTable = `
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        account VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        dept VARCHAR(100),
        roles VARCHAR(50),
        status VARCHAR(50) DEFAULT 'offline',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const chatRoomsTable = `
    CREATE TABLE chatrooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

const participantsTable = `
    CREATE TABLE participants (
        id SERIAL PRIMARY KEY,
        chatroom_id INT REFERENCES chatrooms(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        last_read_message_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (chatroom_id, user_id)
    );
`;

const messagesTable = `
    CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        chatroom_id INT REFERENCES chatrooms(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        message_content TEXT NOT NULL,
        is_hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

async function initDb() {
    try {
        console.log("Dropping existing tables for reset...");
        await pool.query(dropTablesQuery);

        console.log("Initializing database tables with new schemas...");
        const createAllTables = `
            ${userTable}
            ${chatRoomsTable}
            ${participantsTable}
            ${messagesTable}
        `;
        await pool.query(createAllTables);

        console.log("Database tables initialized successfully.");
    } catch (error) {
        console.error("Error initializing database tables:", error);
    } finally {
        await pool.end();
    }
}

initDb();