const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const categoryRoutes = require("./routes/categories");
const menuItemRoutes = require("./routes/menuItems");
const customizationOptionRoutes = require("./routes/customizationOptions");
const locationRoutes = require("./routes/location");
const adminRoutes = require("./routes/admin");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Serve static files from public directory
app.use(express.static("public"));

// Healthcheck route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/customization-options", customizationOptionRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // Add direct admin route for frontend compatibility

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
