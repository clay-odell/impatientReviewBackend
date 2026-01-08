const ShortShortFiction = require("../models/ShortShortFiction");

module.exports = {
  createDraft: async (req, res) => {
    try {
      const story = await ShortShortFiction.createDraft(req.body);
      res.json({ story });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create draft" });
    }
  },

  list: async (req, res) => {
    try {
      const { status } = req.query;
      const stories = await ShortShortFiction.list(status);
      res.json({ stories });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to list stories" });
    }
  },

  get: async (req, res) => {
    try {
      const story = await ShortShortFiction.get(req.params.id);
      if (!story) return res.status(404).json({ error: "Not found" });
      res.json({ story });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch story" });
    }
  },

  updateDraft: async (req, res) => {
    try {
      const story = await ShortShortFiction.updateDraft(req.params.id, req.body);
      res.json({ story });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update draft" });
    }
  },

  publish: async (req, res) => {
    try {
      const story = await ShortShortFiction.publish(req.params.id);
      res.json({ story });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to publish story" });
    }
  },

  delete: async (req, res) => {
    try {
      await ShortShortFiction.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete story" });
    }
  },
};
