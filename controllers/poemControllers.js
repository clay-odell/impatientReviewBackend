// controllers/poems.js

const Poem = require("../models/Poems");
const {
  BadRequestError,
  NotFoundError,
} = require("../expressError");

/** Create a new draft poem */
async function createDraft(req, res, next) {
  try {
    const { title, author, body, citations } = req.body;

    if (!title || !author || !body) {
      throw new BadRequestError("title, author, and body are required");
    }

    const poem = await Poem.createDraft({
      title,
      author,
      body,
      citations: citations || null,
    });

    return res.json({ poem });
  } catch (err) {
    return next(err);
  }
}

/** Get a poem by ID */
async function getPoem(req, res, next) {
  try {
    const poem = await Poem.get(req.params.id);
    return res.json({ poem });
  } catch (err) {
    return next(err);
  }
}

/** Update a draft poem */
async function updateDraft(req, res, next) {
  try {
    const { id } = req.params;

    const allowedFields = ["title", "author", "body", "citations"];
    const data = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestError("No valid fields provided for update");
    }

    const poem = await Poem.updateDraft(id, data);
    return res.json({ poem });
  } catch (err) {
    return next(err);
  }
}

/** Publish a poem */
async function publishPoem(req, res, next) {
  try {
    const poem = await Poem.publish(req.params.id);
    return res.json({ poem });
  } catch (err) {
    return next(err);
  }
}

/** List poems (optionally filter by status) */
async function listPoems(req, res, next) {
  try {
    const { status } = req.query;

    if (status && !["draft", "published"].includes(status)) {
      throw new BadRequestError("Invalid status filter");
    }

    const poems = await Poem.list({ status });
    return res.json({ poems });
  } catch (err) {
    return next(err);
  }
}

/** Delete a poem */
async function deletePoem(req, res, next) {
  try {
    await Poem.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createDraft,
  getPoem,
  updateDraft,
  publishPoem,
  listPoems,
  deletePoem,
};
