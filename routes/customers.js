const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [customers] = await db.query(`SELECT * FROM customers`);
    res.render('customers', { customers });
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    const [customer] = await db.query(`SELECT * FROM customers WHERE id=?`, [id]);

    const [assignments] = await db.query(`
        SELECT ta.*, t.name template_name, g.name group_name, s.name schedule_name
        FROM template_assignments ta
        JOIN task_templates t ON ta.template_id=t.id
        JOIN groups g ON ta.group_id=g.id
        JOIN schedules s ON ta.schedule_id=s.id
        WHERE ta.customer_id=?
    `, [id]);

    const [templates] = await db.query(`SELECT * FROM task_templates`);
    const [groups] = await db.query(`SELECT * FROM groups`);
    const [schedules] = await db.query(`SELECT * FROM schedules`);

    res.render('customer_detail', { customer: customer[0], assignments, templates, groups, schedules });
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
    await db.query(`
        UPDATE template_assignments
        SET group_id=?, modified_at=NOW()
        WHERE id=?
    `, [req.body.group_id, req.body.assignment_id]);

    res.sendStatus(200);
});

router.post('/create', async (req, res) => {
    const { name } = req.body;

    await db.query(`
        INSERT INTO customers (name, modified_at, modified_by)
        VALUES (?, NOW(), 1)
    `, [name]);

    res.redirect('/customers');
});

module.exports = router;