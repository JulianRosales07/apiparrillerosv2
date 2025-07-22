const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const categoryRoutes = require("./routes/categories");
const menuItemRoutes = require("./routes/menuItems");
const customizationOptionRoutes = require("./routes/customizationOptions");
const locationRoutes = require("./routes/location");
const adminRoutes = require("./routes/admin");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5174',
      'http://localhost:3000',
      'https://apiparrillerosv2.onrender.com'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      // If origin is not in the list, still allow it (for development)
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Serve static files from public directory
app.use(express.static("public"));

// Healthcheck route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Additional CORS headers middleware for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/customization-options", customizationOptionRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // Add direct admin route for frontend compatibility

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
