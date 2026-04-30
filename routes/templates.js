const express = require('express');
const router = express.Router();
const db = require('../db');

/* ---------------- TEMPLATE LIST ---------------- */
router.get('/', async (req, res) => {
    const [templates] = await db.query(`SELECT * FROM task_templates`);
    res.render('templates', { templates });
});

/* ---------------- CREATE TEMPLATE ---------------- */
router.post('/create', async (req, res) => {
    await db.query(`
        INSERT INTO task_templates (name, modified_at, modified_by)
        VALUES (?, NOW(), 1)
    `, [req.body.name]);

    res.redirect('/templates');
});

/* =====================================================
   TEMPLATE DETAIL PAGE (WITH STEPS)
===================================================== */

router.get('/:id', async (req, res) => {
    const templateId = req.params.id;

    const [template] = await db.query(`
        SELECT * FROM task_templates WHERE id=?
    `, [templateId]);

    const [steps] = await db.query(`
        SELECT * FROM template_steps
        WHERE template_id=?
        ORDER BY step_order ASC
    `, [templateId]);

    res.render('template_detail', {
        template: template[0],
        steps
    });
});

/* ---------------- ADD STEP ---------------- */
router.post('/:id/steps/create', async (req, res) => {
    const templateId = req.params.id;

    const [max] = await db.query(`
        SELECT COALESCE(MAX(step_order),0)+1 AS next_order
        FROM template_steps
        WHERE template_id=?
    `, [templateId]);

    await db.query(`
        INSERT INTO template_steps
        (template_id, title, step_order, modified_at, modified_by)
        VALUES (?, ?, ?, NOW(), 1)
    `, [templateId, req.body.title, max[0].next_order]);

    res.redirect(`/templates/${templateId}`);
});

/* ---------------- UPDATE STEP ---------------- */
router.post('/steps/update', async (req, res) => {
    await db.query(`
        UPDATE template_steps
        SET title=?, modified_at=NOW(), modified_by=1
        WHERE id=?
    `, [req.body.title, req.body.step_id]);

    res.sendStatus(200);
});

/* ---------------- DELETE STEP ---------------- */
router.post('/steps/delete', async (req, res) => {
    await db.query(`
        DELETE FROM template_steps WHERE id=?
    `, [req.body.step_id]);

    res.sendStatus(200);
});

/* ---------------- REORDER STEPS ---------------- */
router.post('/:id/steps/reorder', async (req, res) => {
    const { orderedIds } = req.body;

    // orderedIds = [3,1,5,2]

    for (let i = 0; i < orderedIds.length; i++) {
        await db.query(`
            UPDATE template_steps
            SET step_order=?, modified_at=NOW(), modified_by=1
            WHERE id=?
        `, [i + 1, orderedIds[i]]);
    }

    res.sendStatus(200);
});

module.exports = router;