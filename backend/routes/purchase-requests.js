const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');

// Get all purchase requests with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search = '',
      deadline_from,
      deadline_to
    } = req.query;
    
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      whereConditions.push(`(item_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (deadline_from) {
      whereConditions.push(`deadline >= $${paramIndex}`);
      params.push(deadline_from);
      paramIndex++;
    }
    
    if (deadline_to) {
      whereConditions.push(`deadline <= $${paramIndex}`);
      params.push(deadline_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM purchase_requests ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const totalRequests = parseInt(countResult.rows[0].count);
    
    // Get purchase requests with category names
    const requestsQuery = `
      SELECT pr.*, c.name as category_name 
      FROM purchase_requests pr 
      LEFT JOIN categories c ON pr.category_id = c.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN pr.status = 'pending' THEN 1
          WHEN pr.status = 'approved' THEN 2
          WHEN pr.status = 'completed' THEN 3
          ELSE 4
        END,
        pr.deadline ASC,
        pr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const requestsResult = await db.query(requestsQuery, params);
    
    res.json({
      requests: requestsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRequests,
        pages: Math.ceil(totalRequests / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

// Get single purchase request
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM purchase_requests WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    res.status(500).json({ error: 'Failed to fetch purchase request' });
  }
});

// Create new purchase request
router.post('/', [
  body('category_id').isInt({ min: 1 }).withMessage('Category ID is required'),
  body('units_count').isInt({ min: 1 }).withMessage('Units count must be at least 1'),
  body('description').optional().trim().escape(),
  body('deadline').optional().isISO8601(),
  body('requester').notEmpty().trim().escape(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_id, units_count, description, deadline, requester, notes } = req.body;
    
    // Verify category exists
    const categoryCheck = await db.query('SELECT id, name FROM categories WHERE id = $1 AND is_active = TRUE', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    const result = await db.query(
      'INSERT INTO purchase_requests (category_id, units_count, description, deadline, requester, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [category_id, units_count, description, deadline, requester, notes, 'pending']
    );
    
    // Add category name to response
    const response = {
      ...result.rows[0],
      category_name: categoryCheck.rows[0].name
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// Update purchase request status
router.put('/:id/status', [
  body('status').isIn(['pending', 'approved', 'completed', 'cancelled']),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;
    
    let updateQuery = 'UPDATE purchase_requests SET status = $1';
    let params = [status, id];
    
    if (notes) {
      updateQuery += ', notes = $2';
      params = [status, notes, id];
    }
    
    updateQuery += ' WHERE id = $' + params.length + ' RETURNING *';
    
    const result = await db.query(updateQuery, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating purchase request status:', error);
    res.status(500).json({ error: 'Failed to update purchase request status' });
  }
});

// Complete purchase request and add items to inventory
router.post('/:id/complete', [
  body('item_name').notEmpty().trim().escape(),
  body('quantity_received').isInt({ min: 1 }),
  body('location').notEmpty().trim().escape(),
  body('properties').optional().isObject(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { item_name, quantity_received, location, properties, notes } = req.body;
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get purchase request with category info
      const requestResult = await client.query(
        'SELECT pr.*, c.name as category_name FROM purchase_requests pr JOIN categories c ON pr.category_id = c.id WHERE pr.id = $1 FOR UPDATE',
        [id]
      );
      
      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Purchase request not found' });
      }
      
      const request = requestResult.rows[0];
      
      if (request.status !== 'approved') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Purchase request must be approved before completion' });
      }
      
      // Create new item in the category
      const itemResult = await client.query(
        'INSERT INTO items (category_id, name, description, quantity, location, properties) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [request.category_id, item_name, request.description, quantity_received, location, properties || {}]
      );
      
      // Create transaction record
      await client.query(
        'INSERT INTO transactions (item_id, type, quantity, purpose, user_name) VALUES ($1, $2, $3, $4, $5)',
        [itemResult.rows[0].id, 'addition', quantity_received, `Purchase request #${id} completed`, 'System']
      );
      
      // Create purchase items mapping
      await client.query(
        'INSERT INTO purchase_items_mapping (purchase_request_id, item_id, quantity_added, added_by, notes) VALUES ($1, $2, $3, $4, $5)',
        [id, itemResult.rows[0].id, quantity_received, 'System', notes]
      );
      
      // Update purchase request completion status
      const newCompletedUnits = (request.completed_units || 0) + 1;
      let newStatus = request.status;
      
      if (newCompletedUnits >= request.units_count) {
        newStatus = 'completed';
        await client.query(
          'UPDATE purchase_requests SET status = $1, completed_at = NOW(), completed_units = $2, notes = COALESCE($3, notes) WHERE id = $4',
          [newStatus, newCompletedUnits, notes, id]
        );
      } else {
        await client.query(
          'UPDATE purchase_requests SET completed_units = $1, notes = COALESCE($2, notes) WHERE id = $3',
          [newCompletedUnits, notes, id]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Purchase request item added successfully',
        item_added: itemResult.rows[0],
        purchase_request: {
          ...request,
          status: newStatus,
          completed_units: newCompletedUnits
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error completing purchase request:', error);
    res.status(500).json({ error: 'Failed to complete purchase request' });
  }
});

// Delete purchase request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM purchase_requests WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    res.status(500).json({ error: 'Failed to delete purchase request' });
  }
});

module.exports = router;
