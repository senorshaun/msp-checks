const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [tasks] = await db.query(`CALL get_tasks(?)`,[req.userId]);
	const [customers] = await db.query(`CALL get_customers()`);
	const [groups] = await db.query(`CALL get_groups()`);
	const customerArray = req.normalize.buildCustomerResponse(customers[0]);
	const [tickets] =  await db.query(`CALL get_tickets(?)`,[req.userId]);
	const items = [
		...tasks[0].map(t => req.normalize.normalizeTask(t)),
		...tickets[0].map(t=> req.normalize.normalizeTickets(t))
	];

	res.render('dashboard', {
		items: items,
		customers: customerArray,
		groups: groups[0]
	});
});

router.post('/task', async (req, res) => {
	const { name, description, due_date, customer_id, group_id } = req.body;
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
    await db.query(`
        CALL create_task(?, ?, ?, ?, ?, ?)`, [
			name,
			description,
			due_date,
			customer_id,
			group_id,
			req.userId
	]);

    res.status(200).json({ success: true });
});

router.get('/task/:id', async (req, res) => {
    const [task] = await db.query(`CALL get_task(?)`, [req.params.id]);
	const [steps] = await db.query(`CALL get_task_steps(?)`, [req.params.id]);

	res.status(200).json({
		success: true,
		data: {
			task: task[0][0],
			steps: steps[0]
		}
	});
});

router.put('/task/:id', async (req, res) => {
	const { name, description, due_date, customer_id, group_id } = req.body;
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
    await db.query(`
        CALL update_task(?, ?, ?, ?, ?, ?, ?)`, [
			req.params.id,
			name,
			description,
			due_date,
			customer_id,
			group_id,
			req.userId
	]);

    res.status(200).json({ success: true });
});

router.post('/step/update', async (req, res) => {
    const { step_id, completed, notes } = req.body;

    await db.query(`CALL update_task_step(?, ?, ?, ?)`, [
        step_id, 
		completed, 
		req.userId, 
		notes
    ]);

    res.status(200).json({ success: true });
});

router.post('/task/complete', async (req, res) => {
    await db.query(`
        CALL update_task_status(
            ?, 
            (SELECT id FROM task_statuses WHERE name='complete'), 
            ?
        )
    `, [req.body.task_id, req.userId]);

    res.status(200).json({ success: true });
});

module.exports = router;