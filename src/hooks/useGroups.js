import { useState, useCallback } from "react";

export default function useGroups() {
  const [groups, setGroups] = useState([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const persist = useCallback(async (newGroups) => {
    await window.electronAPI.saveGroups({ version: 1, groups: newGroups });
  }, []);

  const loadGroups = useCallback(async () => {
    const data = await window.electronAPI.loadGroups();
    if (data.error) return;
    setGroups(data.groups || []);
    setGroupsLoaded(true);
  }, []);

  const createGroup = useCallback(async (name, serverNames) => {
    const id = `grp_${Date.now()}`;
    const newGroup = { id, name, serverNames, createdAt: new Date().toISOString() };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    await persist(newGroups);
    return newGroup;
  }, [groups, persist]);

  const editGroup = useCallback(async (id, name, serverNames) => {
    const newGroups = groups.map((g) =>
      g.id === id ? { ...g, name, serverNames } : g
    );
    setGroups(newGroups);
    await persist(newGroups);
  }, [groups, persist]);

  const deleteGroup = useCallback(async (id) => {
    const newGroups = groups.filter((g) => g.id !== id);
    setGroups(newGroups);
    await persist(newGroups);
  }, [groups, persist]);

  const activateGroup = useCallback(async (id, allServers, filePath) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return { error: "Group not found" };

    const allNames = allServers.map((s) => s.name);
    const toEnable = group.serverNames.filter((n) => allNames.includes(n));

    const result = await window.electronAPI.activateGroup(filePath, toEnable);
    if (result.error) return result;

    return { success: true };
  }, [groups]);

  const renameServerInGroups = useCallback(async (oldName, newName) => {
    const newGroups = groups.map((g) => ({
      ...g,
      serverNames: g.serverNames.map((n) => (n === oldName ? newName : n)),
    }));
    setGroups(newGroups);
    await persist(newGroups);
  }, [groups, persist]);

  const removeServerFromAllGroups = useCallback(async (serverName) => {
    const newGroups = groups.map((g) => ({
      ...g,
      serverNames: g.serverNames.filter((n) => n !== serverName),
    }));
    setGroups(newGroups);
    await persist(newGroups);
  }, [groups, persist]);

  const getStaleNames = useCallback((group, allServers) => {
    const allNames = new Set(allServers.map((s) => s.name));
    return group.serverNames.filter((n) => !allNames.has(n));
  }, []);

  const getGroupsForServer = useCallback((serverName) => {
    return groups.filter((g) => g.serverNames.includes(serverName));
  }, [groups]);

  return {
    groups,
    groupsLoaded,
    loadGroups,
    createGroup,
    editGroup,
    deleteGroup,
    activateGroup,
    renameServerInGroups,
    removeServerFromAllGroups,
    getStaleNames,
    getGroupsForServer,
  };
}
