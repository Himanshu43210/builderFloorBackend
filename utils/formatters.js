const generatePropertyUrl = (property, baseUrl = 'https://builderfloor.com') => {
    return baseUrl + `/${property.title?.replaceAll(" ", "-")}-${property.sectorNumber?.replaceAll(" ", "_")}-${property.size}SQYD-${property.floor?.replaceAll(" ", "_")}-${property.accommodation?.replaceAll(" ", "_")}-${property.facing}_FACING-${property.parkFacing === "YES" ? "park-" : ""}${property.corner === "YES" ? "corner-" : ""}${property.possession === "READY" ? "READY_POSSESSION" : "UNDER_CONSTRUCTION"}-${property._id}`;
};

module.exports = { generatePropertyUrl };