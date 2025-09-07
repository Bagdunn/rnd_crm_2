const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all transactions with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, type, user_name } = req.query;
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (type) {
      whereConditions.push(`t.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }
    
    if (user_name) {
      whereConditions.push(`t.user_name ILIKE $${paramIndex}`);
      params.push(`%${user_name}%`);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM transactions t 
      JOIN items i ON t.item_id = i.id 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalTransactions = parseInt(countResult.rows[0].count);
    
    // Get transactions
    const transactionsQuery = `
      SELECT 
        t.*,
        i.name as item_name,
        i.category_id,
        c.name as category_name
      FROM transactions t 
      JOIN items i ON t.item_id = i.id 
      JOIN categories c ON i.category_id = c.id 
      ${whereClause}
      ORDER BY t.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);
    
    const transactionsResult = await db.query(transactionsQuery, params);
    
    res.json({
      transactions: transactionsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawals,
        COUNT(CASE WHEN type = 'addition' THEN 1 END) as additions,
        COUNT(DISTINCT user_name) as unique_users,
        COUNT(DISTINCT item_id) as unique_items
      FROM transactions 
      WHERE created_at >= NOW() - INTERVAL '${period} days'
    `);
    
    // Get top items by usage
    const topItems = await db.query(`
      SELECT 
        i.name,
        COUNT(*) as usage_count,
        SUM(CASE WHEN t.type = 'withdrawal' THEN t.quantity ELSE 0 END) as total_withdrawn
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY i.id, i.name
      ORDER BY usage_count DESC
      LIMIT 10
    `);
    
    res.json({
      ...result.rows[0],
      top_items: topItems.rows
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Failed to fetch transaction stats' });
  }
});

// Get transactions for specific item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM transactions WHERE item_id = $1',
      [itemId]
    );
    const totalTransactions = parseInt(countResult.rows[0].count);
    
    // Get transactions
    const result = await db.query(
      'SELECT * FROM transactions WHERE item_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [itemId, parseInt(limit), offset]
    );
    
    res.json({
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching item transactions:', error);
    res.status(500).json({ error: 'Failed to fetch item transactions' });
  }
});

module.exports = router;
