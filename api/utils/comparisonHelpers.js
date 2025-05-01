// Normalizes a value for comparison
function normalize(val) {
    if (val === undefined || val === "" || val === null) return null;
    if (!isNaN(val)) return parseInt(val);
    return String(val).trim() 
}

// Function checks for string and does a lower case comparison for exact match
function stringComparison(val) {
    const normalized = normalize(val);
    if (typeof normalized === "string") return normalized.toLowerCase(); // Used only for exact comparison
    return normalized;
}

// Returns changed fields and their values
function getUpdatedFields(reqBody, existingRow, fieldsToCheck) {
    const updateFields = [];
    const updateValues = [];

    fieldsToCheck.forEach((key) => {
        if (key in reqBody) {
            const newVal = reqBody[key];
            const existingVal = existingRow[key];

            const normalizedNew = stringComparison(newVal);
            const normalizedExisting = stringComparison(existingVal);

            if (normalizedNew !== normalizedExisting) {
                updateFields.push(`${key} = ?`);
                updateValues.push(normalize(newVal)); // when pushing, insert original value as normalized (e.g. prevents entries converting to lower case)
            }
        }
    });

    return { updateFields, updateValues };
}

module.exports = {
    normalize,
    stringComparison,
    getUpdatedFields
};