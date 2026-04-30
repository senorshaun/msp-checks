const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [tasks] = await db.query(`
        SELECT t.*, c.name customer_name, s.name status_name
        FROM tasks t
        JOIN customers c ON t.customer_id = c.id
        JOIN task_statuses s ON t.status_id = s.id
    `);

    const [customers] = await db.query(`SELECT * FROM customers`);

    res.render('dashboard', { tasks, customers });
});

router.get('/task/:id', async (req, res) => {
    const [task] = await db.query(`
        SELECT t.*, c.name customer_name
        FROM tasks t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.id = ?
    `, [req.params.id]);

    const [steps] = await db.query(`
        SELECT * FROM task_steps WHERE task_id = ?
    `, [req.params.id]);

    res.json({ task: task[0], steps });
});

router.post('/step/update', async (req, res) => {
    const { step_id, completed, notes } = req.body;

    await db.query(`CALL update_task_step(?, ?, ?, ?)`, [
        step_id, completed, 1, notes
    ]);

    res.sendStatus(200);
});

router.post('/task/complete', async (req, res) => {
    await db.query(`
        CALL update_task_status(
            ?, 
            (SELECT id FROM task_statuses WHERE name='complete'), 
            1
        )
    `, [req.body.task_id]);

    res.sendStatus(200);
});

module.exports = router;