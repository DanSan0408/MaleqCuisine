const DEFAULT_SESSION_TEMPLATES = [
    { session_type: 'morning', start_time: '11:30', end_time: '13:00', max_orders: 8 },
    { session_type: 'evening', start_time: '14:00', end_time: '16:00', max_orders: 8 }
];

const SESSION_SORT_ORDER = "FIELD(session_type, 'morning', 'evening')";

function toSqlDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

async function ensureDailySessionTemplates(poolOrConnection) {
    await poolOrConnection.query(
        `CREATE TABLE IF NOT EXISTS daily_session_templates (
            id INT PRIMARY KEY AUTO_INCREMENT,
            session_type ENUM('morning', 'evening') NOT NULL UNIQUE,
            start_time VARCHAR(10) NOT NULL,
            end_time VARCHAR(10) NOT NULL,
            max_orders INT NOT NULL DEFAULT 8,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
    );

    for (const template of DEFAULT_SESSION_TEMPLATES) {
        await poolOrConnection.query(
            `INSERT INTO daily_session_templates (session_type, start_time, end_time, max_orders)
             SELECT ?, ?, ?, ?
             WHERE NOT EXISTS (
                SELECT 1 FROM daily_session_templates WHERE session_type = ?
             )`,
            [
                template.session_type,
                template.start_time,
                template.end_time,
                template.max_orders,
                template.session_type
            ]
        );
    }
}

async function getDailySessionTemplates(poolOrConnection) {
    await ensureDailySessionTemplates(poolOrConnection);
    const [templates] = await poolOrConnection.query(
        `SELECT id, session_type, start_time, end_time, max_orders, created_at, updated_at
         FROM daily_session_templates
         ORDER BY ${SESSION_SORT_ORDER}`
    );
    return templates;
}

async function upsertDailySessionTemplate(poolOrConnection, sessionType, payload) {
    const { start_time, end_time, max_orders } = payload;

    await ensureDailySessionTemplates(poolOrConnection);
    await poolOrConnection.query(
        `INSERT INTO daily_session_templates (session_type, start_time, end_time, max_orders)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            start_time = VALUES(start_time),
            end_time = VALUES(end_time),
            max_orders = VALUES(max_orders)`,
        [sessionType, start_time, end_time, max_orders]
    );
}

async function ensureDailySessionsForDate(poolOrConnection, targetDate) {
    await ensureDailySessionTemplates(poolOrConnection);

    await poolOrConnection.query(
        `INSERT INTO delivery_sessions (
            session_type,
            start_time,
            end_time,
            max_orders,
            current_orders,
            date,
            is_active
        )
        SELECT t.session_type, t.start_time, t.end_time, t.max_orders, 0, ?, TRUE
        FROM daily_session_templates t
        WHERE NOT EXISTS (
            SELECT 1
            FROM delivery_sessions ds
            WHERE ds.date = ?
              AND ds.session_type = t.session_type
        )`,
        [targetDate, targetDate]
    );
}

module.exports = {
    DEFAULT_SESSION_TEMPLATES,
    toSqlDate,
    ensureDailySessionTemplates,
    getDailySessionTemplates,
    upsertDailySessionTemplate,
    ensureDailySessionsForDate
};
