import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { dashboardApi } from "../services/api";
import { Card, CardHeader, StatCard, ScoreRing, Badge, Spinner, SeverityBadge } from "../components/ui";
import styles from "./Dashboard.module.css";

const fmt = (d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 4, fontSize: 12 }}>
      <div style={{ color: "var(--text-dim)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong></div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loader}><Spinner size={32} /></div>;
  if (!data) return <div className={styles.loader}><span style={{ color: "var(--red)" }}>Failed to load dashboard.</span></div>;

  const { summary, user, languageBreakdown, scoreOverTime, recentReviews, topIssues } = data;

  const CATEGORY_COLORS = {
    security: "var(--red)", performance: "var(--amber)", readability: "var(--blue)",
    maintainability: "var(--green)", "best-practice": "#a78bfa", bug: "var(--red)", style: "var(--text-dim)"
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHead + " fade-in"}>
        <div>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.subheading}>Welcome back, {user.name} · {user.reviewCount} reviews total</p>
        </div>
        <button className={styles.newBtn} onClick={() => navigate("/review")}>
          + New Review
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsGrid + " fade-in-1"}>
        <StatCard label="Total Reviews" value={summary.totalReviews} />
        <StatCard label="Avg Score" value={summary.avgScore} accent="var(--green)" sub="out of 100" />
        <StatCard label="Critical Issues" value={summary.totalCritical} accent="var(--red)" />
        <StatCard label="Warnings" value={summary.totalWarnings} accent="var(--amber)" />
        <StatCard label="Suggestions" value={summary.totalSuggestions} accent="var(--blue)" />
        <StatCard label="Tokens Used" value={summary.totalTokens?.toLocaleString()} sub="via Groq" />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow + " fade-in-2"}>
        {/* Score over time */}
        <Card style={{ flex: 2 }}>
          <CardHeader title="Score Trend" subtitle="Last 30 days" />
          {scoreOverTime.length === 0 ? (
            <div className={styles.empty}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreOverTime.map((d) => ({ ...d, date: fmt(d.date) }))}>
                <XAxis dataKey="date" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="var(--green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Language breakdown */}
        <Card style={{ flex: 1 }}>
          <CardHeader title="Languages" />
          {languageBreakdown.length === 0 ? (
            <div className={styles.empty}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={languageBreakdown} layout="horizontal">
                <YAxis type="number" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <XAxis type="category" dataKey="language" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reviews" fill="var(--green)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow + " fade-in-3"}>
        {/* Recent reviews */}
        <Card style={{ flex: 3 }}>
          <CardHeader title="Recent Reviews" action={
            <button className={styles.linkBtn} onClick={() => navigate("/history")}>View all →</button>
          } />
          <div className={styles.reviewList}>
            {recentReviews.length === 0 && <div className={styles.empty}>No reviews yet. <button className={styles.linkBtn} onClick={() => navigate("/review")}>Start your first →</button></div>}
            {recentReviews.map((r) => (
              <div key={r._id} className={styles.reviewRow} onClick={() => navigate(`/history/${r._id}`)}>
                <ScoreRing score={r.overallScore} size={56} />
                <div className={styles.reviewInfo}>
                  <div className={styles.reviewFile}>{r.fileName}</div>
                  <div className={styles.reviewMeta}>
                    <Badge variant="default">{r.language}</Badge>
                    {r.issueCount.critical > 0 && <Badge variant="red">{r.issueCount.critical} critical</Badge>}
                    {r.issueCount.warning > 0 && <Badge variant="amber">{r.issueCount.warning} warnings</Badge>}
                  </div>
                </div>
                <div className={styles.reviewDate}>{fmt(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top issue categories */}
        <Card style={{ flex: 2 }}>
          <CardHeader title="Top Issues" subtitle="By category" />
          <div className={styles.issueList}>
            {topIssues.length === 0 && <div className={styles.empty}>No issues detected yet.</div>}
            {topIssues.map((issue) => (
              <div key={issue.category} className={styles.issueCat}>
                <div className={styles.issueCatBar}>
                  <span className={styles.issueCatName} style={{ color: CATEGORY_COLORS[issue.category] || "var(--text)" }}>
                    {issue.category}
                  </span>
                  {issue.critical > 0 && <Badge variant="red">{issue.critical} critical</Badge>}
                </div>
                <div className={styles.issueBarWrap}>
                  <div className={styles.issueBarFill} style={{
                    width: `${Math.min(100, (issue.count / (topIssues[0]?.count || 1)) * 100)}%`,
                    background: CATEGORY_COLORS[issue.category] || "var(--green)"
                  }} />
                </div>
                <span className={styles.issueCatCount}>{issue.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
