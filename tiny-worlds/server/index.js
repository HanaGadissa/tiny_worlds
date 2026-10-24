import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));
console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: 'Server error' }); });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Please log in' }); }
};
const sign = (u) => ({ token: jwt.sign({ id: u.id, username: u.username }, SECRET, { expiresIn: '7d' }), username: u.username });

// ---- auth
app.post('/api/auth/register', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || username.trim().length < 3 || !password || password.length < 6)
    return res.status(400).json({ error: 'Username (3+ chars) and password (6+ chars) required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query('INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id,username', [username.trim(), hash]);
    res.json(sign(rows[0]));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username already taken' });
    throw e;
  }
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  if (!rows[0] || !(await bcrypt.compare(password || '', rows[0].password_hash)))
    return res.status(401).json({ error: 'Wrong username or password' });
  res.json(sign(rows[0]));
}));

// ---- catalog & challenges (public)
app.get('/api/catalog', wrap(async (_q, res) => res.json((await pool.query('SELECT * FROM furniture_items ORDER BY category,price')).rows)));
app.get('/api/challenges', wrap(async (_q, res) => res.json((await pool.query('SELECT * FROM challenges ORDER BY id')).rows)));

// ---- rooms (private, owner only)
const COLS = `id,name,theme,wallpaper,floor_color AS "floorColor",floor_pattern AS "floorPattern",challenge_id AS "challengeId",objects,updated_at AS "updatedAt"`;
function validate(b) {
  if (!b || typeof b.name !== 'string' || !b.name.trim()) return 'Room name required';
  if (!b.wallpaper || !b.floorColor) return 'Wallpaper and floor required';
  if (!Array.isArray(b.objects) || b.objects.length > 200) return 'Invalid objects';
  for (const o of b.objects)
    if (typeof o.key !== 'string' || ![o.x, o.y, o.rotation, o.scale].every(Number.isFinite)) return 'Invalid object';
  return null;
}
const fields = (b) => [b.name.trim().slice(0, 60), b.theme || 'custom', b.wallpaper, b.floorColor, b.floorPattern || 'planks', b.challengeId || null, JSON.stringify(b.objects)];

app.get('/api/rooms', auth, wrap(async (req, res) =>
  res.json((await pool.query(`SELECT id,name,theme,updated_at AS "updatedAt" FROM rooms WHERE user_id=$1 ORDER BY updated_at DESC`, [req.user.id])).rows)));
app.get('/api/rooms/:id', auth, wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLS} FROM rooms WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Room not found' });
}));
app.post('/api/rooms', auth, wrap(async (req, res) => {
  const err = validate(req.body); if (err) return res.status(400).json({ error: err });
  const { rows } = await pool.query(
    `INSERT INTO rooms(user_id,name,theme,wallpaper,floor_color,floor_pattern,challenge_id,objects) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLS}`,
    [req.user.id, ...fields(req.body)]);
  res.status(201).json(rows[0]);
}));
app.put('/api/rooms/:id', auth, wrap(async (req, res) => {
  const err = validate(req.body); if (err) return res.status(400).json({ error: err });
  const { rows } = await pool.query(
    `UPDATE rooms SET name=$3,theme=$4,wallpaper=$5,floor_color=$6,floor_pattern=$7,challenge_id=$8,objects=$9,updated_at=now()
     WHERE id=$1 AND user_id=$2 RETURNING ${COLS}`, [req.params.id, req.user.id, ...fields(req.body)]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Room not found' });
}));
app.delete('/api/rooms/:id', auth, wrap(async (req, res) => {
  await pool.query('DELETE FROM rooms WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

app.listen(process.env.PORT || 4000, () => console.log('Tiny Worlds API on :' + (process.env.PORT || 4000)));
