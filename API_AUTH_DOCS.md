# 🔐 Documentación API de Autenticación y Pedidos

## Configuración Inicial

1. Crea un archivo `.env` basado en `.env.example`:
```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
```

2. Instala las dependencias (ya instaladas):
```bash
npm install
```

3. Inicia el servidor:
```bash
npm start
```

---

## 🔑 Endpoints de Autenticación

### 1. Registro de Usuario
**POST** `/api/auth/register`

Crea una nueva cuenta de usuario (cliente).

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "3001234567",
  "address": "Calle 123 #45-67"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "name": "Juan Pérez",
    "phone": "3001234567",
    "address": "Calle 123 #45-67",
    "role": "customer",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. Inicio de Sesión
**POST** `/api/auth/login`

Inicia sesión con credenciales existentes.

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "password123"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "name": "Juan Pérez",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. Obtener Usuario Actual
**GET** `/api/auth/me`

Obtiene la información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "name": "Juan Pérez",
    "phone": "3001234567",
    "address": "Calle 123 #45-67",
    "role": "customer",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🛒 Endpoints de Pedidos

### 1. Crear Pedido
**POST** `/api/orders`

Crea un nuevo pedido para el usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "menuItemId": 1,
      "name": "Burger parrillera sencilla",
      "quantity": 2,
      "price": 15000,
      "customizations": [
        {
          "id": 1,
          "name": "ad chorizo",
          "price": 4000
        }
      ]
    },
    {
      "menuItemId": 22,
      "name": "Papas francesas",
      "quantity": 1,
      "price": 6000,
      "customizations": []
    }
  ],
  "locationId": "sede-tamasagra",
  "deliveryAddress": "Calle 123 #45-67",
  "notes": "Sin cebolla por favor",
  "total": 44000
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Pedido creado exitosamente",
  "order": {
    "id": 1,
    "userId": 1,
    "items": [...],
    "locationId": "sede-tamasagra",
    "deliveryAddress": "Calle 123 #45-67",
    "notes": "Sin cebolla por favor",
    "total": 44000,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Obtener Mis Pedidos
**GET** `/api/orders`

Obtiene todos los pedidos del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "orders": [
    {
      "id": 1,
      "userId": 1,
      "items": [...],
      "locationId": "sede-tamasagra",
      "total": 44000,
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Obtener Pedido Específico
**GET** `/api/orders/:id`

Obtiene los detalles de un pedido específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "order": {
    "id": 1,
    "userId": 1,
    "items": [...],
    "locationId": "sede-tamasagra",
    "deliveryAddress": "Calle 123 #45-67",
    "notes": "Sin cebolla por favor",
    "total": 44000,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Actualizar Pedido
**PUT** `/api/orders/:id`

Actualiza un pedido existente (solo si está en estado "pending").

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [...],
  "deliveryAddress": "Nueva dirección",
  "notes": "Notas actualizadas",
  "total": 50000
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Pedido actualizado exitosamente",
  "order": {
    "id": 1,
    "userId": 1,
    "items": [...],
    "total": 50000,
    "status": "pending",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Cancelar Pedido
**DELETE** `/api/orders/:id`

Cancela un pedido (solo si está en estado "pending" o "confirmed").

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Pedido cancelado exitosamente",
  "order": {
    "id": 1,
    "status": "cancelled",
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

## 📊 Estados de Pedidos

- `pending`: Pedido creado, esperando confirmación
- `confirmed`: Pedido confirmado por el restaurante
- `preparing`: Pedido en preparación
- `ready`: Pedido listo para entrega
- `delivered`: Pedido entregado
- `cancelled`: Pedido cancelado

---

## 🔒 Roles de Usuario

- `customer`: Cliente normal (por defecto al registrarse)
- `admin`: Administrador con permisos especiales

---

## 💡 Ejemplos de Uso con JavaScript

### Registro y Login
```javascript
// Registro
const register = async () => {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cliente@example.com',
      password: 'password123',
      name: 'Juan Pérez',
      phone: '3001234567'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};

// Login
const login = async () => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'cliente@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};
```

### Crear Pedido
```javascript
const createOrder = async (orderData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return await response.json();
};
```

### Obtener Mis Pedidos
```javascript
const getMyOrders = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/orders', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

---

## 🛡️ Seguridad

- Las contraseñas se hashean con bcrypt antes de almacenarse
- Los tokens JWT expiran en 7 días
- Los pedidos solo pueden ser vistos/modificados por su propietario
- Se requiere autenticación para todas las operaciones de pedidos

---

## ⚠️ Notas Importantes

1. **Guarda el token**: Después del login/registro, guarda el token en localStorage o sessionStorage
2. **Incluye el token**: En cada petición a endpoints protegidos, incluye el header `Authorization: Bearer {token}`
3. **Manejo de errores**: Verifica siempre el código de estado HTTP y maneja los errores apropiadamente
4. **Persistencia**: Los pedidos se guardan en la base de datos y persisten incluso si el usuario cierra la página
