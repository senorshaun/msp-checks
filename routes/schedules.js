const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [schedules] = await db.query(`SELECT * FROM schedules`);
    res.render('schedules', { schedules });
});

router.post('/create', async (req, res) => {
    const { name, frequency, interval_value, day_of_week, day_of_month, start_date } = req.body;

    await db.query(`
        INSERT INTO schedules 
        (name, frequency, interval_value, day_of_week, day_of_month, start_date, modified_at, modified_by)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
    `, [name, frequency, interval_value, day_of_week, day_of_month, start_date]);

    res.redirect('/schedules');
});

router.post('/update', async (req, res) => {
    await db.query(`
        UPDATE schedules SET
            name=?, frequency=?, interval_value=?, day_of_week=?, day_of_month=?,
            modified_at=NOW(), modified_by=1
        WHERE id=?
    `, [
        req.body.name,
        req.body.frequency,
        req.body.interval_value,
        req.body.day_of_week,
        req.body.day_of_month,
        req.body.id
    ]);

    res.redirect('/schedules');
});

module.exports = router;