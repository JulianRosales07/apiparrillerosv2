const express = require("express");
const fs = require("fs");
const path = require("path");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();
const dbPath = path.join(__dirname, "../data/db.json");

const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// GET /api/admin/orders - Obtener todos los pedidos (solo admin)
router.get("/orders", verifyToken, verifyAdmin, (req, res) => {
  try {
    const { status, locationId, limit } = req.query;
    const db = readDB();

    if (!db.orders) {
      return res.json({ orders: [] });
    }

    let orders = [...db.orders];

    // Filtrar por estado
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    // Filtrar por sede
    if (locationId) {
      orders = orders.filter(o => o.locationId === locationId);
    }

    // Ordenar por fecha más reciente
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limitar resultados
    if (limit) {
      orders = orders.slice(0, parseInt(limit));
    }

    // Agregar información del usuario
    orders = orders.map(order => {
      const user = db.users?.find(u => u.id === order.userId);
      return {
        ...order,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        } : null
      };
    });

    res.json({ 
      orders,
      total: orders.length,
      filters: { status, locationId, limit }
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// GET /api/admin/orders/stats - Estadísticas de pedidos
router.get("/orders/stats", verifyToken, verifyAdmin, (req, res) => {
  try {
    const db = readDB();

    if (!db.orders) {
      return res.json({ stats: {} });
    }

    const stats = {
      total: db.orders.length,
      byStatus: {},
      byLocation: {},
      totalRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0
    };

    const today = new Date().toISOString().split('T')[0];

    db.orders.forEach(order => {
      // Por estado
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

      // Por sede
      stats.byLocation[order.locationId] = (stats.byLocation[order.locationId] || 0) + 1;

      // Ingresos totales
      if (order.status !== 'cancelled') {
        stats.totalRevenue += order.total;
      }

      // Pedidos de hoy
      if (order.createdAt.startsWith(today)) {
        stats.todayOrders++;
        if (order.status !== 'cancelled') {
          stats.todayRevenue += order.total;
        }
      }
    });

    res.json({ stats });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// PATCH /api/admin/orders/:id/status - Actualizar estado del pedido
router.patch("/orders/:id/status", verifyToken, verifyAdmin, (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Estado inválido",
        validStatuses 
      });
    }

    const db = readDB();

    if (!db.orders) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const orderIndex = db.orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    db.orders[orderIndex].status = status;
    db.orders[orderIndex].updatedAt = new Date().toISOString();

    writeDB(db);

    res.json({
      message: "Estado actualizado exitosamente",
      order: db.orders[orderIndex]
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// GET /api/admin/users - Obtener todos los usuarios
router.get("/users", verifyToken, verifyAdmin, (req, res) => {
  try {
    const db = readDB();

    if (!db.users) {
      return res.json({ users: [] });
    }

    // No devolver contraseñas
    const users = db.users.map(({ password, ...user }) => user);

    res.json({ 
      users,
      total: users.length 
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// GET /api/admin/users/:id/orders - Obtener pedidos de un usuario específico
router.get("/users/:id/orders", verifyToken, verifyAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const db = readDB();

    if (!db.orders) {
      return res.json({ orders: [] });
    }

    const userOrders = db.orders.filter(o => o.userId === userId);
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const user = db.users?.find(u => u.id === userId);

    res.json({ 
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      orders: userOrders,
      total: userOrders.length
    });
  } catch (error) {
    console.error("Error al obtener pedidos del usuario:", error);
    res.status(500).json({ error: "Error al obtener pedidos del usuario" });
  }
});

module.exports = router;
