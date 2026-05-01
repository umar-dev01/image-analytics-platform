const express = require("express");
const multer = require("multer");
const path = require("path");
const Image = require("../models/Image");
const protect = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// POST /api/images - upload image
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    const { label } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const image = await Image.create({
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      label: label || "uncategorized",
      uploadedAt: new Date(),
    });

    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/images - get all images with pagination + date filter
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, date } = req.query;

    const filter = {};

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.uploadedAt = { $gte: start, $lte: end };
    }

    const total = await Image.countDocuments(filter);
    const images = await Image.find(filter)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      images,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/images/count - total image count
router.get("/count", protect, async (req, res) => {
  try {
    const count = await Image.countDocuments();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/images/group-by-label - group images by label
router.get("/group-by-label", protect, async (req, res) => {
  try {
    const groups = await Image.aggregate([
      {
        $group: {
          _id: "$label",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/images/per-day - images grouped by day
router.get("/per-day", protect, async (req, res) => {
  try {
    const groups = await Image.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/images/:id - delete image
router.delete("/:id", protect, async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }
    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;