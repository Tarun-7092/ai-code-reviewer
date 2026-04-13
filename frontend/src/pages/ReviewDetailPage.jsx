import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { historyApi } from "../services/api";
import { Card, CardHeader, ScoreRing, Badge, SeverityBadge, Spinner, Button } from "../components/ui";
import styles from "./ReviewDetailPage.module.css";

const fmt = (d) => new Date(d).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
const SEV_ORDER = { critical: 0, warning: 1, suggestion: 2 };
const SCORE_KEYS = ["security", "performance", "readability", "maintainability", "bestPractices"];
const SCORE_LABELS = { security: "Security", performance: "Performance", readability: "Readability", maintainability: "Maintainability", bestPractices: "Best Practices" };

export default function ReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("issues");
  const [tagInput, setTagInput] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    historyApi.get(id)
      .then((res) => { setReview(res.data.data); setTagInput(res.data.data.tags?.join(", ") || ""); })
      .catch(() => navigate("/history"))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleFav = async () => {
    await historyApi.favorite(id);
    setReview((r) => ({ ...r, isFavorited: !r.isFavorited }));
  };

  const saveTags = async () => {
    setSavingTag(true);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await historyApi.tag(id, tags);
    setReview((r) => ({ ...r, tags }));
    setSavingTag(false);
  };

  if (loading) return <div className={styles.loader}><Spinner size={32} /></div>;
  if (!review) return null;

  const sortedIssues = (review.issues || []).slice().sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3));

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={styles.backBtn} onClick={() => navigate("/history")}>← Back to History</button>

      {/* Header */}
      <div className={"fade-in " + styles.header}>
        <div className={styles.headerLeft}>
          <ScoreRing score={review.overallScore} size={88} />
          <div>
            <h1 className={styles.fileName}>{review.fileName}</h1>
            <div className={styles.headerBadges}>
              <Badge>{review.language}</Badge>
              <Badge variant={review.grade === "A+" || review.grade === "A" ? "green" : review.grade === "F" ? "red" : "amber"}>
                Grade {review.grade}
              </Badge>
              {review.isFavorited && <Badge variant="amber">★ Favorited</Badge>}
            </div>
            <div className={styles.reviewedAt}>{fmt(review.createdAt)} · {review.model} · {review.tokensUsed} tokens</div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" onClick={toggleFav}>
            {review.isFavorited ? "★ Unfavorite" : "☆ Favorite"}
          </Button>
        </div>
      </div>

      {/* Summary + Scores */}
      <div className={"fade-in-1 " + styles.twoCol}>
        <Card style={{ flex: 2 }}>
          <CardHeader title="Summary" />
          <p className={styles.summaryText}>{review.summary || "No summary available."}</p>

          {review.positives?.length > 0 && (
            <div className={styles.positives}>
              <div className={styles.posTitle}>Positives</div>
              {review.positives.map((p, i) => (
                <div key={i} className={styles.positiveItem}><span className={styles.check}>✓</span>{p}</div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ flex: 1 }}>
          <CardHeader title="Dimension Scores" />
          <div className={styles.dimList}>
            {SCORE_KEYS.map((k) => {
              const v = review.scores?.[k] ?? 0;
              const color = v >= 7 ? "var(--green)" : v >= 5 ? "var(--amber)" : "var(--red)";
              return (
                <div key={k} className={styles.dimItem}>
                  <span className={styles.dimLabel}>{SCORE_LABELS[k]}</span>
                  <div className={styles.dimBarWrap}>
                    <div className={styles.dimBarFill} style={{ width: `${v * 10}%`, background: color }} />
                  </div>
                  <span className={styles.dimVal} style={{ color }}>{v.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.issueStats}>
            <div className={styles.issueStat}><span className={styles.critDot} />{review.issueCount.critical} Critical</div>
            <div className={styles.issueStat}><span className={styles.warnDot} />{review.issueCount.warning} Warnings</div>
            <div className={styles.issueStat}><span className={styles.suggDot} />{review.issueCount.suggestion} Suggestions</div>
          </div>
        </Card>
      </div>

      {/* Tags */}
      <div className={"fade-in-2 " + styles.tagsCard}>
        <Card>
          <CardHeader title="Tags" subtitle="Comma-separated, max 5" />
          <div className={styles.tagRow}>
            <input
              className={styles.tagInput}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="api, security, refactor..."
              onKeyDown={(e) => e.key === "Enter" && saveTags()}
            />
            <Button variant="ghost" onClick={saveTags} loading={savingTag}>Save Tags</Button>
          </div>
        </Card>
      </div>

      {/* Issues */}
      <div className="fade-in-3">
        <div className={styles.tabs}>
          {["issues", "code", "refactor"].map((t) => (
            <button
              key={t}
              className={styles.tab + (activeTab === t ? " " + styles.tabActive : "")}
              onClick={() => setActiveTab(t)}
            >
              {t === "issues" ? `Issues (${sortedIssues.length})` : t === "code" ? "Code Preview" : "Refactored"}
            </button>
          ))}
        </div>

        {activeTab === "issues" && (
          <div className={styles.issuesList}>
            {sortedIssues.length === 0 && <div className={styles.noIssues}>✓ No issues found</div>}
            {sortedIssues.map((issue, i) => (
              <Card key={i} className={styles.issueCard} style={{
                borderLeftColor: issue.severity === "critical" ? "var(--red)" : issue.severity === "warning" ? "var(--amber)" : "var(--blue)",
                borderLeftWidth: 3,
              }}>
                <div className={styles.issueTop}>
                  <SeverityBadge severity={issue.severity} />
                  <Badge>{issue.category}</Badge>
                  {issue.line && <span className={styles.lineTag}>Line {issue.line}</span>}
                </div>
                <div className={styles.issueTitle}>{issue.title}</div>
                <div className={styles.issueDesc}>{issue.description}</div>
                {issue.codeContext && (
                  <pre className={styles.codeCtx}><code>{issue.codeContext}</code></pre>
                )}
                {issue.suggestion && (
                  <div className={styles.suggestion}>
                    <span className={styles.fixLabel}>↳ Fix:</span> {issue.suggestion}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {activeTab === "code" && (
          <Card>
            <CardHeader title="Code Preview" subtitle="First 2000 chars stored" />
            <pre className={styles.codePreview}><code>{review.codeSnippet || "No preview available."}</code></pre>
          </Card>
        )}

        {activeTab === "refactor" && (
          <Card>
            <CardHeader title="Suggested Refactor" />
            {review.refactoredSnippet
              ? <pre className={styles.codePreview}><code>{review.refactoredSnippet}</code></pre>
              : <div className={styles.noIssues}>No refactor snippet provided.</div>
            }
          </Card>
        )}
      </div>
    </div>
  );
}
