const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [assignments] = await db.query(`CALL get_assignments()`);
	const [customers] = await db.query(`CALL get_customers()`);
	const [templates] = await db.query(`CALL get_templates()`);
	const [schedules] = await db.query(`CALL get_schedules()`);
	const [groups] = await db.query(`CALL get_groups()`);
	const customersArray = req.normalize.buildCustomerResponse(customers[0]);

	res.render('assignments', {
		assignments: assignments[0],
		customers: customersArray,
		templates: templates[0],
		schedules: schedules[0],
		groups: groups[0]
	});
});

router.post('/', async (req, res) => {
    const { template_id, schedule_id, group_id, customer_ids } = req.body;
	const errors = req.helpers.requireFields(req.body, ['template_id','schedule_id']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}

    // normalize to array
    const customers = Array.isArray(customer_ids)
        ? customer_ids
        : [customer_ids];

    for (const customerId of customers) {
        await db.query(`CALL assign_template(?, ?, ?, ?, ?)`, [
            template_id,
            customerId,
            schedule_id,
            group_id || null,
			req.userId
        ]);
    }
    const redirect_url = (customers.length == 1)
		? `/customers/${customers[0]}`
		: '/assignments';
		
	res.status(200).json({ success: true, redirect: redirect_url });
});

router.put('/:id', async (req, res) => {
    const { schedule_id, group_id } = req.body;

	await db.query(`CALL update_assignment(?, ?, ?, ?)`, [
		req.params.id,
		schedule_id || null,
		group_id || null,
		req.userId
	]);
    res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
	await db.query(`CALL delete_assignment(?, ?)`, [
		req.params.id,
		req.userId
	]);
    res.status(200).json({ success: true });
});

module.exports = router;