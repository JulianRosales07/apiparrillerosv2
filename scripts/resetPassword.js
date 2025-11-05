const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

async function resetPassword(userId, newPassword) {
  try {
    // Leer base de datos
    const data = fs.readFileSync(dbPath, "utf8");
    const db = JSON.parse(data);

    if (!db.users) {
      console.log("❌ No hay usuarios en la base de datos");
      return;
    }

    // Buscar usuario
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      console.log(`❌ Usuario con ID ${userId} no encontrado`);
      return;
    }

    const user = db.users[userIndex];

    // Crear nueva contraseña hasheada
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    db.users[userIndex].password = hashedPassword;

    // Guardar en base de datos
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log("✅ Contraseña actualizada exitosamente");
    console.log("\n📧 Email:", user.email);
    console.log("🔑 Nueva contraseña:", newPassword);
    console.log("\n⚠️  Guarda esta contraseña en un lugar seguro");
  } catch (error) {
    console.error("❌ Error al resetear contraseña:", error);
  }
}

// Obtener argumentos de línea de comandos
const userId = parseInt(process.argv[2]);
const newPassword = process.argv[3];

if (!userId || !newPassword) {
  console.log("❌ Uso incorrecto");
  console.log("\n📝 Uso correcto:");
  console.log("   node scripts/resetPassword.js <userId> <nuevaContraseña>");
  console.log("\n📋 Ejemplo:");
  console.log("   node scripts/resetPassword.js 3 miNuevaPassword123");
  process.exit(1);
}

if (newPassword.length < 6) {
  console.log("❌ La contraseña debe tener al menos 6 caracteres");
  process.exit(1);
}

resetPassword(userId, newPassword);
