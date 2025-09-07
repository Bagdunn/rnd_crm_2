const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all items with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      page = 1,
      limit = 20,
      search = '',
      location = '',
      filters = '{}'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`i.category_id = (SELECT id FROM categories WHERE name = $${paramIndex})`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`i.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (location) {
      whereConditions.push(`i.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    let filtersObj = {};
    try {
      filtersObj = JSON.parse(filters);
    } catch (e) {
      // Invalid JSON, ignore filters
    }

    // Build properties filter
    if (Object.keys(filtersObj).length > 0) {
      Object.entries(filtersObj).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          whereConditions.push(`i.properties->>'${key}' = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM items i 
      JOIN categories c ON i.category_id = c.id 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count);

    // Get items
    const itemsQuery = `
      SELECT 
        i.*,
        c.name as category_name
      FROM items i 
      JOIN categories c ON i.category_id = c.id 
      ${whereClause}
      ORDER BY i.name 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const itemsResult = await db.query(itemsQuery, params);
    
    res.json({
      items: itemsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalItems,
        pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT i.*, c.name as category_name FROM items i JOIN categories c ON i.category_id = c.id WHERE i.id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').notEmpty().trim().escape(),
  body('category_id').isInt({ min: 1 }),
  body('quantity').isInt({ min: 0 }),
  body('location').optional().trim().escape(),
  body('description').optional().trim().escape(),
  body('properties').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category_id, quantity, location, description, properties } = req.body;
    
    const result = await db.query(
      'INSERT INTO items (name, category_id, quantity, location, description, properties) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category_id, quantity, location, description, properties || {}]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').optional().trim().escape(),
  body('category_id').optional().isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('location').optional().trim().escape(),
  body('description').optional().trim().escape(),
  body('properties').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, category_id, quantity, location, description, properties } = req.body;
    
    const result = await db.query(
      'UPDATE items SET name = COALESCE($1, name), category_id = COALESCE($2, category_id), quantity = COALESCE($3, quantity), location = COALESCE($4, location), description = COALESCE($5, description), properties = COALESCE($6, properties) WHERE id = $7 RETURNING *',
      [name, category_id, quantity, location, description, properties, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', [authenticateToken, requireRole(['admin'])], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Withdraw item
router.post('/:id/withdraw', [
  authenticateToken,
  body('quantity').isInt({ min: 1 }),
  body('purpose').notEmpty().trim().escape(),
  body('user_name').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, purpose, user_name } = req.body;
    
    // Start transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check current quantity
      const itemResult = await client.query('SELECT quantity FROM items WHERE id = $1 FOR UPDATE', [id]);
      
      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const currentQuantity = itemResult.rows[0].quantity;
      
      if (currentQuantity < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient quantity' });
      }
      
      // Update quantity
      await client.query('UPDATE items SET quantity = quantity - $1 WHERE id = $2', [quantity, id]);
      
      // Create transaction record
      await client.query(
        'INSERT INTO transactions (item_id, type, quantity, purpose, user_name) VALUES ($1, $2, $3, $4, $5)',
        [id, 'withdrawal', quantity, purpose, user_name]
      );
      
      await client.query('COMMIT');
      
      // Get updated item
      const updatedItem = await db.query('SELECT * FROM items WHERE id = $1', [id]);
      res.json(updatedItem.rows[0]);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error withdrawing item:', error);
    res.status(500).json({ error: 'Failed to withdraw item' });
  }
});

// Get warehouse data grouped by location
router.get('/warehouse/data', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.quantity,
        i.location,
        i.properties,
        c.name as category_name,
        c.id as category_id
      FROM items i 
      JOIN categories c ON i.category_id = c.id 
      WHERE i.location IS NOT NULL AND i.location != ''
      ORDER BY i.location, i.name
    `);
    
    // Group items by location
    const warehouseData = {};
    
    result.rows.forEach(item => {
      const location = item.location;
      
      // Parse location format (e.g., "A1:BoxName1(/2/3)", "B2:red1", "C3:green2")
      let cellId = location;
      let boxName = null;
      let color = null;
      let groupNumber = null;
      let boxNumber = null;
      
      if (location.includes(':')) {
        const parts = location.split(':');
        cellId = parts[0];
        
        if (parts.length > 1) {
          const boxPart = parts[1];
          
          // Check if it's a color format (e.g., "red1", "green2")
          const colorMatch = boxPart.match(/^([a-z]+)(\d+)$/);
          if (colorMatch) {
            color = colorMatch[1];
            groupNumber = parseInt(colorMatch[2]);
          } else {
            // Check if it's a box name format (e.g., "BoxName1", "BoxName1(/2/3)")
            const boxMatch = boxPart.match(/^([A-Za-z0-9]+)(?:\(\/(\d+)\/(\d+)\))?$/);
            if (boxMatch) {
              boxName = boxMatch[1];
              if (boxMatch[2] && boxMatch[3]) {
                // Format: BoxName1(/2/3) - where 2 is current, 3 is total
                boxNumber = parseInt(boxMatch[2]);
                const totalBoxes = parseInt(boxMatch[3]);
                // We can use this info for display if needed
              }
            } else {
              // Fallback: treat as simple box name
              boxName = boxPart;
            }
          }
        }
      }
      
      // Validate cell ID format (A1-C6)
      if (!/^[A-C][1-6]$/.test(cellId)) {
        return; // Skip invalid cell IDs
      }
      
      if (!warehouseData[cellId]) {
        warehouseData[cellId] = [];
      }
      
      warehouseData[cellId].push({
        id: item.id,
        itemId: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        category_name: item.category_name,
        category_id: item.category_id,
        boxName: boxName,
        color: color,
        groupNumber: groupNumber,
        boxNumber: boxNumber,
        properties: item.properties,
        addedAt: new Date().toISOString() // We'll use current time as placeholder
      });
    });
    
    res.json(warehouseData);
  } catch (error) {
    console.error('Error fetching warehouse data:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse data' });
  }
});

// Update item location (for warehouse management)
router.put('/:id/location', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('location').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { location } = req.body;
    
    const result = await db.query(
      'UPDATE items SET location = $1 WHERE id = $2 RETURNING *',
      [location, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item location:', error);
    res.status(500).json({ error: 'Failed to update item location' });
  }
});

module.exports = router;
