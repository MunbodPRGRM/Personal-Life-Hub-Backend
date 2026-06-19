const pool = require('../config/db');

const getEvents = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM events WHERE user_id = ? ORDER BY start_datetime ASC',
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

const createEvent = async (req, res) => {
  const { title, description, start_datetime, end_datetime, color } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ event' });
  }
  if (!start_datetime) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุวันเวลาเริ่มต้น' });
  }
  if (end_datetime && new Date(end_datetime) < new Date(start_datetime)) {
    return res.status(400).json({ success: false, message: 'วันเวลาสิ้นสุดต้องไม่ก่อนวันเวลาเริ่มต้น' });
  }

  const validColor = color || '#3B82F6';

  const [result] = await pool.query(
    'INSERT INTO events (user_id, title, description, start_datetime, end_datetime, color) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, description || null, start_datetime, end_datetime || null, validColor]
  );

  res.status(201).json({
    success: true,
    message: 'สร้าง event สำเร็จ',
    data: {
      id: result.insertId,
      title,
      description: description || null,
      start_datetime,
      end_datetime: end_datetime || null,
      color: validColor,
    },
  });
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, start_datetime, end_datetime, color } = req.body;

  const [rows] = await pool.query('SELECT id FROM events WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ event' });
  }

  if (start_datetime && end_datetime && new Date(end_datetime) < new Date(start_datetime)) {
    return res.status(400).json({ success: false, message: 'วันเวลาสิ้นสุดต้องไม่ก่อนวันเวลาเริ่มต้น' });
  }

  await pool.query(
    'UPDATE events SET title = COALESCE(?, title), description = COALESCE(?, description), start_datetime = COALESCE(?, start_datetime), end_datetime = COALESCE(?, end_datetime), color = COALESCE(?, color) WHERE id = ?',
    [title ?? null, description ?? null, start_datetime ?? null, end_datetime ?? null, color ?? null, id]
  );

  const [updated] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
  res.json({ success: true, message: 'อัปเดต event สำเร็จ', data: updated[0] });
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query('SELECT id FROM events WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'ไม่พบ event' });
  }

  await pool.query('DELETE FROM events WHERE id = ?', [id]);
  res.json({ success: true, message: 'ลบ event สำเร็จ' });
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
