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

// POST /api/orders - Crear nuevo pedido (requiere autenticación)
router.post("/", verifyToken, (req, res) => {
  try {
    const { items, locationId, deliveryAddress, notes, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El pedido debe contener al menos un item" });
    }

    if (!locationId) {
      return res.status(400).json({ error: "Debe especificar una sede" });
    }

    const db = readDB();

    // Inicializar array de pedidos si no existe
    if (!db.orders) {
      db.orders = [];
    }

    // Crear nuevo pedido
    const newOrder = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      userId: req.user.id,
      items, // Array de { menuItemId, quantity, customizations, price }
      locationId,
      deliveryAddress: deliveryAddress || null,
      notes: notes || null,
      total,
      status: "pending", // pending, confirmed, preparing, ready, delivered, cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.orders.push(newOrder);

    // Limpiar el carrito del usuario después de crear el pedido
    if (db.carts) {
      db.carts = db.carts.filter(c => c.userId !== req.user.id);
    }

    writeDB(db);

    res.status(201).json({
      message: "Pedido creado exitosamente. Carrito limpiado.",
      order: newOrder
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido" });
  }
});

// GET /api/orders - Obtener pedidos del usuario autenticado
router.get("/", verifyToken, (req, res) => {
  try {
    const db = readDB();

    if (!db.orders) {
      return res.json({ orders: [] });
    }

    // Filtrar pedidos del usuario
    const userOrders = db.orders.filter(order => order.userId === req.user.id);

    // Ordenar por fecha más reciente
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ orders: userOrders });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// GET /api/orders/:id - Obtener un pedido específico
router.get("/:id", verifyToken, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = readDB();

    if (!db.orders) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const order = db.orders.find(o => o.id === orderId);

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Verificar que el pedido pertenece al usuario
    if (order.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "No tienes permiso para ver este pedido" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

// PUT /api/orders/:id - Actualizar pedido (solo si está en pending)
router.put("/:id", verifyToken, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { items, deliveryAddress, notes, total } = req.body;
    const db = readDB();

    if (!db.orders) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const order = db.orders[orderIndex];

    // Verificar que el pedido pertenece al usuario
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para modificar este pedido" });
    }

    // Solo se puede modificar si está en pending
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Solo se pueden modificar pedidos pendientes" });
    }

    // Actualizar campos
    if (items) order.items = items;
    if (deliveryAddress !== undefined) order.deliveryAddress = deliveryAddress;
    if (notes !== undefined) order.notes = notes;
    if (total) order.total = total;
    order.updatedAt = new Date().toISOString();

    db.orders[orderIndex] = order;
    writeDB(db);

    res.json({
      message: "Pedido actualizado exitosamente",
      order
    });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ error: "Error al actualizar pedido" });
  }
});

// DELETE /api/orders/:id - Cancelar pedido
router.delete("/:id", verifyToken, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = readDB();

    if (!db.orders) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const order = db.orders[orderIndex];

    // Verificar que el pedido pertenece al usuario
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para cancelar este pedido" });
    }

    // Solo se puede cancelar si está en pending o confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({ error: "No se puede cancelar este pedido en su estado actual" });
    }

    // Marcar como cancelado en lugar de eliminar
    order.status = "cancelled";
    order.updatedAt = new Date().toISOString();

    db.orders[orderIndex] = order;
    writeDB(db);

    res.json({
      message: "Pedido cancelado exitosamente",
      order
    });
  } catch (error) {
    console.error("Error al cancelar pedido:", error);
    res.status(500).json({ error: "Error al cancelar pedido" });
  }
});

module.exports = router;
