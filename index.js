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

// ✅ Configuración CORS recomendada
app.use(cors({
  origin: "*", // En producción, deberías poner tu dominio aquí
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization,x-admin-token",
}));

// Middleware JSON y archivos estáticos
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

// Rutas API
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
});
