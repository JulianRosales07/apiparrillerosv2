const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

async function createAdmin() {
  try {
    // Leer base de datos
    const data = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(data);

    // Inicializar users si no existe
    if (!db.users) {
      db.users = [];
    }

    // Verificar si ya existe un admin
    const existingAdmin = db.users.find(u => u.email === "admin@parrilleros.com");
    if (existingAdmin) {
      console.log("❌ Ya existe un usuario administrador con este email");
      return;
    }

    // Crear contraseña hasheada
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Crear usuario admin
    const adminUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      email: "admin@parrilleros.com",
      password: hashedPassword,
      name: "Administrador",
      phone: null,
      address: null,
      role: "admin",
      createdAt: new Date().toISOString()
    };

    db.users.push(adminUser);

    // Guardar en base de datos
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log("✅ Usuario administrador creado exitosamente");
    console.log("\n📧 Email: admin@parrilleros.com");
    console.log("🔑 Password: admin123");
    console.log("\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login");
  } catch (error) {
    console.error("❌ Error al crear administrador:", error);
  }
}

createAdmin();
