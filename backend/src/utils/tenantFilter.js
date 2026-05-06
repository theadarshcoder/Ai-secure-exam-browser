/**
 * Returns MongoDB filter object for tenant isolation.
 * super_admin: no filter (sees all data)
 * others: filter by their institutionId
 */
const getTenantFilter = (req, extraFilters = {}) => {
    if (req.user.role === 'super_admin') {
        return { ...extraFilters };
    }
    return { institutionId: req.user.institutionId, ...extraFilters };
};

/**
 * Returns institutionId to inject during record creation.
 * super_admin creating on behalf of college: use body.institutionId
 * Others: always use their own institutionId
 */
const getTenantId = (req) => {
    if (req.user.role === 'super_admin') {
        return req.body.institutionId || null;
    }
    return req.user.institutionId;
};

module.exports = { getTenantFilter, getTenantId };
