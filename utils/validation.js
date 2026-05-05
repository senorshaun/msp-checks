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
module.exports = {
    requireFields
};