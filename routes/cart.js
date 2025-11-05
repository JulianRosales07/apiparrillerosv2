const express = require("express");
const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const dbPath = path.join(__dirname, "../data/db.json");

const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET /api/cart - Obtener carrito del usuario
router.get("/", verifyToken, (req, res) => {
  try {
    const db = readDB();

    if (!db.carts) {
      db.carts = [];
    }

    // Buscar carrito del usuario
    const cart = db.carts.find(c => c.userId === req.user.id);

    if (!cart) {
      return res.json({ cart: { items: [], total: 0 } });
    }

    res.json({ cart });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({ error: "Error al obtener carrito" });
  }
});

// POST /api/cart - Guardar/actualizar carrito
router.post("/", verifyToken, (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const db = readDB();

    if (!db.carts) {
      db.carts = [];
    }

    // Buscar carrito existente
    const cartIndex = db.carts.findIndex(c => c.userId === req.user.id);

    const cartData = {
      userId: req.user.id,
      items,
      total: total || 0,
      updatedAt: new Date().toISOString()
    };

    if (cartIndex !== -1) {
      // Actualizar carrito existente
      db.carts[cartIndex] = cartData;
    } else {
      // Crear nuevo carrito
      db.carts.push(cartData);
    }

    writeDB(db);

    res.json({
      message: "Carrito guardado exitosamente",
      cart: cartData
    });
  } catch (error) {
    console.error("Error al guardar carrito:", error);
    res.status(500).json({ error: "Error al guardar carrito" });
  }
});

// DELETE /api/cart - Limpiar carrito
router.delete("/", verifyToken, (req, res) => {
  try {
    const db = readDB();

    if (!db.carts) {
      return res.json({ message: "Carrito vacío" });
    }

    // Eliminar carrito del usuario
    db.carts = db.carts.filter(c => c.userId !== req.user.id);

    writeDB(db);

    res.json({ message: "Carrito limpiado exitosamente" });
  } catch (error) {
    console.error("Error al limpiar carrito:", error);
    res.status(500).json({ error: "Error al limpiar carrito" });
  }
});

module.exports = router;
