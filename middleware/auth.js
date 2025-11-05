const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1] || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json({ error: "Token requerido para autenticación" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// Middleware para verificar rol de administrador
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador" });
  }
  next();
};

// Middleware opcional - permite acceso con o sin token
const optionalAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1] || req.headers["x-access-token"];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token inválido, pero continuamos sin usuario
      req.user = null;
    }
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, optionalAuth };
