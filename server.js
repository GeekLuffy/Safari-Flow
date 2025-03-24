import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config(); // Load from .env
// Try to load from .env.local if it exists
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

// Print connection info for debugging
console.log('MongoDB URI:', process.env.VITE_MONGODB_URI ? 'Defined' : 'Not defined');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory after build
app.use(express.static(join(__dirname, 'dist')));

// Connect to MongoDB
const MONGODB_URI = process.env.VITE_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('FATAL ERROR: VITE_MONGODB_URI is not defined');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'guest'],
    default: 'staff'
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  imageUrl: String,
  autoReorder: {
    type: Boolean,
    default: false
  },
  targetStockLevel: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add pre-validation middleware to handle empty supplier strings
productSchema.pre('validate', function(next) {
  // If supplier is an empty string or invalid, set to null
  if (this.supplier === '' || this.supplier === 'null' || this.supplier === undefined) {
    this.supplier = null;
  }
  next();
});

// Add middleware to ensure nulls are properly handled
productSchema.pre('save', function(next) {
  if (this.supplier === '') {
    this.supplier = null;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

// Create default supplier if not exists
const createDefaultSupplier = async () => {
  try {
    const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
    if (!defaultSupplier) {
      console.log('Creating default supplier...');
      const newSupplier = new Supplier({
        name: 'Default Supplier',
        contactPerson: 'System Admin',
        email: 'admin@safariflow.com',
        phone: '000-000-0000',
        address: 'System Default',
        products: []
      });
      const savedSupplier = await newSupplier.save();
      console.log('Default supplier created with ID:', savedSupplier._id);
      return savedSupplier;
    }
    console.log('Default supplier already exists with ID:', defaultSupplier._id);
    return defaultSupplier;
  } catch (error) {
    console.error('Error creating default supplier:', error);
    return null;
  }
};

// Sales Schema
const saleSchema = new mongoose.Schema({
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productSnapshot: {
      name: String,
      category: String,
      price: Number,
      barcode: String
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceAtSale: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    required: true
  },
  customerId: {
    type: String
  },
  customerName: {
    type: String
  },
  employeeId: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['in-store', 'online'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);

// Purchase Order Schema
const purchaseOrderSchema = new mongoose.Schema({
  supplierId: {
    type: String,
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'ordered', 'received', 'canceled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  deliveredDate: {
    type: Date
  }
}, {
  timestamps: true
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// Server-side notification handler (will be initialized later)
let NotificationService = null;

// Try to load the notification service
const initNotificationService = async () => {
  try {
    const module = await import('./src/lib/services/notificationService.js');
    NotificationService = module.NotificationService;
    
    // Add default implementations in case some methods are missing
    if (!NotificationService) {
      throw new Error('NotificationService is not defined in the imported module');
    }
    
    // Add default methods if any are missing
    NotificationService.notifyNewTransaction = NotificationService.notifyNewTransaction || 
      ((amount, items) => console.log(`Transaction completed: ${amount} for ${items} items`));
    
    NotificationService.notifyStockUpdate = NotificationService.notifyStockUpdate || 
      ((items) => console.log(`Stock updated for ${items} items`));
    
    NotificationService.checkStockLevels = NotificationService.checkStockLevels || 
      ((products) => console.log(`Checking stock levels for ${products?.length || 0} products`));
    
    console.log('Notification service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize notification service, creating fallback implementation:', error);
    
    // Create a fallback implementation
    NotificationService = {
      notifyNewTransaction: (amount, items) => {
        console.log(`NEW TRANSACTION: Sale of ${amount} with ${items} items`);
      },
      notifyStockUpdate: (items) => {
        console.log(`STOCK UPDATED: ${items} items`);
      },
      checkStockLevels: (products) => {
        if (!products || !products.length) return { lowStockItems: [], outOfStockItems: [] };
        
        const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
        const outOfStockItems = products.filter(p => p.stock === 0);
        
        console.log(`STOCK CHECK: ${lowStockItems.length} low stock, ${outOfStockItems.length} out of stock`);
        return { lowStockItems, outOfStockItems };
      }
    };
  }
};

// Initialize as soon as possible
initNotificationService();

// API Routes
// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff',
      avatar: 'https://github.com/shadcn.png'
    });

    // Save user
    const savedUser = await newUser.save();

    // Return user data without password
    res.status(201).json({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      avatar: savedUser.avatar
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Return user data without password
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    
    res.json(users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    })));
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
app.put('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['admin', 'staff', 'guest'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PRODUCT API ENDPOINTS

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { query, category } = req.query;
    
    // Build filter
    const filter = {};
    
    // Add search by name or barcode if query present
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } }, // Case-insensitive search
        { barcode: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Add category filter if present and not 'all'
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Fetch products with filter
    const products = await Product.find(filter);
    
    // Return formatted products
    res.json(products.map(product => ({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      imageUrl: product.imageUrl,
      supplier: product.supplier,
      reorderLevel: product.reorderLevel,
      autoReorder: product.autoReorder,
      targetStockLevel: product.targetStockLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    })));
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product categories
app.get('/api/products/categories', async (req, res) => {
  try {
    // Aggregate products by category
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);
    
    res.json(categoryCounts);
  } catch (error) {
    console.error('Error getting product categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Skip if the ID is 'categories' as it's handled by a different route
    if (id === 'categories') {
      return res.status(404).json({ message: 'Invalid product ID' });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get supplier name if available
    let supplierName = '';
    if (product.supplier) {
      const SupplierModel = mongoose.model('Supplier');
      const supplier = await SupplierModel.findById(product.supplier);
      if (supplier) {
        supplierName = supplier.name;
      }
    }
    
    res.json({
      id: product._id,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      imageUrl: product.imageUrl,
      supplier: supplierName,
      reorderLevel: product.reorderLevel,
      autoReorder: product.autoReorder,
      targetStockLevel: product.targetStockLevel,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    const productData = req.body;
    
    console.log('Creating product with data:', JSON.stringify({
      ...productData,
      supplier: productData.supplier === '' ? 'EMPTY STRING' : productData.supplier
    }));
    
    // Handle supplier field properly
    if (productData.hasOwnProperty('supplier')) {
      // If supplier is empty string, null, or undefined, try to use default supplier
      if (!productData.supplier || productData.supplier === '' || productData.supplier === 'null') {
        console.log('Finding default supplier');
        try {
          const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
          if (defaultSupplier) {
            console.log(`Using default supplier with ID: ${defaultSupplier._id}`);
            productData.supplier = defaultSupplier._id;
          } else {
            console.log('No default supplier found, setting to null');
            productData.supplier = null;
          }
        } catch (defaultSupplierError) {
          console.error('Error finding default supplier:', defaultSupplierError);
          productData.supplier = null;
        }
      } else if (typeof productData.supplier === 'string') {
        // If it's a non-empty string, try to find the supplier by name
        try {
          const SupplierModel = mongoose.model('Supplier');
          const supplier = await SupplierModel.findOne({ name: productData.supplier });
          
          if (supplier) {
            console.log(`Found supplier: ${supplier.name} with ID: ${supplier._id}`);
            productData.supplier = supplier._id;
          } else {
            console.log(`Supplier not found with name: ${productData.supplier}, using default`);
            // Try to use default supplier
            const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
            if (defaultSupplier) {
              console.log(`Using default supplier with ID: ${defaultSupplier._id}`);
              productData.supplier = defaultSupplier._id;
            } else {
              productData.supplier = null;
            }
          }
        } catch (supplierError) {
          console.error('Error finding supplier:', supplierError);
          productData.supplier = null;
        }
      }
    } else {
      // If supplier is not provided, use default supplier
      try {
        const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
        if (defaultSupplier) {
          console.log(`Adding default supplier with ID: ${defaultSupplier._id}`);
          productData.supplier = defaultSupplier._id;
        }
      } catch (error) {
        console.error('Error finding default supplier:', error);
      }
    }
    
    // Create and save the product
    const product = new Product(productData);
    const savedProduct = await product.save();
    
    // If there's a supplier, add this product to the supplier's products array
    if (savedProduct.supplier) {
      const SupplierModel = mongoose.model('Supplier');
      await SupplierModel.findByIdAndUpdate(
        savedProduct.supplier,
        { $addToSet: { products: savedProduct._id } }
      );
    }
    
    // Get supplier name for response
    let supplierName = '';
    if (savedProduct.supplier) {
      const supplier = await Supplier.findById(savedProduct.supplier);
      if (supplier) {
        supplierName = supplier.name;
      }
    }
    
    res.status(201).json({
      id: savedProduct._id,
      name: savedProduct.name,
      barcode: savedProduct.barcode,
      category: savedProduct.category,
      price: savedProduct.price,
      costPrice: savedProduct.costPrice,
      stock: savedProduct.stock,
      imageUrl: savedProduct.imageUrl,
      supplier: supplierName,
      reorderLevel: savedProduct.reorderLevel,
      autoReorder: savedProduct.autoReorder,
      targetStockLevel: savedProduct.targetStockLevel,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Add better error diagnostics
    if (error.name === 'ValidationError') {
      // Check for specific validation errors
      const errorMessages = {};
      for (const field in error.errors) {
        errorMessages[field] = {
          message: error.errors[field].message,
          kind: error.errors[field].kind,
          value: error.errors[field].value
        };
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        fieldErrors: errorMessages 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('Updating product:', id);
    console.log('Update data:', JSON.stringify({
      ...updateData,
      supplier: updateData.supplier === '' ? 'EMPTY STRING' : updateData.supplier
    }));
    
    // Find the current product to get the previous supplier if there is one
    const currentProduct = await Product.findById(id);
    
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const previousSupplierId = currentProduct.supplier;
    
    // Handle supplier field properly
    if (updateData.hasOwnProperty('supplier')) {
      // If supplier is empty string, null, or undefined, try to use default supplier
      if (!updateData.supplier || updateData.supplier === '' || updateData.supplier === 'null') {
        console.log('Finding default supplier');
        try {
          const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
          if (defaultSupplier) {
            console.log(`Using default supplier with ID: ${defaultSupplier._id}`);
            updateData.supplier = defaultSupplier._id;
          } else {
            console.log('No default supplier found, setting to null');
            updateData.supplier = null;
          }
        } catch (defaultSupplierError) {
          console.error('Error finding default supplier:', defaultSupplierError);
          updateData.supplier = null;
        }
      } else if (typeof updateData.supplier === 'string') {
        // If it's a non-empty string, try to find the supplier by name
        try {
          const SupplierModel = mongoose.model('Supplier');
          const supplier = await SupplierModel.findOne({ name: updateData.supplier });
          
          if (supplier) {
            console.log(`Found supplier: ${supplier.name} with ID: ${supplier._id}`);
            updateData.supplier = supplier._id;
          } else {
            console.log(`Supplier not found with name: ${updateData.supplier}, using default`);
            // Try to use default supplier
            const defaultSupplier = await Supplier.findOne({ name: 'Default Supplier' });
            if (defaultSupplier) {
              console.log(`Using default supplier with ID: ${defaultSupplier._id}`);
              updateData.supplier = defaultSupplier._id;
            } else {
              updateData.supplier = null;
            }
          }
        } catch (supplierError) {
          console.error('Error finding supplier:', supplierError);
          updateData.supplier = null;
        }
      }
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Handle supplier product list updates
    const SupplierModel = mongoose.model('Supplier');
    
    // 1. If there was a previous supplier, remove product from its list
    if (previousSupplierId && (!updatedProduct.supplier || !previousSupplierId.equals(updatedProduct.supplier))) {
      await SupplierModel.findByIdAndUpdate(
        previousSupplierId,
        { $pull: { products: id } }
      );
    }
    
    // 2. If there is a new supplier, add product to its list
    if (updatedProduct.supplier && (!previousSupplierId || !previousSupplierId.equals(updatedProduct.supplier))) {
      await SupplierModel.findByIdAndUpdate(
        updatedProduct.supplier,
        { $addToSet: { products: id } }
      );
    }
    
    // Get supplier name for response
    let supplierName = '';
    if (updatedProduct.supplier) {
      const supplier = await SupplierModel.findById(updatedProduct.supplier);
      if (supplier) {
        supplierName = supplier.name;
      }
    }
    
    res.json({
      id: updatedProduct._id,
      name: updatedProduct.name,
      barcode: updatedProduct.barcode,
      category: updatedProduct.category,
      price: updatedProduct.price,
      costPrice: updatedProduct.costPrice,
      stock: updatedProduct.stock,
      imageUrl: updatedProduct.imageUrl,
      supplier: supplierName,
      reorderLevel: updatedProduct.reorderLevel,
      autoReorder: updatedProduct.autoReorder,
      targetStockLevel: updatedProduct.targetStockLevel,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Add better error diagnostics
    if (error.name === 'ValidationError') {
      // Check for specific validation errors
      const errorMessages = {};
      for (const field in error.errors) {
        errorMessages[field] = {
          message: error.errors[field].message,
          kind: error.errors[field].kind,
          value: error.errors[field].value
        };
      }
      return res.status(400).json({ 
        message: 'Validation error', 
        fieldErrors: errorMessages 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sales API endpoints
// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const filter = {};
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Filter by payment method if provided
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }
    
    // Filter by channel if provided
    if (req.query.channel) {
      filter.channel = req.query.channel;
    }
    
    // Filter by customer name if provided
    if (req.query.customerName) {
      filter.customerName = { $regex: req.query.customerName, $options: 'i' };
    }
    
    const sales = await Sale.find(filter)
      .populate('products.product', 'name category price barcode stock costPrice')
      .sort({ timestamp: -1 });
    
    // Ensure each sale has product information and valid IDs for client
    const formattedSales = sales.map(sale => {
      const saleObj = sale.toObject();
      return {
        ...saleObj,
        id: saleObj._id, // Ensure there's always an id property
        products: saleObj.products.map(product => ({
          ...product,
          product: {
            id: product.product?._id || 'unknown-id',
            name: product.productSnapshot?.name || product.product?.name || 'Unknown Product',
            ...product.product,
          }
        }))
      };
    });
    
    res.json(formattedSales);
  } catch (error) {
    console.error('Error getting sales:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sale by ID
app.get('/api/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('products.product', 'name category price barcode stock costPrice');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // Format the sale for the client
    const saleObj = sale.toObject();
    const formattedSale = {
      ...saleObj,
      id: saleObj._id, // Ensure there's always an id property
      products: saleObj.products.map(product => ({
        ...product,
        product: {
          id: product.product?._id || 'unknown-id',
          name: product.productSnapshot?.name || product.product?.name || 'Unknown Product',
          ...product.product,
        }
      }))
    };
    
    res.json(formattedSale);
  } catch (error) {
    console.error('Error getting sale:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new sale
app.post('/api/sales', async (req, res) => {
  try {
    const {
      products,
      totalAmount,
      paymentMethod,
      customerId,
      customerName,
      employeeId,
      channel
    } = req.body;
    
    // Validate required fields
    if (!products || !products.length || !totalAmount || !paymentMethod || !employeeId || !channel) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create product snapshots and validate products
    const processedProducts = [];
    
    for (const item of products) {
      try {
        // Check if product exists and has sufficient stock
        let productId;
        
        // Handle both string IDs and object format
        if (typeof item.product === 'object' && item.product.id) {
          productId = item.product.id;
        } else if (typeof item.product === 'object' && item.product._id) {
          productId = item.product._id;
        } else {
          productId = item.product;
        }
        
        // Ensure productId is a string
        productId = String(productId);
        
        // Check if productId is valid
        try {
          if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.error(`Invalid ObjectId format for product: ${JSON.stringify(item.product)}`);
            return res.status(400).json({ message: `Invalid product ID format: ${productId}` });
          }
        } catch (idError) {
          console.error(`Error validating ObjectId: ${idError.message}`);
          return res.status(400).json({ message: `Invalid product ID: ${idError.message}` });
        }
        
        const product = await Product.findById(productId);
        
        if (!product) {
          return res.status(400).json({ message: `Product with ID ${productId} not found` });
        }
        
        if (channel === 'in-store' && product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
          });
        }
        
        // Create a snapshot of the product at the time of sale
        processedProducts.push({
          product: product._id, // Always use the MongoDB _id
          productSnapshot: {
            name: product.name,
            category: product.category,
            price: product.price,
            barcode: product.barcode
          },
          quantity: item.quantity,
          priceAtSale: item.priceAtSale || product.price
        });
        
        // Update stock for in-store purchases
        if (channel === 'in-store') {
          product.stock -= item.quantity;
          await product.save();
        }
      } catch (error) {
        console.error(`Error processing product ${JSON.stringify(item.product)}:`, error);
        return res.status(400).json({ message: `Error processing product: ${error.message}` });
      }
    }
    
    // Create new sale
    const newSale = new Sale({
      products: processedProducts,
      totalAmount,
      paymentMethod,
      customerId,
      customerName,
      employeeId,
      channel,
      timestamp: new Date()
    });
    
    const savedSale = await newSale.save();
    
    // Format the response with client-friendly IDs
    const formattedSale = {
      id: savedSale._id,
      products: savedSale.products.map(item => ({
        product: {
          id: item.product,
          ...item.productSnapshot
        },
        quantity: item.quantity,
        priceAtSale: item.priceAtSale
      })),
      totalAmount: savedSale.totalAmount,
      paymentMethod: savedSale.paymentMethod,
      customerId: savedSale.customerId,
      customerName: savedSale.customerName,
      employeeId: savedSale.employeeId,
      channel: savedSale.channel,
      timestamp: savedSale.timestamp,
      createdAt: savedSale.createdAt,
      updatedAt: savedSale.updatedAt
    };
    
    // Notify about the transaction
    try {
      await NotificationService.notifyNewTransaction(totalAmount, processedProducts.length);
      
      // Notify about stock update
      if (channel === 'in-store') {
        await NotificationService.notifyStockUpdate(processedProducts.length);
      }
      
      // Check for low stock after sale
      const allProducts = await Product.find();
      await NotificationService.checkStockLevels(allProducts);
    } catch (notifyError) {
      console.warn('Could not send notification:', notifyError);
      // Continue - notifications are non-critical
    }
    
    res.status(201).json(formattedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete sale
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    // If this was an in-store sale, restore stock
    if (sale.channel === 'in-store') {
      for (const item of sale.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    
    await Sale.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales analytics
app.get('/api/sales/analytics/summary', async (req, res) => {
  try {
    // Get total revenue
    const totalRevenue = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    // Get sales by payment method
    const salesByPaymentMethod = await Sale.aggregate([
      { $group: { _id: '$paymentMethod', amount: { $sum: '$totalAmount' } } }
    ]);
    
    // Get sales by channel
    const salesByChannel = await Sale.aggregate([
      { $group: { _id: '$channel', amount: { $sum: '$totalAmount' } } }
    ]);
    
    // Get total number of transactions
    const totalTransactions = await Sale.countDocuments();
    
    // Get total number of products sold
    const productsSold = await Sale.aggregate([
      { $unwind: '$products' },
      { $group: { _id: null, count: { $sum: '$products.quantity' } } }
    ]);
    
    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      salesByPaymentMethod: salesByPaymentMethod.map(item => ({
        name: item._id,
        value: item.amount
      })),
      salesByChannel: salesByChannel.map(item => ({
        name: item._id,
        value: item.amount
      })),
      totalTransactions,
      productsSold: productsSold.length > 0 ? productsSold[0].count : 0
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PURCHASE ORDER API ENDPOINTS

// Get all purchase orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('products.productId', 'name category price barcode stock');
    
    res.json(purchaseOrders.map(order => ({
      id: order._id,
      supplierId: order.supplierId,
      products: order.products.map(item => {
        // Check if product exists before accessing its properties
        if (!item.productId) {
          return {
            productId: 'unknown',
            productName: 'Product Not Found',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          };
        }
        
        return {
          productId: item.productId._id,
          productName: item.productId.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      }),
      status: order.status,
      totalAmount: order.totalAmount,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      deliveredDate: order.deliveredDate,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    })));
  } catch (error) {
    console.error('Error getting purchase orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get purchase order by ID
app.get('/api/purchase-orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('products.productId', 'name category price barcode stock');
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    res.json({
      id: purchaseOrder._id,
      supplierId: purchaseOrder.supplierId,
      products: purchaseOrder.products.map(item => {
        // Check if product exists before accessing its properties
        if (!item.productId) {
          return {
            productId: 'unknown',
            productName: 'Product Not Found',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          };
        }
        
        return {
          productId: item.productId._id,
          productName: item.productId.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      }),
      status: purchaseOrder.status,
      totalAmount: purchaseOrder.totalAmount,
      orderDate: purchaseOrder.orderDate,
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
      deliveredDate: purchaseOrder.deliveredDate,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt
    });
  } catch (error) {
    console.error('Error getting purchase order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create purchase order
app.post('/api/purchase-orders', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate product IDs before creating purchase order
    if (orderData.products && Array.isArray(orderData.products)) {
      const validatedProducts = [];
      
      for (const item of orderData.products) {
        // Skip items with missing or invalid productId
        if (!item.productId) {
          console.warn('Skipping purchase order item with missing productId');
          continue;
        }
        
        try {
          // Check if product exists
          const product = await Product.findById(item.productId);
          if (product) {
            validatedProducts.push(item);
          } else {
            console.warn(`Product with ID ${item.productId} not found, skipping from purchase order`);
          }
        } catch (err) {
          console.error(`Error validating product ${item.productId}:`, err);
          // Skip invalid product IDs
        }
      }
      
      // Replace products array with validated products
      orderData.products = validatedProducts;
    }
    
    // Create purchase order
    const purchaseOrder = new PurchaseOrder(orderData);
    
    // Save purchase order
    const savedOrder = await purchaseOrder.save();
    
    // Return formatted order
    res.status(201).json({
      id: savedOrder._id,
      supplierId: savedOrder.supplierId,
      products: savedOrder.products,
      status: savedOrder.status,
      totalAmount: savedOrder.totalAmount,
      orderDate: savedOrder.orderDate,
      expectedDeliveryDate: savedOrder.expectedDeliveryDate,
      deliveredDate: savedOrder.deliveredDate,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update purchase order status
app.patch('/api/purchase-orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['pending', 'ordered', 'received', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Update purchase order
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'received' ? { deliveredDate: new Date() } : {})
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    
    // If order is received, update product stock
    if (status === 'received') {
      for (const item of updatedOrder.products) {
        // Skip if productId is missing or invalid
        if (!item.productId) {
          console.warn(`Skipping stock update for item with missing productId in order ${id}`);
          continue;
        }
        
        try {
          // Find product
          const product = await Product.findById(item.productId);
          if (product) {
            // Increase stock
            product.stock += item.quantity;
            await product.save();
          } else {
            console.warn(`Product with ID ${item.productId} not found during order processing`);
          }
        } catch (err) {
          console.error(`Error updating stock for product ${item.productId}:`, err);
          // Continue with other products
        }
      }
    }
    
    // Return updated order
    res.json({
      id: updatedOrder._id,
      supplierId: updatedOrder.supplierId,
      products: updatedOrder.products.map(item => {
        return {
          productId: item.productId || 'unknown',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        };
      }),
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      orderDate: updatedOrder.orderDate,
      expectedDeliveryDate: updatedOrder.expectedDeliveryDate,
      deliveredDate: updatedOrder.deliveredDate,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SUPPLIER API ENDPOINTS

// Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await mongoose.model('Supplier').find({})
      .populate('products', 'name category price stock')
      .sort({ name: 1 });
    
    res.json(suppliers.map(supplier => ({
      id: supplier._id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      products: supplier.products,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    })));
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get supplier by ID
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await mongoose.model('Supplier').findById(id)
      .populate('products', 'name category price stock');
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json({
      id: supplier._id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      products: supplier.products,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const supplierData = req.body;
    
    // Initialize products as empty array if not provided
    if (!supplierData.products) {
      supplierData.products = [];
    }
    
    // Create new supplier
    const SupplierModel = mongoose.model('Supplier');
    const newSupplier = new SupplierModel(supplierData);
    
    // Save supplier
    const savedSupplier = await newSupplier.save();
    
    // Return the newly created supplier
    res.status(201).json({
      id: savedSupplier._id,
      name: savedSupplier.name,
      contactPerson: savedSupplier.contactPerson,
      email: savedSupplier.email,
      phone: savedSupplier.phone,
      address: savedSupplier.address,
      products: savedSupplier.products || [],
      createdAt: savedSupplier.createdAt,
      updatedAt: savedSupplier.updatedAt
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Failed to create supplier' });
  }
});

// Update supplier
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierData = req.body;
    
    // Update supplier
    const SupplierModel = mongoose.model('Supplier');
    const updatedSupplier = await SupplierModel.findByIdAndUpdate(
      id,
      supplierData,
      { new: true } // Return the updated document
    ).populate('products', 'name category price stock');
    
    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Return the updated supplier
    res.json({
      id: updatedSupplier._id,
      name: updatedSupplier.name,
      contactPerson: updatedSupplier.contactPerson,
      email: updatedSupplier.email,
      phone: updatedSupplier.phone,
      address: updatedSupplier.address,
      products: updatedSupplier.products || [],
      createdAt: updatedSupplier.createdAt,
      updatedAt: updatedSupplier.updatedAt
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete supplier
app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const SupplierModel = mongoose.model('Supplier');
    const deletedSupplier = await SupplierModel.findByIdAndDelete(id);
    
    if (!deletedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// For all other routes, serve the React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Create default supplier
  const defaultSupplier = await createDefaultSupplier();
  
  // Set up a periodic check for low stock items (every hour)
  // First check after 5 minutes to give the system time to initialize
  setTimeout(() => {
    const checkForLowStock = async () => {
      try {
        console.log('Performing scheduled check for low stock items');
        const products = await Product.find();
        if (NotificationService) {
          await NotificationService.checkStockLevels(products);
        }
      } catch (error) {
        console.error('Error checking for low stock:', error);
      }
    };
    
    // Run initial check
    checkForLowStock();
    
    // Schedule regular checks (every hour)
    setInterval(checkForLowStock, 60 * 60 * 1000);
  }, 5 * 60 * 1000);
}); 