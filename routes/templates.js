const express = require('express');
const router = express.Router();
const db = require('../db');

/* ---------------- TEMPLATE LIST ---------------- */
router.get('/', async (req, res) => {
    const [templates] = await db.query(`CALL get_task_templates()`);

	res.render('templates', {
		templates: templates[0]
	});
});

/* ---------------- CREATE TEMPLATE ---------------- */
router.post('/create', async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        /* ---------------- CREATE TEMPLATE ---------------- */
		const [rows] = await db.query(`CALL create_task_template(?, ?)`, [
			req.body.name,
			1
		]);

		const templateId = rows[0][0].template_id;

		res.redirect(`/templates/${templateId}`);

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).send('Error creating template');
    } finally {
        conn.release();
    }
});

/* =====================================================
   TEMPLATE DETAIL PAGE (WITH STEPS)
===================================================== */

router.get('/:id', async (req, res) => {
    const templateId = req.params.id;

    const [results] = await db.query(`CALL get_template_detail(?)`, [req.params.id]);

	res.render('template_detail', {
		template: results[0][0],
		steps: results[1]
	});
});

/* ---------------- ADD STEP ---------------- */
router.post('/:id/steps/create', async (req, res) => {
    const templateId = req.params.id;

    await db.query(`CALL add_template_step(?, ?, ?)`, [
		req.params.id,
		req.body.title,
		1
	]);

    res.redirect(`/templates/${templateId}`);
});

/* ---------------- UPDATE STEP ---------------- */
router.post('/steps/update', async (req, res) => {
    await db.query(`CALL update_template_step(?, ?, ?)`, [
		req.body.step_id,
		req.body.title,
		1
	]);

    res.sendStatus(200);
});

/* ---------------- DELETE STEP ---------------- */
router.post('/steps/delete', async (req, res) => {
	await db.query(`CALL delete_template_step(?)`, [
		req.body.step_id
	]);

    res.sendStatus(200);
});

/* ---------------- REORDER STEPS ---------------- */
router.post('/:id/steps/reorder', async (req, res) => {
    const { orderedIds } = req.body;

    // orderedIds = [3,1,5,2]

    await db.query(`CALL reorder_template_steps(?, ?, ?)`, [
		req.params.id,
		req.body.orderedIds.join(','),
		1
	]);

    res.sendStatus(200);
});

module.exports = router;