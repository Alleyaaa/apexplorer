import { useState } from "react";
import {
  useListCollections,
  useListRequests,
  useCreateRequest,
  useUpdateRequest,
  useDeleteRequest,
  useSendRequest,
  useSendAdhoc,
  useParseCurl,
  useGetRequestHistory,
  getListRequestsQueryKey,
  getGetRequestHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Send, Save, Trash2, Clock, ChevronDown, X, Terminal, FolderOpen,
} from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "#3b82f6", POST: "#22c55e", PUT: "#f97316", PATCH: "#eab308", DELETE: "#ef4444",
};
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function statusColor(code: number) {
  if (code >= 500) return "text-red-400";
  if (code >= 400) return "text-orange-400";
  if (code >= 300) return "text-blue-400";
  if (code > 0) return "text-green-400";
  return "text-muted-foreground";
}

function tryPrettyJson(str: string) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

function KeyValueEditor({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  let parsed: Record<string, string> = {};
  try { parsed = JSON.parse(value || "{}") as Record<string, string>; } catch {}
  const entries = Object.entries(parsed);

  function update(k: string, v: string, idx: number) {
    const next = [...entries];
    next[idx] = [k, v];
    onChange(JSON.stringify(Object.fromEntries(next.filter(([key]) => key))));
  }
  function addRow() {
    const next = { ...parsed, "": "" };
    onChange(JSON.stringify(next));
  }
  function removeRow(idx: number) {
    const next = entries.filter((_, i) => i !== idx);
    onChange(JSON.stringify(Object.fromEntries(next)));
  }

  return (
    <div className="space-y-1">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-1">
          <input
            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Key"
            value={k}
            onChange={(e) => update(e.target.value, v, i)}
          />
          <input
            className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Value"
            value={v}
            onChange={(e) => update(k, e.target.value, i)}
          />
          <button onClick={() => removeRow(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Plus className="h-3 w-3" /> Add {placeholder}
      </button>
    </div>
  );
}

function CurlModal({ onImport, onClose }: { onImport: (data: { method: string; url: string; headers: string; body: string; queryParams: string }) => void; onClose: () => void }) {
  const [curl, setCurl] = useState("");
  const parseCurl = useParseCurl();

  function handleImport() {
    parseCurl.mutate({ data: { curl } }, {
      onSuccess: (parsed) => { onImport(parsed); onClose(); },
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold">Import cURL</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none"
            placeholder={`curl -X POST 'https://api.example.com/data' \\\n  -H 'Authorization: Bearer token' \\\n  -d '{"key": "value"}'`}
            value={curl}
            onChange={(e) => setCurl(e.target.value)}
            data-testid="input-curl"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded border border-border hover:bg-secondary transition-colors" data-testid="button-cancel-curl">Cancel</button>
            <button
              onClick={handleImport}
              disabled={!curl.trim() || parseCurl.isPending}
              className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-import-curl"
            >
              {parseCurl.isPending ? "Parsing..." : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveModal({ method, url, headers, body, queryParams, onSave, onClose }: {
  method: string; url: string; headers: string; body: string; queryParams: string;
  onSave: (name: string, collectionId: number | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(url.split("/").pop()?.split("?")[0] ?? "New Request");
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const { data: collections } = useListCollections();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-mono text-sm font-semibold">Save Request</span>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <input
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Request name"
            data-testid="input-save-name"
            autoFocus
          />
          <select
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            value={collectionId ?? ""}
            onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : null)}
            data-testid="select-collection"
          >
            <option value="">No collection</option>
            {collections?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded border border-border hover:bg-secondary">Cancel</button>
            <button
              onClick={() => onSave(name.trim() || "New Request", collectionId)}
              className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              disabled={!name.trim()}
              data-testid="button-confirm-save"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Explorer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: collections } = useListCollections();
  const { data: allRequests } = useListRequests();
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();
  const deleteRequest = useDeleteRequest();
  const sendRequest = useSendRequest();
  const sendAdhoc = useSendAdhoc();

  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState("{}");
  const [body, setBody] = useState("");
  const [queryParams, setQueryParams] = useState("{}");
  const [reqTab, setReqTab] = useState<"headers" | "body" | "params">("headers");
  const [respTab, setRespTab] = useState<"body" | "headers" | "history">("body");

  const [response, setResponse] = useState<{ statusCode: number; statusText: string; responseHeaders: string; responseBody: string; responseTime: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [showCurl, setShowCurl] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [expandedCols, setExpandedCols] = useState<Set<number>>(new Set());
  const [filterCol, setFilterCol] = useState<number | "all">("all");

  const { data: history } = useGetRequestHistory(selectedReqId ?? 0, {
    query: {
      enabled: !!selectedReqId && respTab === "history",
      queryKey: getGetRequestHistoryQueryKey(selectedReqId ?? 0),
    },
  });

  const displayedRequests = allRequests
    ? filterCol === "all"
      ? allRequests
      : allRequests.filter((r) => r.collectionId === filterCol)
    : [];

  function loadRequest(r: { id: number; method: string; url: string; headers: string | null; body: string | null; queryParams: string | null }) {
    setSelectedReqId(r.id);
    setMethod(r.method);
    setUrl(r.url);
    setHeaders(r.headers ?? "{}");
    setBody(r.body ?? "");
    setQueryParams(r.queryParams ?? "{}");
    setResponse(null);
  }

  async function handleSend() {
    setSending(true);
    try {
      if (selectedReqId) {
        const res = await new Promise<typeof response>((resolve, reject) => {
          sendRequest.mutate({ id: selectedReqId }, {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
              resolve(data);
            },
            onError: reject,
          });
        });
        setResponse(res);
      } else {
        const res = await new Promise<typeof response>((resolve, reject) => {
          sendAdhoc.mutate({ data: { method, url, headers, body, queryParams } }, {
            onSuccess: resolve,
            onError: reject,
          });
        });
        setResponse(res);
      }
    } catch {
      toast({ title: "Request failed", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  function handleSaveNew(name: string, collectionId: number | null) {
    createRequest.mutate(
      { data: { name, method, url, headers, body, queryParams, collectionId } },
      {
        onSuccess: (saved) => {
          setSelectedReqId(saved.id);
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
          setShowSave(false);
          toast({ title: `Saved: ${name}` });
        },
      }
    );
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this request?")) return;
    deleteRequest.mutate({ id }, {
      onSuccess: () => {
        if (selectedReqId === id) { setSelectedReqId(null); setResponse(null); }
        queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        toast({ title: "Deleted" });
      },
    });
  }

  function toggleCol(id: number) {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const respHeaders = (() => {
    try { return Object.entries(JSON.parse(response?.responseHeaders ?? "{}") as Record<string, string>); }
    catch { return []; }
  })();

  return (
    <div className="flex-1 flex min-h-0">
      {showCurl && (
        <CurlModal
          onImport={(parsed) => { setMethod(parsed.method); setUrl(parsed.url); setHeaders(parsed.headers || "{}"); setBody(parsed.body || ""); setQueryParams(parsed.queryParams || "{}"); setSelectedReqId(null); setResponse(null); }}
          onClose={() => setShowCurl(false)}
        />
      )}
      {showSave && (
        <SaveModal method={method} url={url} headers={headers} body={body} queryParams={queryParams} onSave={handleSaveNew} onClose={() => setShowSave(false)} />
      )}

      {/* Left Sidebar: Saved Requests */}
      <div className="w-60 border-r border-border flex flex-col bg-sidebar">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider">Requests</span>
          <button
            className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => { setSelectedReqId(null); setMethod("GET"); setUrl(""); setHeaders("{}"); setBody(""); setQueryParams("{}"); setResponse(null); }}
            title="New request"
            data-testid="button-new-request"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-2 border-b border-border">
          <select
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none"
            value={filterCol === "all" ? "" : filterCol}
            onChange={(e) => setFilterCol(e.target.value ? Number(e.target.value) : "all")}
            data-testid="select-filter-collection"
          >
            <option value="">All collections</option>
            {collections?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayedRequests.length === 0 ? (
            <div className="p-4 text-center">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-xs text-muted-foreground">No saved requests</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Build a request and save it</p>
            </div>
          ) : (
            displayedRequests.map((r) => (
              <div
                key={r.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors ${selectedReqId === r.id ? "bg-secondary border-r-2 border-primary" : ""}`}
                onClick={() => loadRequest(r)}
                data-testid={`request-sidebar-${r.id}`}
              >
                <span className="text-xs font-bold font-mono shrink-0" style={{ color: METHOD_COLORS[r.method] ?? "#6b7280" }}>
                  {r.method.slice(0, 3)}
                </span>
                <span className="text-xs truncate flex-1">{r.name}</span>
                {r.lastStatusCode != null && (
                  <span className={`text-xs font-mono shrink-0 ${statusColor(r.lastStatusCode)}`}>{r.lastStatusCode}</span>
                )}
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  data-testid={`button-delete-request-${r.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-border">
          <button
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            onClick={() => setShowCurl(true)}
            data-testid="button-import-curl"
          >
            <Terminal className="h-3.5 w-3.5" /> Import cURL
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* URL Bar */}
        <div className="border-b border-border p-3 flex gap-2 items-center">
          <div className="relative">
            <select
              className="appearance-none bg-background border border-border rounded px-3 pr-6 py-2 text-sm font-bold font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{ color: METHOD_COLORS[method] ?? "#6b7280" }}
              data-testid="select-method"
            >
              {METHODS.map((m) => <option key={m} value={m} style={{ color: METHOD_COLORS[m] ?? "#6b7280" }}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-2.5 h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
          </div>
          <input
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            data-testid="input-url"
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            onClick={handleSend}
            disabled={sending || !url}
            data-testid="button-send"
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending..." : "Send"}
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded border border-border text-sm hover:bg-secondary transition-colors"
            onClick={() => setShowSave(true)}
            disabled={!url}
            data-testid="button-save"
            title="Save request"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Request Tabs */}
        <div className="flex border-b border-border">
          {(["headers", "params", "body"] as const).map((t) => (
            <button
              key={t}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${reqTab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setReqTab(t)}
              data-testid={`req-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-3 border-b border-border overflow-auto" style={{ maxHeight: "180px" }}>
            {reqTab === "headers" && (
              <KeyValueEditor value={headers} onChange={setHeaders} placeholder="header" />
            )}
            {reqTab === "params" && (
              <KeyValueEditor value={queryParams} onChange={setQueryParams} placeholder="param" />
            )}
            {reqTab === "body" && (
              <textarea
                className="w-full bg-background border border-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none h-32"
                placeholder='{"key": "value"}'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                data-testid="textarea-body"
              />
            )}
          </div>

          {/* Response Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center border-b border-border px-2">
              {(["body", "headers", "history"] as const).map((t) => (
                <button
                  key={t}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${respTab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setRespTab(t)}
                  data-testid={`resp-tab-${t}`}
                >
                  {t}
                </button>
              ))}
              {response && (
                <div className="ml-auto flex items-center gap-3 pr-3">
                  <span className={`text-sm font-bold font-mono ${statusColor(response.statusCode)}`} data-testid="response-status">
                    {response.statusCode} {response.statusText}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" />{response.responseTime}ms
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-3">
              {!response && respTab !== "history" ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  <div className="text-center">
                    <Send className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>Hit Send to see the response</p>
                  </div>
                </div>
              ) : respTab === "body" && response ? (
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed" data-testid="response-body">
                  {tryPrettyJson(response.responseBody)}
                </pre>
              ) : respTab === "headers" && response ? (
                <div className="space-y-1">
                  {respHeaders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No headers</p>
                  ) : (
                    respHeaders.map(([k, v]) => (
                      <div key={k} className="flex gap-3 text-xs font-mono" data-testid={`header-${k}`}>
                        <span className="text-blue-400 shrink-0">{k}</span>
                        <span className="text-muted-foreground">{v}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : respTab === "history" ? (
                selectedReqId ? (
                  <div className="space-y-2">
                    {!history?.length ? (
                      <p className="text-xs text-muted-foreground">No history yet — send the request first</p>
                    ) : (
                      history.map((h) => (
                        <div key={h.id} className="bg-background border border-border rounded p-3 text-xs font-mono space-y-1" data-testid={`history-${h.id}`}>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${statusColor(h.statusCode)}`}>{h.statusCode} {h.statusText}</span>
                            <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{h.responseTime}ms</span>
                            <span className="text-muted-foreground ml-auto">{new Date(h.executedAt).toLocaleTimeString()}</span>
                          </div>
                          <pre className="text-green-400 text-xs whitespace-pre-wrap break-all max-h-24 overflow-hidden">
                            {tryPrettyJson(h.responseBody).slice(0, 300)}{h.responseBody.length > 300 ? "…" : ""}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Select a saved request to see its history</p>
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
