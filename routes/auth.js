const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../data/db.json");

// Función helper para leer la base de datos
const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
};

// Función helper para escribir en la base de datos
const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// POST /api/auth/register - Registro de nuevo usuario
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, contraseña y nombre son requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const db = readDB();

    // Inicializar array de usuarios si no existe
    if (!db.users) {
      db.users = [];
    }

    // Verificar si el usuario ya existe
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      address: address || null,
      role: "customer", // Por defecto es cliente
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    // Generar token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const db = readDB();

    if (!db.users) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Buscar usuario
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Inicio de sesión exitoso",
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get("/me", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = readDB();

    const user = db.users?.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(401).json({ error: "Token inválido" });
  }
});

module.exports = router;
