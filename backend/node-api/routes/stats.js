const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /stats
router.get('/', async (req, res) => {
    try {
        const stats = {};

        // 1. Popular Hall
        const [halls] = await db.query(`
            SELECT h.name, SUM(p.tickets) as total_tickets
            FROM purchases p
            JOIN halls h ON p.hall_id = h.id
            GROUP BY p.hall_id
            ORDER BY total_tickets DESC
            LIMIT 1
        `);
        stats.popularHall = halls[0] || null;

        // 2. Popular Time
        const [times] = await db.query(`
            SELECT DATE_FORMAT(viewing_date, '%H:00') as hour_slot, SUM(tickets) as total_tickets
            FROM purchases
            GROUP BY hour_slot
            ORDER BY total_tickets DESC
            LIMIT 1
        `);
        stats.popularTime = times[0] || null;

        // 3. Popular Genre
        const [genres] = await db.query(`
            SELECT m.genre, SUM(p.tickets) as total_tickets
            FROM purchases p
            JOIN movies m ON p.movie_id = m.id
            GROUP BY m.genre
            ORDER BY total_tickets DESC
            LIMIT 1
        `);
        stats.popularGenre = genres[0] || null;

        // 4. Best Selling Movie
        const [movies] = await db.query(`
            SELECT movie_title, SUM(tickets) as total_tickets
            FROM purchases
            GROUP BY movie_id
            ORDER BY total_tickets DESC
            LIMIT 1
        `);
        stats.bestSellingMovie = movies[0] || null;

        // 5. Revenue Per Movie
        const [revenue] = await db.query(`
            SELECT movie_title, SUM(total_price) as total_revenue, SUM(tickets) as tickets_sold
            FROM purchases
            GROUP BY movie_id
            ORDER BY total_revenue DESC
        `);
        stats.revenuePerMovie = revenue;

        res.json({ success: true, stats });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener estadísticas: " + error.message });
    }
});

module.exports = router;
