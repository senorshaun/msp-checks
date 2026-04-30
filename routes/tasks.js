const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [tasks] = await db.query(`CALL get_tasks()`);
	const [customers] = await db.query(`CALL get_customers()`);

	res.render('dashboard', {
		tasks: tasks[0],
		customers: customers[0]
	});
});

router.get('/task/:id', async (req, res) => {
    const [task] = await db.query(`CALL get_task(?)`, [req.params.id]);
	const [steps] = await db.query(`CALL get_task_steps(?)`, [req.params.id]);

	res.json({
		task: task[0][0],
		steps: steps[0]
	});
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