const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    const [assignments] = await db.query(`CALL get_all_assignments()`);

	res.render('assignments', {
		assignments: assignments[0]
	});
});

module.exports = router;