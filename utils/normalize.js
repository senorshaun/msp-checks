function normalizeTicket(ticket) {
  const completeStatuses = ['replied', 'resolved', 'closed'];

  const isComplete = completeStatuses.includes(
    (ticket.status || '').toLowerCase()
  );

  return {
    type: 'ticket',
    id: ticket.id,
    title: ticket.title,
    display: `Atera #${ticket.id} - ${ticket.title}`,
    status: ticket.status,

    isComplete: isComplete,

    customer_id: ticket.customer_id,
    customer_name: ticket.customer_name,
    service_level_priority: ticket.customer_service_level_priority,
  };
}

function normalizeTask(ticket) {
  const completeStatuses = ['Completed', 'Skipped'];

  const isComplete = completeStatuses.includes(
    (task.status_name || '')
  );

  return {
    type: 'task',
    id: task.id,
    title: task.name,
    display: `${task.name}`,
    status: task.status_name,

    isComplete: isComplete,
    due_date: task.due_date,

    customer_id: task.customer_id,
    customer_name: task.customer_name,
    service_level_priority: task.service_level_priority,
  };
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
	normalizeTicket,
	normalizeTask,
	buildCustomerResponse
};



