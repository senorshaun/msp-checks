const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [schedules] = await db.query(`CALL get_schedules()`);

	res.render('schedules', {
		schedules: schedules[0]
	});
});

router.post('/create', async (req, res) => {
	const errors = requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).send(errors.join(', '));
	}
	
	const { name, frequency, interval, day_of_week, day_of_month, start_date } = req.body;

	await db.query(`CALL create_schedule(?, ?, ?, ?, ?, ?, ?)`, [
		name.trim(),
		frequency,
		interval,
		day_of_week,
		day_of_month,
		start_date,
		1
	]);

    res.redirect('/schedules');
});

router.post('/update', async (req, res) => {
	const { id, name, frequency, interval, day_of_week, day_of_month } = req.body;
	const errors = requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).send(errors.join(', '));
	}

    await db.query(`CALL update_schedule(?, ?, ?, ?, ?, ?, ?)`, [
		id,
		name.trim(),
		frequency,
		interval,
		day_of_week,
		day_of_month,
		1
	]);

    res.sendStatus(200);
});

module.exports = router;