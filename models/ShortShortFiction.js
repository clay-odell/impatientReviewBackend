const db = require("../db");

class ShortShortFiction {
  static async createDraft({ title, author, body, citations }) {
    const result = await db.query(
      `INSERT INTO short_short_fiction (title, author, body, citations)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, author, body, citations]
    );
    return result.rows[0];
  }

  static async list(status = null) {
    let query = `SELECT * FROM short_short_fiction`;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE status = $1`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  static async get(id) {
    const result = await db.query(
      `SELECT * FROM short_short_fiction WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateDraft(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }

    values.push(id);

    const result = await db.query(
      `UPDATE short_short_fiction
       SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async publish(id) {
    const result = await db.query(
      `UPDATE short_short_fiction
       SET status = 'published', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query(`DELETE FROM short_short_fiction WHERE id = $1`, [id]);
    return true;
  }
}

module.exports = ShortShortFiction;
