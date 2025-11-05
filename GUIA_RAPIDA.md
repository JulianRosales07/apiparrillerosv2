# 🚀 Guía Rápida - Sistema de Autenticación y Pedidos

## ✅ ¿Qué se implementó?

Se agregó un sistema completo de autenticación y gestión de pedidos a tu API de Parrilleros:

### 🔐 Autenticación
- **Registro de usuarios** (clientes)
- **Inicio de sesión** con email y contraseña
- **Tokens JWT** que duran 7 días
- **Contraseñas encriptadas** con bcrypt
- **Roles**: cliente (`customer`) y administrador (`admin`)

### 🛒 Gestión de Pedidos
- **Crear pedidos** asociados al usuario
- **Ver todos mis pedidos**
- **Ver detalle de un pedido**
- **Actualizar pedido** (solo si está pendiente)
- **Cancelar pedido**
- **Persistencia**: Los pedidos se guardan en la base de datos

---

## 🎯 Inicio Rápido

### 1. Configurar variables de entorno
Ya está creado el archivo `.env` con:
```
PORT=3000
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
```

### 2. Iniciar el servidor
```bash
npm start
```

### 3. Probar la API
Abre en tu navegador: `test-auth.html`

O usa estos endpoints:

#### Registrar usuario:
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "3001234567",
  "address": "Calle 123"
}
```

#### Iniciar sesión:
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123"
}
```

Respuesta incluye un `token` que debes guardar.

#### Crear pedido:
```bash
POST http://localhost:3000/api/orders
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": 1,
      "name": "Burger parrillera sencilla",
      "quantity": 2,
      "price": 15000,
      "customizations": []
    }
  ],
  "locationId": "sede-tamasagra",
  "deliveryAddress": "Calle 123 #45-67",
  "notes": "Sin cebolla",
  "total": 30000
}
```

#### Ver mis pedidos:
```bash
GET http://localhost:3000/api/orders
Authorization: Bearer TU_TOKEN_AQUI
```

#### Guardar carrito (opcional):
```bash
POST http://localhost:3000/api/cart
Authorization: Bearer TU_TOKEN_AQUI
Content-Type: application/json

{
  "items": [...],
  "total": 30000
}
```

#### Obtener carrito guardado:
```bash
GET http://localhost:3000/api/cart
Authorization: Bearer TU_TOKEN_AQUI
```

---

## 📁 Archivos Nuevos

```
apiparrillerosv2/
├── routes/
│   ├── auth.js          ← Rutas de autenticación
│   └── orders.js        ← Rutas de pedidos
├── middleware/
│   └── auth.js          ← Middleware de autenticación
├── scripts/
│   └── createAdmin.js   ← Script para crear admin
├── test-auth.html       ← Página de prueba
├── API_AUTH_DOCS.md     ← Documentación completa
└── GUIA_RAPIDA.md       ← Este archivo
```

---

## 👤 Crear Usuario Administrador

Para crear un usuario administrador:

```bash
npm run create-admin
```

Esto crea:
- Email: `admin@parrilleros.com`
- Password: `admin123`

⚠️ **Cambia esta contraseña después del primer login**

---

## 🔄 Flujo de Uso en el Frontend

### 1. Usuario se registra o inicia sesión
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await response.json();

// Guardar token
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

### 2. Usuario agrega productos al carrito
```javascript
// En tu frontend, mantén un carrito en memoria o localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Agregar producto
cart.push({
  menuItemId: 1,
  name: "Burger parrillera sencilla",
  quantity: 1,
  price: 15000,
  customizations: []
});

localStorage.setItem('cart', JSON.stringify(cart));
```

### 3. Usuario hace el pedido
```javascript
const token = localStorage.getItem('token');
const cart = JSON.parse(localStorage.getItem('cart'));

const orderData = {
  items: cart,
  locationId: "sede-tamasagra",
  deliveryAddress: "Calle 123",
  notes: "Sin cebolla",
  total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
};

const response = await fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(orderData)
});

const { order } = await response.json();

// ✅ El servidor automáticamente limpia el carrito guardado
// Limpiar carrito local también
localStorage.removeItem('cart');
alert('¡Pedido creado! El carrito ha sido limpiado.');
```

### 4. Usuario ve sus pedidos
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { orders } = await response.json();
// Mostrar pedidos en la UI
```

---

## 🎨 Integración con tu Frontend

### Verificar si el usuario está autenticado:
```javascript
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Al cargar la página
if (isAuthenticated()) {
  // Mostrar opciones de usuario autenticado
  // Cargar pedidos guardados
} else {
  // Mostrar botón de login/registro
}
```

### Recuperar pedido pendiente:
```javascript
async function loadPendingOrder() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const response = await fetch('http://localhost:3000/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { orders } = await response.json();
  const pendingOrder = orders.find(o => o.status === 'pending');
  
  if (pendingOrder) {
    // Restaurar el carrito con los items del pedido
    localStorage.setItem('cart', JSON.stringify(pendingOrder.items));
  }
}
```

---

## 📊 Estados de Pedidos

| Estado | Descripción | Puede modificar | Puede cancelar |
|--------|-------------|-----------------|----------------|
| `pending` | Recién creado | ✅ Sí | ✅ Sí |
| `confirmed` | Confirmado por restaurante | ❌ No | ✅ Sí |
| `preparing` | En preparación | ❌ No | ❌ No |
| `ready` | Listo para entrega | ❌ No | ❌ No |
| `delivered` | Entregado | ❌ No | ❌ No |
| `cancelled` | Cancelado | ❌ No | ❌ No |

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Validación de permisos en cada endpoint
- ✅ Los usuarios solo ven sus propios pedidos
- ✅ CORS configurado

---

## 📝 Próximos Pasos Sugeridos

1. **Frontend**: Integrar estos endpoints en tu aplicación web
2. **Notificaciones**: Agregar sistema de notificaciones cuando cambie el estado del pedido
3. **Panel Admin**: Crear interfaz para que admins gestionen pedidos
4. **Pagos**: Integrar pasarela de pagos
5. **Historial**: Agregar página de historial de pedidos

---

## 🆘 Soporte

- Documentación completa: `API_AUTH_DOCS.md`
- Página de prueba: `test-auth.html`
- Crear admin: `npm run create-admin`

¡Todo listo para que tus clientes puedan guardar sus pedidos! 🎉
