const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [customers] = await db.query(`CALL get_customers()`);

    if (!customers.length) {
        return res.send('No customers exist');
    }

    // default to first customer
    res.redirect(`/customers/${customers[0][0].id}`);
});

router.get('/:id', async (req, res) => {
    const [customerRows] = await db.query(
        'CALL get_customer(?)',
        [req.params.id]
    );
    const [allCustomers] = await db.query('CALL get_customers()');
	const [assignments] = await db.query(`CALL get_customer_assignments(?)`, [req.params.id]);
	const [templates] = await db.query(`CALL get_task_templates()`);
	const [groups] = await db.query(`CALL get_groups()`);
	const [schedules] = await db.query(`CALL get_schedules()`);
	const [customers] = await db.query(`CALL get_customers()`);

	res.render('customer', {
		customer: customerRows[0][0],
        customers: allCustomers[0],
		assignments: assignments[0],
		templates: templates[0],
		groups: groups[0],
		schedules: schedules[0],
		customers: customers[0]
	});
});

router.get('/:id/assignments/json', async (req, res) => {
    const [rows] = await db.query(
        `CALL get_customer_assignments(?)`,
        [req.params.id]
    );

    res.json(rows[0]);
});

router.post('/:id/copy-assignments', async (req, res) => {
    const targetId = req.params.id;
    const { source_customer_id, assignment_ids } = req.body;

    if (!Array.isArray(assignment_ids)) {
        return res.sendStatus(400);
    }

    const [rows] = await db.query(
        `CALL get_customer_assignments(?)`,
        [source_customer_id]
    );

    const map = {};
    rows[0].forEach(a => map[a.id] = a);

    for (const id of assignment_ids) {
        const a = map[id];
        if (!a) continue;

        await db.query(`CALL assign_template(?, ?, ?, ?)`, [
            a.template_id,
            targetId,
            a.schedule_id,
            a.group_id
        ]);
    }

    res.sendStatus(200);
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

router.post('/:id/copy-assignments', async (req, res) => {
    const targetCustomerId = req.params.id;
    const { source_customer_id, assignment_ids } = req.body;

    if (!Array.isArray(assignment_ids) || assignment_ids.length === 0) {
        return res.redirect(`/customers/${targetCustomerId}`);
    }

    // Get all assignments for source
    const [rows] = await db.query(
        `CALL get_customer_assignments(?)`,
        [source_customer_id]
    );

    const assignments = rows[0];

    const map = {};
    assignments.forEach(a => map[a.id] = a);

    for (const id of assignment_ids) {
        const a = map[id];
        if (!a) continue;

        await db.query(`CALL assign_template(?, ?, ?, ?)`, [
            a.template_id,
            targetCustomerId,
            a.schedule_id,
            a.group_id
        ]);
    }

    res.redirect(`/customers/${targetCustomerId}`);
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