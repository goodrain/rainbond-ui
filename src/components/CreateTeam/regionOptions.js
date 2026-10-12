function normalizeRegionOptions(regions) {
  if (!Array.isArray(regions)) {
    return [];
  }
  const seen = new Set();
  return regions.reduce((options, item) => {
    if (!item || typeof item.region_name !== 'string') {
      return options;
    }
    const regionName = item.region_name.trim();
    if (!regionName || seen.has(regionName)) {
      return options;
    }
    seen.add(regionName);
    options.push({
      ...item,
      region_name: regionName,
      region_alias:
        typeof item.region_alias === 'string' && item.region_alias.trim()
          ? item.region_alias
          : regionName
    });
    return options;
  }, []);
}

module.exports = { normalizeRegionOptions };
