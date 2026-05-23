import { useGetDashboardStats, useListRecentRequests } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, Database, FolderOpen, Zap } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "#3b82f6",
  POST: "#22c55e",
  PUT: "#f97316",
  PATCH: "#eab308",
  DELETE: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  "2xx": "#22c55e",
  "3xx": "#3b82f6",
  "4xx": "#f97316",
  "5xx": "#ef4444",
  "Error": "#6b7280",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | undefined; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`p-3 rounded-md`} style={{ background: `${color}22` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono">{value ?? "—"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ code }: { code: number | null | undefined }) {
  if (!code) return <span className="font-mono text-xs text-muted-foreground">—</span>;
  const color = code >= 500 ? "text-red-400" : code >= 400 ? "text-orange-400" : code >= 300 ? "text-blue-400" : "text-green-400";
  return <span className={`font-mono text-xs font-bold ${color}`}>{code}</span>;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recent, isLoading: recentLoading } = useListRecentRequests();

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your API workspace</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Collections" value={stats?.totalCollections} icon={FolderOpen} color="#22c55e" />
        <StatCard label="Saved Requests" value={stats?.totalRequests} icon={Database} color="#3b82f6" />
        <StatCard label="File Analyses" value={stats?.totalFileAnalyses} icon={Zap} color="#f97316" />
        <StatCard label="Requests (7d)" value={stats?.recentRequestCount} icon={Activity} color="#a855f7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold font-mono mb-4 text-muted-foreground uppercase tracking-wider">Methods</h2>
          {statsLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : !stats?.methodBreakdown?.length ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data yet — send some requests</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.methodBreakdown} barSize={28}>
                <XAxis dataKey="method" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  cursor={{ fill: "hsl(var(--border))" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.methodBreakdown.map((entry, i) => (
                    <Cell key={i} fill={METHOD_COLORS[entry.method] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold font-mono mb-4 text-muted-foreground uppercase tracking-wider">Status Codes</h2>
          {statsLoading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : !stats?.statusBreakdown?.length ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No responses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.statusBreakdown} barSize={28}>
                <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: "hsl(var(--border))" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.range] ?? "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold font-mono text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
        </div>
        {recentLoading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
        ) : !recent?.length ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No recent requests — head to the Explorer to send one</div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors" data-testid={`recent-request-${r.id}`}>
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                  style={{ background: `${METHOD_COLORS[r.method] ?? "#6b7280"}22`, color: METHOD_COLORS[r.method] ?? "#6b7280" }}
                >
                  {r.method}
                </span>
                <span className="text-sm font-mono flex-1 truncate text-foreground">{r.url}</span>
                <span className="text-sm text-muted-foreground truncate max-w-[150px] hidden md:block">{r.name}</span>
                <StatusBadge code={r.lastStatusCode} />
                {r.lastResponseTime != null && (
                  <span className="text-xs text-muted-foreground font-mono">{r.lastResponseTime}ms</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
