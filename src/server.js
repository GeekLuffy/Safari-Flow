// Products routes
app.get('/api/products', async (req, res) => {
  try {
    const { query, category } = req.query;
    let filter = {};
    
    // Apply search filter if query provided
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { barcode: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    // Apply category filter if provided
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get product categories - IMPORTANT: This route must be defined BEFORE the products/:id route
app.get('/api/products/categories', async (req, res) => {
  try {
    // Check if Product model exists
    if (!Product || typeof Product.aggregate !== 'function') {
      return res.status(500).json({ 
        message: 'Product model not properly initialized', 
        error: 'MongoDB model error' 
      });
    }
    
    const categories = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", count: 1 } },
      { $sort: { count: -1 } }
    ]);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ message: 'Failed to fetch product categories', error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
}); 