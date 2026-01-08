const db = require("../db");
const { NotFoundError, BadRequestError } = require("../expressError");

class Poem {
  /** Create a new draft poem.
   *
   * data = { title, author, body, citations }
   *
   * Returns { id, title, author, body, citations, status, created_at, updated_at }
   */
  static async createDraft({ title, author, body, citations }) {
    const result = await db.query(
      `
      INSERT INTO poems (title, author, body, citations, status)
      VALUES ($1, $2, $3, $4, 'draft')
      RETURNING id,
                title,
                author,
                body,
                citations,
                status,
                created_at,
                updated_at
      `,
      [title, author, body, citations]
    );

    return result.rows[0];
  }

  /** Get a poem by ID.
   *
   * Returns { id, title, author, body, citations, status, created_at, updated_at }
   */
  static async get(id) {
    const result = await db.query(
      `
      SELECT id,
             title,
             author,
             body,
             citations,
             status,
             created_at,
             updated_at
      FROM poems
      WHERE id = $1
      `,
      [id]
    );

    const poem = result.rows[0];
    if (!poem) throw new NotFoundError(`Poem not found: ${id}`);

    return poem;
  }

  /** Update a draft poem.
   *
   * data = { title?, author?, body?, citations? }
   *
   * Only allowed when status = 'draft'
   */
  static async updateDraft(id, data) {
    // Ensure poem exists and is a draft
    const existing = await this.get(id);
    if (existing.status !== "draft") {
      throw new BadRequestError("Cannot update a published poem");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    if (fields.length === 0) return existing;

    values.push(id);

    const result = await db.query(
      `
      UPDATE poems
      SET ${fields.join(", ")},
          updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id,
                title,
                author,
                body,
                citations,
                status,
                created_at,
                updated_at
      `,
      values
    );

    return result.rows[0];
  }

  /** Publish a poem.
   *
   * Returns updated poem.
   */
  static async publish(id) {
    const result = await db.query(
      `
      UPDATE poems
      SET status = 'published',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id,
                title,
                author,
                body,
                citations,
                status,
                created_at,
                updated_at
      `,
      [id]
    );

    const poem = result.rows[0];
    if (!poem) throw new NotFoundError(`Poem not found: ${id}`);

    return poem;
  }

  /** List all poems (optionally filter by status). */
  static async list({ status } = {}) {
    let query = `
      SELECT id,
             title,
             author,
             body,
             citations,
             status,
             created_at,
             updated_at
      FROM poems
    `;

    const values = [];

    if (status) {
      values.push(status);
      query += ` WHERE status = $1`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, values);
    return result.rows;
  }

  /** Delete a poem. */
  static async remove(id) {
    const result = await db.query(
      `
      DELETE FROM poems
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rows[0]) throw new NotFoundError(`Poem not found: ${id}`);
  }
}

module.exports = Poem;
