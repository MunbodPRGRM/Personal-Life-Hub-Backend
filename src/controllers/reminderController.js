const pool = require('../config/db');

// ref_type -> source table (whitelist; never interpolate user input directly)
const refTables = { todo: 'todos', event: 'events', goal: 'goals' };
const validRefTypes = Object.keys(refTables);

const getReminders = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC',
    [req.user.id]
  );

  // enrich each reminder with the referenced item's title
  const idsByType = { todo: [], event: [], goal: [] };
  for (const r of rows) {
    if (idsByType[r.ref_type]) idsByType[r.ref_type].push(r.ref_id);
  }

  const titleMap = {}; // `${type}:${id}` -> title
  for (const type of validRefTypes) {
    const ids = idsByType[type];
    if (ids.length === 0) continue;
    const [items] = await pool.query(
      `SELECT id, title FROM ${refTables[type]} WHERE user_id = ? AND id IN (?)`,
      [req.user.id, ids]
    );
    for (const it of items) titleMap[`${type}:${it.id}`] = it.title;
  }

  const data = rows.map(r => ({ ...r, ref_title: titleMap[`${r.ref_type}:${r.ref_id}`] ?? null }));
  res.json({ success: true, data });
};

// verify a referenced item exists and belongs to the user; returns its title or null
const findRef = async (userId, type, id) => {
  const [rows] = await pool.query(
    `SELECT title FROM ${refTables[type]} WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows.length ? rows[0].title : null;
};

const createReminder = async (req, res) => {
  const { ref_type, ref_id, remind_at } = req.body;

  if (!validRefTypes.includes(ref_type)) {
    return res.status(400).json({ success: false, message: 'ประเภทอ้างอิงไม่ถูกต้อง (todo/event/goal)' });
  }
  if (!ref_id) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกรายการที่ต้องการแจ้งเตือน' });
  }
  if (!remind_at) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุวันเวลาแจ้งเตือน' });
  }

  const refTitle = await findRef(req.user.id, ref_type, ref_id);
  if (refTitle === null) {
    return res.status(404).json({ success: false, message: 'ไม่พบรายการที่อ้างอิง' });
  }

  const [result] = await pool.query(
    'INSERT INTO reminders (user_id, ref_type, ref_id, remind_at) VALUES (?, ?, ?, ?)',
    [req.user.id, ref_type, ref_id, remind_at]
  );

  res.status(201).json({
    success: true,
    message: 'สร้างการแจ้งเตือนสำเร็จ',
    data: { id: result.insertId, ref_type, ref_id, remind_at, is_sent: 0, ref_title: refTitle },
  });
};

const updateReminder = async (req, res) => {
  const { id } = req.params;
  const { ref_type, ref_id, remind_at, is_sent } = req.body;

  const [rows] = await pool.query('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบการแจ้งเตือน' });
  }

  if (ref_type !== undefined && !validRefTypes.includes(ref_type)) {
    return res.status(400).json({ success: false, message: 'ประเภทอ้างอิงไม่ถูกต้อง' });
  }

  const current = rows[0];
  const newType = ref_type ?? current.ref_type;
  const newId = ref_id ?? current.ref_id;

  // if the reference changed, validate ownership of the new target
  if (ref_type !== undefined || ref_id !== undefined) {
    const refTitle = await findRef(req.user.id, newType, newId);
    if (refTitle === null) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการที่อ้างอิง' });
    }
  }

  const isSentVal = is_sent === undefined ? null : (is_sent ? 1 : 0);

  await pool.query(
    'UPDATE reminders SET ref_type = ?, ref_id = ?, remind_at = COALESCE(?, remind_at), is_sent = COALESCE(?, is_sent) WHERE id = ?',
    [newType, newId, remind_at ?? null, isSentVal, id]
  );

  const [updated] = await pool.query('SELECT * FROM reminders WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดตการแจ้งเตือนสำเร็จ', data: updated[0] });
};

const deleteReminder = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM reminders WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบการแจ้งเตือน' });
  }

  await pool.query('DELETE FROM reminders WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบการแจ้งเตือนสำเร็จ' });
};

module.exports = { getReminders, createReminder, updateReminder, deleteReminder };
