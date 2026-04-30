const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [assignments] = await db.query(`
        SELECT ta.*, t.name template_name, c.name customer_name, g.name group_name
        FROM template_assignments ta
        JOIN task_templates t ON ta.template_id=t.id
        JOIN customers c ON ta.customer_id=c.id
        JOIN groups g ON ta.group_id=g.id
    `);

    res.render('assignments', { assignments });
});

module.exports = router;