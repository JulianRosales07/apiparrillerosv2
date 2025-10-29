const express = require("express");
// ✅ Configuración CORS recomendada
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



app.use(cors({
  origin: "*", // O tu dominio exacto
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
}));


// Middleware JSON y archivos estáticos
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

// Rutas API
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "API Sistema Parrilleros - Atención y Mantenimiento",
    version: "1.0 - Sugabase",
    endpoints: {
      health: "/health",
      categories: "/api/categories",
      menuItems: "/api/menu-items",
      customizationOptions: "/api/customization-options",
      locations: "/api/locations",
      admin: "/api/admin",
      adminAlt: "/admin"
    }
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/customization-options", customizationOptionRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // opcional

// Iniciar servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log("\n📋 Available Endpoints:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  GET    http://localhost:${port}/health`);
  console.log(`  *      http://localhost:${port}/api/categories`);
  console.log(`  *      http://localhost:${port}/api/menu-items`);
  console.log(`  *      http://localhost:${port}/api/customization-options`);
  console.log(`  *      http://localhost:${port}/api/locations`);
  console.log(`  *      http://localhost:${port}/api/admin`);
  console.log(`  *      http://localhost:${port}/admin`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
