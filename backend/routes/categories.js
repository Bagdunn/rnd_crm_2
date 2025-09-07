const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all categories with stats
router.get('/stats/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        COALESCE(COUNT(i.id), 0) as total_items,
        COALESCE(SUM(i.quantity), 0) as total_quantity,
        COALESCE(SUM(CASE WHEN i.quantity < 5 AND i.quantity > 0 THEN 1 ELSE 0 END), 0) as low_stock_count,
        COALESCE(SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories stats:', error);
    res.status(500).json({ error: 'Failed to fetch categories stats' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM categories WHERE id = $1 AND is_active = TRUE', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name is required'),
  body('description').optional().trim(),
  body('parent_id').optional().isInt().withMessage('Parent ID must be a valid integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, parent_id } = req.body;
    
    // Check if category already exists
    const existing = await db.query('SELECT id FROM categories WHERE name = $1 AND is_active = TRUE', [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const result = await db.query(
      'INSERT INTO categories (name, description, parent_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [name, description, parent_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Category name cannot be empty'),
  body('description').optional().trim(),
  body('parent_id').optional().isInt().withMessage('Parent ID must be a valid integer'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, parent_id, is_active } = req.body;
    
    // Check if category exists
    const existing = await db.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with existing category
    if (name) {
      const nameConflict = await db.query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2 AND is_active = TRUE',
        [name, id]
      );
      if (nameConflict.rows.length > 0) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
    }

    const result = await db.query(
      'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), parent_id = COALESCE($3, parent_id), is_active = COALESCE($4, is_active) WHERE id = $5 RETURNING *',
      [name, description, parent_id, is_active, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has items
    const itemsCheck = await db.query('SELECT COUNT(*) FROM items WHERE category_id = $1', [id]);
    if (parseInt(itemsCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing items' });
    }

    // Soft delete
    await db.query('UPDATE categories SET is_active = FALSE WHERE id = $1', [id]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get category statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        c.name as category_name,
        COUNT(i.id) as total_items,
        SUM(i.quantity) as total_quantity,
        AVG(i.quantity) as avg_quantity,
        COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN i.quantity < 5 THEN 1 END) as low_stock
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      WHERE c.id = $1 AND c.is_active = TRUE
      GROUP BY c.id, c.name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category stats' });
  }
});

module.exports = router;
