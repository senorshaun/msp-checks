const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [customers] = await db.query(`CALL get_customers()`);

	res.render('customers', {
		customers: customers[0]
	});
});

router.get('/:id', async (req, res) => {
    const [customer] = await db.query(`CALL get_customer(?)`, [req.params.id]);
	const [assignments] = await db.query(`CALL get_customer_assignments(?)`, [req.params.id]);
	const [templates] = await db.query(`CALL get_task_templates()`);
	const [groups] = await db.query(`CALL get_groups()`);
	const [schedules] = await db.query(`CALL get_schedules()`);

	res.render('customer_detail', {
		customer: customer[0][0],
		assignments: assignments[0],
		templates: templates[0],
		groups: groups[0],
		schedules: schedules[0]
	});
});

router.post('/:id/add-assignment', async (req, res) => {
    await db.query(`CALL assign_template(?, ?, ?, ?)`, [
        req.body.template_id,
        req.params.id,
        req.body.schedule_id,
        req.body.group_id
    ]);

    res.redirect(`/customers/${req.params.id}`);
});

router.post('/update-group', async (req, res) => {
    await db.query(`CALL update_template_assignment_group(?, ?, ?)`, [
		req.body.assignment_id,
		req.body.group_id,
		1
	]);

    res.sendStatus(200);
});

module.exports = router;