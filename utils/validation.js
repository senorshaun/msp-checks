function requireFields(body, fields) {
    const errors = [];

    fields.forEach(field => {
        const value = body[field];

        if (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')
        ) {
            errors.push(`${field} is required`);
        }
    });

    return errors;
}

function buildCustomerResponse(rows) {
	const serviceLevels = [];
	let currentLevelId = null;
	let currentLevel = null;

	for (const row of rows) {
		const levelId = row.service_level != null ? Number(row.service_level) : 0;
		// new service level group
		if (levelId !== currentLevelId) {
			currentLevelId = levelId;

			currentLevel = {
				id: levelId,
				name: row.service_level_name ?? 'Unassigned',
				priority: row.service_level_priority ?? 999,
				customers: []
			};

			serviceLevels.push(currentLevel);
		}

		// push customer (order preserved automatically)
		currentLevel.customers.push({
			id: row.id,
			name: row.name,
			is_active: row.is_active,
			modified_at: row.modified_at
		});
	}

	return serviceLevels;
}

module.exports = {
    requireFields,
	buildCustomerResponse
};