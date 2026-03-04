import { useState, useCallback } from "react";

const EMPTY_DATA = { version: 1, activeGroupId: null, groups: [] };

export default function useGroups() {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const persist = useCallback(async (newGroups, newActiveId) => {
    await window.electronAPI.saveGroups({
      version: 1,
      activeGroupId: newActiveId,
      groups: newGroups,
    });
  }, []);

  const loadGroups = useCallback(async () => {
    const data = await window.electronAPI.loadGroups();
    if (data.error) return;
    const g = data.groups || [];
    setGroups(g);
    setActiveGroupId(data.activeGroupId || null);
    setGroupsLoaded(true);
  }, []);

  const createGroup = useCallback(async (name, serverNames) => {
    const id = `grp_${Date.now()}`;
    const newGroup = {
      id,
      name,
      serverNames,
      createdAt: new Date().toISOString(),
    };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    await persist(newGroups, activeGroupId);
    return newGroup;
  }, [groups, activeGroupId, persist]);

  const editGroup = useCallback(async (id, name, serverNames) => {
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, name, serverNames } : g
    );
    setGroups(newGroups);
    await persist(newGroups, activeGroupId);
  }, [groups, activeGroupId, persist]);

  const deleteGroup = useCallback(async (id) => {
    const newGroups = groups.filter((g) => g.id !== id);
    const newActiveId = activeGroupId === id ? null : activeGroupId;
    setGroups(newGroups);
    setActiveGroupId(newActiveId);
    await persist(newGroups, newActiveId);
  }, [groups, activeGroupId, persist]);

  const activateGroup = useCallback(async (id, allServers, filePath) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return { error: "Group not found" };

    // Only activate servers that actually exist
    const allNames = allServers.map((s) => s.name);
    const toEnable = group.serverNames.filter((n) => allNames.includes(n));

    const result = await window.electronAPI.activateGroup(filePath, toEnable);
    if (result.error) return result;

    setActiveGroupId(id);
    await persist(groups, id);
    return { success: true };
  }, [groups, persist]);

  const removeServerFromAllGroups = useCallback(async (serverName) => {
    const newGroups = groups.map((g) => ({
      ...g,
      serverNames: g.serverNames.filter((n) => n !== serverName),
    }));
    setGroups(newGroups);
    await persist(newGroups, activeGroupId);
  }, [groups, activeGroupId, persist]);

  const getStaleNames = useCallback((group, allServers) => {
    const allNames = new Set(allServers.map((s) => s.name));
    return group.serverNames.filter((n) => !allNames.has(n));
  }, []);

  const getGroupsForServer = useCallback((serverName) => {
    return groups.filter((g) => g.serverNames.includes(serverName));
  }, [groups]);

  return {
    groups,
    activeGroupId,
    groupsLoaded,
    loadGroups,
    createGroup,
    editGroup,
    deleteGroup,
    activateGroup,
    removeServerFromAllGroups,
    getStaleNames,
    getGroupsForServer,
  };
}
