import { useState } from "react";
import {
  useListCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useListRequests,
  getListCollectionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, FolderOpen, ChevronRight } from "lucide-react";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#ef4444"];

function CollectionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; description?: string | null; color?: string | null };
  onSave: (data: { name: string; description?: string; color?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <input
        className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Collection name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="input-collection-name"
        autoFocus
      />
      <input
        className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        data-testid="input-collection-description"
      />
      <div className="flex gap-2 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            className="h-6 w-6 rounded-full border-2 transition-all"
            style={{ background: c, borderColor: color === c ? "white" : "transparent" }}
            onClick={() => setColor(c)}
            data-testid={`color-${c}`}
          />
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          className="text-sm px-3 py-1.5 rounded border border-border hover:bg-secondary transition-colors"
          onClick={onCancel}
          data-testid="button-cancel-collection"
        >
          Cancel
        </button>
        <button
          className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), description: desc || undefined, color })}
          data-testid="button-save-collection"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function CollectionRequests({ collectionId }: { collectionId: number }) {
  const { data: requests } = useListRequests({ collectionId });
  if (!requests?.length) return <p className="text-xs text-muted-foreground pl-4 py-2">No requests in this collection</p>;
  return (
    <div className="pl-4 border-l border-border ml-3 mt-2 space-y-1">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-2 py-1" data-testid={`request-item-${r.id}`}>
          <span className="text-xs font-bold font-mono px-1.5 rounded" style={{ background: r.method === "GET" ? "#3b82f622" : r.method === "POST" ? "#22c55e22" : r.method === "DELETE" ? "#ef444422" : "#f9731622", color: r.method === "GET" ? "#3b82f6" : r.method === "POST" ? "#22c55e" : r.method === "DELETE" ? "#ef4444" : "#f97316" }}>
            {r.method}
          </span>
          <span className="text-xs text-foreground truncate">{r.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Collections() {
  const { data: collections, isLoading } = useListCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
  }

  function handleCreate(data: { name: string; description?: string; color?: string }) {
    createCollection.mutate({ data }, {
      onSuccess: () => { setCreating(false); invalidate(); toast({ title: "Collection created" }); },
      onError: () => toast({ title: "Failed to create", variant: "destructive" }),
    });
  }

  function handleUpdate(id: number, data: { name: string; description?: string; color?: string }) {
    updateCollection.mutate({ id, data }, {
      onSuccess: () => { setEditing(null); invalidate(); toast({ title: "Updated" }); },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this collection? Requests will not be deleted.")) return;
    deleteCollection.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize your API requests into groups</p>
          </div>
          {!creating && (
            <button
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              onClick={() => setCreating(true)}
              data-testid="button-new-collection"
            >
              <Plus className="h-4 w-4" /> New Collection
            </button>
          )}
        </div>

        {creating && (
          <CollectionForm onSave={handleCreate} onCancel={() => setCreating(false)} />
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : !collections?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No collections yet — create one to organize your requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map((col) => (
              <div key={col.id} data-testid={`collection-${col.id}`}>
                {editing === col.id ? (
                  <CollectionForm
                    initial={{ name: col.name, description: col.description, color: col.color }}
                    onSave={(data) => handleUpdate(col.id, data)}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div className="bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button onClick={() => toggleExpand(col.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.has(col.id) ? "rotate-90" : ""}`} />
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: col.color ?? "#6b7280" }} />
                        <span className="font-medium font-mono text-sm truncate">{col.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{col.requestCount} requests</span>
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => setEditing(col.id)}
                        data-testid={`button-edit-collection-${col.id}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(col.id)}
                        data-testid={`button-delete-collection-${col.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {expanded.has(col.id) && (
                      <div className="border-t border-border px-4 py-2">
                        {col.description && <p className="text-xs text-muted-foreground mb-2">{col.description}</p>}
                        <CollectionRequests collectionId={col.id} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
