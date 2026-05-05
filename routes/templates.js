const express = require('express');
const router = express.Router();
const db = require('../db');

/* ---------------- TEMPLATE LIST ---------------- */
router.get('/', async (req, res) => {
    const [templates] = await db.query(`CALL get_templates()`);

	res.render('templates', {
		templates: templates[0]
	});
});

/* ---------------- CREATE TEMPLATE ---------------- */
router.post('/', async (req, res) => {
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
	
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        /* ---------------- CREATE TEMPLATE ---------------- */
		const [rows] = await db.query(`CALL create_template(?, ?, ?)`, [
			req.body.name.trim(),
			req.body.description.trim(),
			req.userId
		]);
		const templateId = rows[0][0].template_id;
		res.status(200).json({ success: true, redirect: `/templates/${templateId}` });

    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, error: 'Error creating template' });
    } finally {
        conn.release();
    }
});

router.get('/:id', async (req, res) => {
    const [results] = await db.query(`CALL get_template(?)`, [req.params.id]);

	res.status(200).json({
		success: true,
		data: {
			template: results[0][0],
			steps: results[1]
		}
	});
});

router.put('/:id', async (req, res) => {
	const errors = req.helpers.requireFields(req.body, ['name']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
	
    await db.query(`CALL update_template(?, ?, ?, ?)`, [
			req.params.id,
			req.body.name.trim(),
			req.body.description.trim() || null,
			req.userId
		]);

	res.status(200).json({ success: true });
});

router.delete('/:id', async (req, res) => {
    const [results] = await db.query(`CALL delete_template(?, ?)`, [req.params.id, req.userId]);
    res.status(200).json({ success: true });
});

router.post('/:id/steps', async (req, res) => {
	const errors = req.helpers.requireFields(req.body, ['title']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}

    const rows = await db.query(`CALL create_template_step(?, ?, ?, ?)`, [
		req.params.id,
		req.body.title.trim(),
		req.body.description.trim() || null,
		req.userId
	]);
	
	const newId = rows?.[0]?.[0]?.id;

    if (!newId) {
        return res.status(500).json({ success: false, error: 'Failed to get new step ID' });
    }

    res.status(200).json({
		success: true,
		data: {
			step: {
				id: newId,
				title,
				description,
				sort_order: 1
			}
		}
	});
});

router.put('/:templateid/steps/:stepid', async (req, res) => {
	const errors = req.helpers.requireFields(req.body, ['title']);
	if (errors.length) {
		return res.status(400).json({success: false, error: errors.join(', ')});
	}
	
    await db.query(`CALL update_template_step(?, ?, ?, ?)`, [
		req.params.stepid,
		req.body.title.trim(),
		req.body.description.trim() || null,
		req.userId
	]);

    res.status(200).json({ success: true });
});

router.delete('/:templateid/steps/:id', async (req, res) => {
	await db.query(`CALL delete_template_step(?, ?)`, [
		req.params.id,
		req.userId
	]);

    res.status(200).json({ success: true });
});

router.post('/:templateid/steps/reorder', async (req, res) => {
    const { orderedIds } = req.body.step_ids;
    await db.query(`CALL reorder_template_steps(?, ?, ?)`, [
		req.params.id,
		req.body.orderedIds.join(','),
		req.userId
	]);

    res.status(200).json({ success: true });
});

module.exports = router;