import { useState, useRef } from "react";
import {
  useListFileAnalyses,
  useGetFileAnalysis,
  useDeleteFileAnalysis,
  getListFileAnalysesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, AlertTriangle, CheckCircle, ChevronRight, FileText, X } from "lucide-react";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function EntropyBar({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const pct = (value / 8) * 100;
  const color = value > 7.2 ? "#ef4444" : value > 6 ? "#f97316" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value.toFixed(3)}</span>
    </div>
  );
}

function FileDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: file, isLoading } = useGetFileAnalysis(id);
  const [tab, setTab] = useState<"overview" | "strings" | "hex">("overview");

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading analysis...</div>;
  if (!file) return null;

  const strings = file.strings ? file.strings.split("\n").filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {file.isSuspicious ? (
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="font-mono text-sm font-medium truncate max-w-[200px]">{file.filename}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-secondary rounded transition-colors" data-testid="button-close-detail">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {(["overview", "strings", "hex"] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="space-y-4">
            {file.isSuspicious && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-1">
                  <AlertTriangle className="h-4 w-4" /> Suspicious
                </div>
                <p className="text-xs text-orange-300">{file.suspiciousReasons}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Filename", file.filename],
                ["Size", formatBytes(file.filesize)],
                ["MIME Type", file.mimetype],
                ["MD5", file.md5],
                ["SHA-256", file.sha256],
                ["Analyzed", new Date(file.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="bg-background rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="text-xs font-mono break-all">{value}</div>
                </div>
              ))}
            </div>
            <div className="bg-background rounded p-3">
              <div className="text-xs text-muted-foreground mb-2">Entropy</div>
              <EntropyBar value={file.entropy} />
              <p className="text-xs text-muted-foreground mt-1">
                {file.entropy != null && file.entropy > 7.2 ? "High entropy — possibly packed or encrypted" : file.entropy != null && file.entropy > 6 ? "Moderate entropy" : "Normal entropy"}
              </p>
            </div>
          </div>
        )}

        {tab === "strings" && (
          <div className="space-y-1">
            {strings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No printable strings found (min length: 4)</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{strings.length} strings extracted (first 500)</p>
                <div className="bg-background rounded p-3 font-mono text-xs space-y-0.5 max-h-96 overflow-y-auto">
                  {strings.map((s, i) => (
                    <div key={i} className="text-green-400 break-all py-0.5 border-b border-border/30" data-testid={`string-${i}`}>
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "hex" && (
          <div className="bg-background rounded p-3 font-mono text-xs overflow-x-auto">
            <pre className="text-green-400 whitespace-pre leading-relaxed">{file.hexDump ?? "No hex dump available"}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Files() {
  const { data: files, isLoading } = useListFileAnalyses();
  const deleteFile = useDeleteFileAnalysis();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListFileAnalysesQueryKey() });
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/files/analyze", { method: "POST", body: form });
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json() as { id: number };
      invalidate();
      setSelectedId(data.id);
      toast({ title: `Analyzed: ${file.name}` });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleDelete(id: number) {
    if (!confirm("Remove this analysis?")) return;
    deleteFile.mutate({ id }, {
      onSuccess: () => { invalidate(); if (selectedId === id) setSelectedId(null); toast({ title: "Removed" }); },
    });
  }

  return (
    <div className="flex-1 flex min-h-0">
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-sm font-bold font-mono tracking-tight">File Analyzer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Static analysis: hashes, strings, entropy</p>
        </div>

        <div
          className={`m-3 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          data-testid="drop-zone"
        >
          <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{uploading ? "Analyzing..." : "Drop file or click"}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Max 50 MB</p>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} data-testid="input-file" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-xs text-muted-foreground">Loading...</div>
          ) : !files?.length ? (
            <div className="p-4 text-xs text-muted-foreground text-center">Upload a file to analyze it</div>
          ) : (
            files.map((f) => (
              <div
                key={f.id}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors hover:bg-secondary group ${selectedId === f.id ? "bg-secondary border-r-2 border-primary" : ""}`}
                onClick={() => setSelectedId(f.id)}
                data-testid={`file-item-${f.id}`}
              >
                {f.isSuspicious ? <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono truncate">{f.filename}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(f.filesize)}</div>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                  data-testid={`button-delete-file-${f.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <FileDetail id={selectedId} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <ChevronRight className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">Select or upload a file to see its analysis</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Supports any file type — executables, scripts, archives, docs</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
