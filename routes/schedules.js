const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [schedules] = await db.query(`CALL get_schedules()`);

	res.render('schedules', {
		schedules: schedules[0]
	});
});

router.post('/', async (req, res) => {
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
	
	const { name, frequency, interval, day_of_week, day_of_month, start_date } = req.body;

	await db.query(`CALL create_schedule(?, ?, ?, ?, ?, ?, ?, ?)`, [
		name.trim(),
		frequency,
		interval,
		day_of_week,
		day_of_month,
		month_of_year,
		start_date,
		1
	]);

    res.status(200).json({ succcess: true, redirect: '/schedules' });
});

router.put('/:id', async (req, res) => {
	const { name, frequency, interval, day_of_week, day_of_month } = req.body;
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}

    await db.query(`CALL update_schedule(?, ?, ?, ?, ?, ?, ?, ?)`, [
		req.params.id,
		name.trim(),
		frequency,
		interval,
		day_of_week,
		day_of_month,
		month_of_year,
		1
	]);

    res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
    await db.query(`CALL delete_schedule(?, ?)`, [
		req.params.id,
		1
	]);

    res.status(200).json({ success: true });
});

module.exports = router;