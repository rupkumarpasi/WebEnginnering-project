import { fromUserRow, toUserRow } from '../db/mapper.js';

export class UsersRepository {
  /** @param {import('pg').Pool} pool */
  constructor(pool) {
    this.pool = pool;
  }

  async create(data) {
    const row = toUserRow(data);
    const { rows } = await this.pool.query(
      `INSERT INTO users (
         first_name, last_name, email, phone, date_of_birth, address,
         role, password_hash, github_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        row.first_name,
        row.last_name,
        row.email,
        row.phone,
        row.date_of_birth,
        row.address,
        row.role,
        row.password_hash,
        row.github_id,
      ],
    );
    return fromUserRow(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return fromUserRow(rows[0]);
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    return fromUserRow(rows[0]);
  }

  async findByGithubId(githubId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId],
    );
    return fromUserRow(rows[0]);
  }

  async findAll() {
    const { rows } = await this.pool.query(
      'SELECT * FROM users ORDER BY last_name ASC, first_name ASC',
    );
    return rows.map(fromUserRow);
  }

  async update(id, changes) {
    const current = await this.findById(id);
    if (!current) return null;

    const next = toUserRow({ ...current, ...changes, id });
    const { rows } = await this.pool.query(
      `UPDATE users SET
         first_name = $2,
         last_name = $3,
         email = $4,
         phone = $5,
         date_of_birth = $6,
         address = $7,
         role = $8,
         password_hash = $9,
         github_id = $10,
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        next.first_name,
        next.last_name,
        next.email,
        next.phone,
        next.date_of_birth,
        next.address,
        next.role,
        next.password_hash,
        next.github_id,
      ],
    );
    return fromUserRow(rows[0]);
  }

  async delete(id) {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}