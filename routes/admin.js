const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");

// Configure CORS specifically for admin routes
const adminCors = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5174",
      "http://localhost:3000",
      "https://apiparrillerosv2.onrender.com",
    ];

    if (allowedOrigins.indexOf(origin) === -1) {
      // If origin is not in the list, still allow it (for development)
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Middleware to check admin token
const checkAdminToken = (req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const token = req.headers["x-admin-token"];

  // Simple token validation - in production, use proper authentication
  if (token === "admin123") {
    next();
  } else {
    res.status(403).json({ error: "Invalid admin token" });
  }
};

// Get menu items for admin panel
router.get("/menu", adminCors, checkAdminToken, (req, res) => {
  try {
    // Read data from the main db.json file
    const dbPath = path.join(__dirname, "../data/db.json");

    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({ error: "Database file not found" });
    }

    const dbData = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(dbData);

    // Get menu items and locations from the database
    const menuItems = db.menuItems || [];
    const locations = db.locations || [];

    // Add availability information to menu items
    const menuWithAvailability = menuItems.map((item) => ({
      ...item,
      availableAt: item.availableAt || locations.map((loc) => loc.id), // Default to all locations
    }));

    res.json(menuWithAvailability);
  } catch (error) {
    console.error("Error reading menu data:", error);
    res.status(500).json({ error: "Failed to load menu data" });
  }
});

// Basic admin routes
router.get("/", adminCors, (req, res) => {
  res.json({ message: "Admin panel endpoint" });
});

// Get locations for admin panel
router.get("/locations", adminCors, checkAdminToken, (req, res) => {
  try {
    const dbPath = path.join(__dirname, "../data/db.json");

    if (!fs.existsSync(dbPath)) {
      return res.status(500).json({ error: "Database file not found" });
    }

    const dbData = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(dbData);

    res.json(db.locations || []);
  } catch (error) {
    console.error("Error reading locations data:", error);
    res.status(500).json({ error: "Failed to load locations data" });
  }
});

// Update product availability
router.patch(
  "/menu-items/:id/availability",
  adminCors,
  checkAdminToken,
  (req, res) => {
    try {
      const { id } = req.params;
      const { available, locationId } = req.body;

      const dbPath = path.join(__dirname, "../data/db.json");

      if (!fs.existsSync(dbPath)) {
        return res.status(500).json({ error: "Database file not found" });
      }

      const dbData = fs.readFileSync(dbPath, "utf8");
      const db = JSON.parse(dbData);

      // Find the menu item
      const menuItemIndex = db.menuItems.findIndex((item) => item.id == id);

      if (menuItemIndex === -1) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Initialize availableAt array if it doesn't exist
      if (!db.menuItems[menuItemIndex].availableAt) {
        db.menuItems[menuItemIndex].availableAt = [];
      }

      // Update availability
      if (available) {
        // Add location if not already present
        if (!db.menuItems[menuItemIndex].availableAt.includes(locationId)) {
          db.menuItems[menuItemIndex].availableAt.push(locationId);
        }
      } else {
        // Remove location
        db.menuItems[menuItemIndex].availableAt = db.menuItems[
          menuItemIndex
        ].availableAt.filter((loc) => loc !== locationId);
      }

      // Write back to file
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      res.json({
        success: true,
        message: `Product ${
          available ? "enabled" : "disabled"
        } for location ${locationId}`,
      });
    } catch (error) {
      console.error("Error updating product availability:", error);
      res.status(500).json({ error: "Failed to update product availability" });
    }
  }
);

// Upload image for a product
router.post(
  "/menu-items/:id/image",
  adminCors,
  checkAdminToken,
  upload.single("image"),
  (req, res) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const dbPath = path.join(__dirname, "../data/db.json");

      if (!fs.existsSync(dbPath)) {
        return res.status(500).json({ error: "Database file not found" });
      }

      const dbData = fs.readFileSync(dbPath, "utf8");
      const db = JSON.parse(dbData);

      // Find the menu item
      const menuItemIndex = db.menuItems.findIndex((item) => item.id == id);

      if (menuItemIndex === -1) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Delete old image if exists
      if (db.menuItems[menuItemIndex].image) {
        const oldImagePath = path.join(
          __dirname,
          "../uploads",
          path.basename(db.menuItems[menuItemIndex].image)
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update menu item with new image path
      db.menuItems[menuItemIndex].image = `/uploads/${req.file.filename}`;

      // Write back to file
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      res.json({
        success: true,
        message: "Image uploaded successfully",
        imagePath: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);

// Delete image for a product
router.delete(
  "/menu-items/:id/image",
  adminCors,
  checkAdminToken,
  (req, res) => {
    try {
      const { id } = req.params;

      const dbPath = path.join(__dirname, "../data/db.json");

      if (!fs.existsSync(dbPath)) {
        return res.status(500).json({ error: "Database file not found" });
      }

      const dbData = fs.readFileSync(dbPath, "utf8");
      const db = JSON.parse(dbData);

      // Find the menu item
      const menuItemIndex = db.menuItems.findIndex((item) => item.id == id);

      if (menuItemIndex === -1) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      // Delete image file if exists
      if (db.menuItems[menuItemIndex].image) {
        const imagePath = path.join(
          __dirname,
          "../uploads",
          path.basename(db.menuItems[menuItemIndex].image)
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Remove image from menu item
      db.menuItems[menuItemIndex].image = null;

      // Write back to file
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);

// Add more admin routes as needed
router.get("/stats", adminCors, checkAdminToken, (req, res) => {
  res.json({
    message: "Admin statistics",
    // Add your stats logic here
  });
});

module.exports = router;
