const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [assignments] = await db.query(`CALL get_all_assignments()`);
	const [customers] = await db.query(`CALL get_customers()`);
	const [templates] = await db.query(`CALL get_templates()`);
	const [schedules] = await db.query(`CALL get_schedules()`);
	const [groups] = await db.query(`CALL get_groups()`);

	res.render('assignments', {
		assignments: assignments[0]
	});
});

router.post('/create', async (req, res) => {
    const { template_id, schedule_id, group_id, customer_ids } = req.body;

    if (!template_id || !schedule_id) {
        return res.status(400).send('Template and schedule are required');
    }

    // normalize to array
    const customers = Array.isArray(customer_ids)
        ? customer_ids
        : [customer_ids];

    for (const customerId of customers) {
        await db.query(`CALL assign_template(?, ?, ?, ?)`, [
            template_id,
            customerId,
            schedule_id,
            group_id || null
        ]);
    }
    if (customers.length = 1) {
		res.redirect(`/customers/${customers[0]}`);
	} else {
		res.redirect('/assignments');
	}
});

module.exports = router;