import React, { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import GroupTile from "./GroupTile.jsx";
import CreateGroupModal from "./CreateGroupModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

export default function GroupsTab({
  groups,
  activeGroupId,
  servers,
  duplicates,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onActivateGroup,
  getStaleNames,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null); // group object or null
  const [deletingGroup, setDeletingGroup] = useState(null);

  const handleSave = (name, serverNames) => {
    if (editingGroup) {
      onEditGroup(editingGroup.id, name, serverNames);
    } else {
      onCreateGroup(name, serverNames);
    }
    setShowCreateModal(false);
    setEditingGroup(null);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingGroup(null);
  };

  return (
    <div>
      {/* Duplicate warning */}
      {duplicates.length > 0 && (
        <div className="flex items-start gap-2 mb-4 px-3 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="text-amber-300 font-medium">Duplicate server names detected:</span>{" "}
            {duplicates.join(", ")}. These appear in both enabled and disabled sections of your config.
            Group activation may produce unexpected results.
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {groups.map((g) => (
          <GroupTile
            key={g.id}
            group={g}
            isActive={g.id === activeGroupId}
            staleNames={getStaleNames(g, servers)}
            onActivate={() => onActivateGroup(g.id)}
            onEdit={() => handleEdit(g)}
            onDelete={() => setDeletingGroup(g)}
          />
        ))}

        {/* Create tile */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/40 bg-slate-800/30 hover:bg-emerald-500/5 flex flex-col items-center justify-center py-8 transition-colors group"
        >
          <Plus className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition-colors mb-2" />
          <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors font-medium">
            New Group
          </span>
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-center text-slate-500 text-sm mt-6">
          Create a group to quickly switch between sets of MCP servers.
        </p>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateGroupModal
          servers={servers}
          groups={groups}
          editGroup={editingGroup}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}

      {/* Delete Confirm */}
      {deletingGroup && (
        <ConfirmModal
          title="Delete Group"
          message={
            <>
              Are you sure you want to delete the group{" "}
              <strong className="text-slate-100">"{deletingGroup.name}"</strong>?
              This will not affect your MCP servers.
            </>
          }
          confirmLabel="Delete"
          dangerous
          onConfirm={() => {
            onDeleteGroup(deletingGroup.id);
            setDeletingGroup(null);
          }}
          onCancel={() => setDeletingGroup(null)}
        />
      )}
    </div>
  );
}
