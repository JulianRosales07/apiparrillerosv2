const express = require("express");
// ✅ Configuración CORS recomendada
const cors = require("cors");
const dotenv = require("dotenv");
const categoryRoutes = require("./routes/categories");
const menuItemRoutes = require("./routes/menuItems");
const customizationOptionRoutes = require("./routes/customizationOptions");
const locationRoutes = require("./routes/location");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const adminOrderRoutes = require("./routes/adminOrders");
const cartRoutes = require("./routes/cart");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;



// CORS debe ir ANTES de cualquier ruta
app.use(cors({
  origin: "*", // O tu dominio exacto
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Manejar preflight requests explícitamente
app.options("*", cors());

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz - debe ir ANTES de express.static
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
      adminAlt: "/admin",
      auth: "/api/auth",
      orders: "/api/orders",
      cart: "/api/cart"
    }
  });
});

// Archivos estáticos
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/customization-options", customizationOptionRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // opcional
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminOrderRoutes);
app.use("/api/cart", cartRoutes);

// Manejador de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Error interno del servidor",
    path: req.path
  });
});

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
  console.log(`  🔐     http://localhost:${port}/api/auth`);
  console.log(`  🛒     http://localhost:${port}/api/orders`);
  console.log(`  🛍️     http://localhost:${port}/api/cart`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
