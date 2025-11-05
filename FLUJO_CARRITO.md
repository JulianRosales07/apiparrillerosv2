# 🛒 Flujo Completo del Carrito y Pedidos

## 📝 Resumen del Flujo

1. **Usuario navega** y agrega productos al carrito (localStorage en frontend)
2. **Usuario inicia sesión** o se registra
3. **Carrito se sincroniza** con el servidor (opcional, para persistencia)
4. **Usuario confirma pedido** → Se crea el pedido y **se limpia automáticamente el carrito**
5. **Usuario puede ver** su historial de pedidos

---

## 🔄 Implementación en el Frontend

### 1. Agregar Productos al Carrito (Sin Login)

```javascript
// Carrito local (antes de login)
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(product, quantity, customizations) {
  const item = {
    menuItemId: product.id,
    name: product.name,
    quantity: quantity,
    price: product.price,
    customizations: customizations || []
  };
  
  cart.push(item);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const customTotal = item.customizations.reduce((s, c) => s + c.price, 0);
    return sum + itemTotal + customTotal;
  }, 0);
  
  document.getElementById('cartCount').textContent = cart.length;
  document.getElementById('cartTotal').textContent = `$${total.toLocaleString()}`;
}
```

---

### 2. Usuario Inicia Sesión

```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Guardar token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Sincronizar carrito con servidor (opcional)
    await syncCartToServer();
    
    return data;
  }
  
  throw new Error(data.error);
}
```

---

### 3. Sincronizar Carrito con Servidor (Opcional)

```javascript
// Guardar carrito en el servidor para persistencia
async function syncCartToServer() {
  const token = localStorage.getItem('token');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (!token || cart.length === 0) return;
  
  const total = calculateTotal(cart);
  
  await fetch('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ items: cart, total })
  });
}

// Recuperar carrito del servidor
async function loadCartFromServer() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const response = await fetch('http://localhost:3000/api/cart', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.cart && data.cart.items.length > 0) {
    localStorage.setItem('cart', JSON.stringify(data.cart.items));
    updateCartUI();
  }
}
```

---

### 4. Crear Pedido (Limpia el Carrito Automáticamente)

```javascript
async function createOrder(locationId, deliveryAddress, notes) {
  const token = localStorage.getItem('token');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  if (!token) {
    alert('Debes iniciar sesión para hacer un pedido');
    return;
  }
  
  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  const total = calculateTotal(cart);
  
  const orderData = {
    items: cart,
    locationId: locationId,
    deliveryAddress: deliveryAddress,
    notes: notes,
    total: total
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // ✅ El servidor automáticamente limpia el carrito guardado
      // Limpiar carrito local también
      localStorage.removeItem('cart');
      updateCartUI();
      
      alert('¡Pedido creado exitosamente! ID: ' + data.order.id);
      
      // Redirigir a página de confirmación o mis pedidos
      window.location.href = '/mis-pedidos.html';
      
      return data.order;
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error al crear pedido: ' + error.message);
  }
}

function calculateTotal(cart) {
  return cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const customTotal = item.customizations.reduce((s, c) => s + c.price, 0) * item.quantity;
    return sum + itemTotal + customTotal;
  }, 0);
}
```

---

### 5. Ver Mis Pedidos

```javascript
async function getMyOrders() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Debes iniciar sesión');
    return;
  }
  
  const response = await fetch('http://localhost:3000/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (response.ok) {
    displayOrders(data.orders);
  }
}

function displayOrders(orders) {
  const container = document.getElementById('ordersContainer');
  
  if (orders.length === 0) {
    container.innerHTML = '<p>No tienes pedidos aún</p>';
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <h3>Pedido #${order.id}</h3>
      <p>Estado: <span class="badge ${order.status}">${order.status}</span></p>
      <p>Total: $${order.total.toLocaleString()}</p>
      <p>Fecha: ${new Date(order.createdAt).toLocaleString('es-CO')}</p>
      <p>Sede: ${order.locationId}</p>
      <button onclick="viewOrderDetail(${order.id})">Ver Detalle</button>
    </div>
  `).join('');
}
```

---

## 🎯 Endpoints del Carrito

### GET /api/cart
Obtiene el carrito guardado del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "cart": {
    "userId": 1,
    "items": [...],
    "total": 30000,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/cart
Guarda o actualiza el carrito del usuario.

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
      "customizations": []
    }
  ],
  "total": 30000
}
```

---

### DELETE /api/cart
Limpia el carrito del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "message": "Carrito limpiado exitosamente"
}
```

---

## ✨ Ventajas de Este Flujo

1. **Persistencia**: El carrito se guarda en el servidor, no se pierde al cerrar la página
2. **Limpieza automática**: Al crear un pedido, el carrito se limpia automáticamente
3. **Sincronización**: El carrito se sincroniza entre dispositivos si el usuario inicia sesión
4. **Historial**: Los pedidos se guardan y el usuario puede verlos en cualquier momento
5. **Sin duplicados**: No hay riesgo de crear pedidos duplicados con el mismo carrito

---

## 🔄 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario agrega productos al carrito (localStorage)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Usuario inicia sesión / se registra                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  3. (Opcional) Carrito se sincroniza con servidor           │
│     POST /api/cart                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Usuario confirma pedido                                  │
│     POST /api/orders                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  5. ✅ Pedido creado                                         │
│     ✅ Carrito limpiado automáticamente (servidor)          │
│     ✅ localStorage.removeItem('cart') (frontend)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Usuario puede ver su pedido en "Mis Pedidos"            │
│     GET /api/orders                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Casos de Uso

### Caso 1: Usuario sin cuenta
1. Agrega productos al carrito (localStorage)
2. Al intentar hacer pedido, se le pide registrarse/login
3. Después del login, el carrito local se mantiene
4. Crea el pedido → Carrito se limpia

### Caso 2: Usuario con cuenta
1. Inicia sesión
2. Agrega productos al carrito
3. Carrito se sincroniza con servidor (opcional)
4. Cierra la página
5. Vuelve a entrar → Carrito se recupera del servidor
6. Crea el pedido → Carrito se limpia

### Caso 3: Usuario cierra sin completar pedido
1. Agrega productos al carrito
2. Inicia sesión
3. Sincroniza carrito con servidor
4. Cierra la página sin hacer pedido
5. Vuelve días después
6. Carrito sigue ahí (recuperado del servidor)
7. Puede continuar con su pedido

---

¡El sistema está listo para manejar carritos persistentes y limpiarlos automáticamente al crear pedidos! 🎉
