const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all presets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM presets ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Get preset by ID with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const presetResult = await db.query('SELECT * FROM presets WHERE id = $1', [id]);
    if (presetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    const itemsResult = await db.query(`
      SELECT pi.*, c.name as category_name 
      FROM preset_items pi 
      JOIN categories c ON pi.category_id = c.id 
      WHERE pi.preset_id = $1
    `, [id]);
    
    res.json({
      ...presetResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching preset:', error);
    res.status(500).json({ error: 'Failed to fetch preset' });
  }
});

// Create new preset
router.post('/', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').notEmpty().trim().escape(),
  body('description').optional().trim().escape(),
  body('items').isArray().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, items } = req.body;
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create preset
      const presetResult = await client.query(
        'INSERT INTO presets (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );
      
      const presetId = presetResult.rows[0].id;
      
      // Create preset items with category_id
      for (const item of items) {
        await client.query(
          'INSERT INTO preset_items (preset_id, category_id, quantity_needed, requirements, notes) VALUES ($1, $2, $3, $4, $5)',
          [presetId, item.category_id, item.quantity_needed || 1, item.requirements, item.notes]
        );
      }
      
      await client.query('COMMIT');
      
      // Get created preset with items
      const createdPreset = await db.query(
        'SELECT * FROM presets WHERE id = $1',
        [presetId]
      );
      
      const createdItems = await db.query(`
        SELECT pi.*, c.name as category_name 
        FROM preset_items pi 
        JOIN categories c ON pi.category_id = c.id 
        WHERE pi.preset_id = $1
      `, [presetId]);
      
      res.status(201).json({
        ...createdPreset.rows[0],
        items: createdItems.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Failed to create preset' });
  }
});

// Update preset
router.put('/:id', [
  authenticateToken,
  requireRole(['admin', 'manager']),
  body('name').optional().trim().escape(),
  body('description').optional().trim().escape(),
  body('items').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, items } = req.body;
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update preset
      if (name || description) {
        await client.query(
          'UPDATE presets SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3',
          [name, description, id]
        );
      }
      
      // Update items if provided
      if (items) {
        // Delete existing items
        await client.query('DELETE FROM preset_items WHERE preset_id = $1', [id]);
        
        // Insert new items with category_id
        for (const item of items) {
          await client.query(
            'INSERT INTO preset_items (preset_id, category_id, quantity_needed, requirements, notes) VALUES ($1, $2, $3, $4, $5)',
            [id, item.category_id, item.quantity_needed || 1, item.requirements, item.notes]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Get updated preset with items and category names
      const updatedPreset = await db.query('SELECT * FROM presets WHERE id = $1', [id]);
      const updatedItems = await db.query(`
        SELECT pi.*, c.name as category_name 
        FROM preset_items pi 
        JOIN categories c ON pi.category_id = c.id 
        WHERE pi.preset_id = $1
      `, [id]);
      
      res.json({
        ...updatedPreset.rows[0],
        items: updatedItems.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update preset' });
  }
});

// Delete preset
router.delete('/:id', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM presets WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    
    res.json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

// Check preset availability
router.get('/:id/check', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        pi.category_id,
        c.name as category_name,
        pi.quantity_needed,
        pi.requirements,
        pi.notes,
        COALESCE(SUM(i.quantity), 0) as available_quantity,
        COUNT(i.id) as available_items_count,
        CASE 
          WHEN COALESCE(SUM(i.quantity), 0) >= pi.quantity_needed THEN 'sufficient'
          WHEN COALESCE(SUM(i.quantity), 0) > 0 THEN 'low'
          ELSE 'none'
        END as status
      FROM preset_items pi
      JOIN categories c ON pi.category_id = c.id
      LEFT JOIN items i ON i.category_id = pi.category_id
      WHERE pi.preset_id = $1
      GROUP BY pi.category_id, c.name, pi.quantity_needed, pi.requirements, pi.notes
      ORDER BY c.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error checking preset availability:', error);
    res.status(500).json({ error: 'Failed to check preset availability' });
  }
});

// Mass withdrawal from preset
router.post('/:id/withdraw', [
  authenticateToken,
  body('user_name').notEmpty().trim().escape(),
  body('purpose').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { user_name, purpose } = req.body;
    
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get preset items with category info
      const presetItems = await client.query(`
        SELECT pi.*, c.name as category_name 
        FROM preset_items pi 
        JOIN categories c ON pi.category_id = c.id 
        WHERE pi.preset_id = $1
      `, [id]);
      
      const withdrawalResults = [];
      
      for (const presetItem of presetItems.rows) {
        // Find available items in the category
        const itemsResult = await client.query(
          'SELECT * FROM items WHERE category_id = $1 AND quantity > 0 ORDER BY quantity DESC FOR UPDATE',
          [presetItem.category_id]
        );
        
        if (itemsResult.rows.length > 0) {
          let remainingNeeded = presetItem.quantity_needed;
          let totalWithdrawn = 0;
          
          for (const item of itemsResult.rows) {
            if (remainingNeeded <= 0) break;
            
            const quantityToWithdraw = Math.min(remainingNeeded, item.quantity);
            
            // Update quantity
            await client.query(
              'UPDATE items SET quantity = quantity - $1 WHERE id = $2',
              [quantityToWithdraw, item.id]
            );
            
            // Create transaction record
            await client.query(
              'INSERT INTO transactions (item_id, type, quantity, purpose, user_name) VALUES ($1, $2, $3, $4, $5)',
              [item.id, 'withdrawal', quantityToWithdraw, purpose, user_name]
            );
            
            // Create withdrawal mapping record
            await client.query(
              'INSERT INTO preset_withdrawal_mapping (preset_id, item_id, quantity_withdrawn, withdrawn_by, notes) VALUES ($1, $2, $3, $4, $5)',
              [id, item.id, quantityToWithdraw, user_name, `Withdrawn for preset: ${presetItem.requirements || 'No specific requirements'}`]
            );
            
            remainingNeeded -= quantityToWithdraw;
            totalWithdrawn += quantityToWithdraw;
          }
          
          withdrawalResults.push({
            category_name: presetItem.category_name,
            requested: presetItem.quantity_needed,
            withdrawn: totalWithdrawn,
            status: totalWithdrawn >= presetItem.quantity_needed ? 'success' : 'partial'
          });
        } else {
          withdrawalResults.push({
            category_name: presetItem.category_name,
            requested: presetItem.quantity_needed,
            withdrawn: 0,
            status: 'not_found'
          });
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Preset withdrawal completed',
        results: withdrawalResults
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error withdrawing from preset:', error);
    res.status(500).json({ error: 'Failed to withdraw from preset' });
  }
});

module.exports = router;
