export function findMatchingGroup(servers, groups) {
  const enabledNames = new Set(servers.filter(s => s.enabled).map(s => s.name));
  for (const group of groups) {
    const groupNames = new Set(group.serverNames);
    if (
      enabledNames.size === groupNames.size &&
      [...groupNames].every(name => enabledNames.has(name))
    ) {
      return group.id;
    }
  }
  return null;
}
