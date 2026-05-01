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
	const error = requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).send(errors.join(', '));
	}
	
	const { name, frequency, interval_value, day_of_week, day_of_month, start_date } = req.body;

	await db.query(`CALL create_schedule(?, ?, ?, ?, ?, ?, ?)`, [
		req.body.name.trim(),
		req.body.frequency,
		req.body.interval_value,
		req.body.day_of_week,
		req.body.day_of_month,
		req.body.start_date,
		1
	]);

    res.redirect('/schedules');
});

router.post('/update', async (req, res) => {
    await db.query(`CALL update_schedule(?, ?, ?, ?, ?, ?, ?)`, [
		req.body.id,
		req.body.name,
		req.body.frequency,
		req.body.interval_value,
		req.body.day_of_week,
		req.body.day_of_month,
		1
	]);

    res.redirect('/schedules');
});

module.exports = router;