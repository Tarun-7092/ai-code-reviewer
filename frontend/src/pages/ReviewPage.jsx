import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reviewApi } from "../services/api";
import { Card, CardHeader, Button, ScoreRing, Badge, SeverityBadge, Alert } from "../components/ui";
import styles from "./ReviewPage.module.css";

const SAMPLE = `// Example: fetch user data
async function getUser(id) {
  const query = "SELECT * FROM users WHERE id = " + id; // SQL injection!
  const result = await db.query(query);
  const password = result.password; // exposed!
  return result;
}`;

const SEV_ORDER = { critical: 0, warning: 1, suggestion: 2 };

export default function ReviewPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("issues");

  const submit = async () => {
    if (!fileName.trim() || !code.trim()) return setError("Please provide a file name and code.");
    if (code.length > 20000) return setError("Code exceeds 20,000 character limit.");
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await reviewApi.submit({ fileName, code });
      setResult(res.data.data);
      setActiveTab("issues");
    } catch (err) {
      setError(err.response?.data?.error || "Review failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedIssues = result?.issues?.slice().sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)) || [];

  const SCORE_KEYS = ["security", "performance", "readability", "maintainability", "bestPractices"];
  const SCORE_LABELS = { security: "Security", performance: "Perf", readability: "Readability", maintainability: "Maint.", bestPractices: "Best Practices" };

  return (
    <div className={styles.page}>
      <div className={"fade-in " + styles.header}>
        <h1 className={styles.heading}>New Review</h1>
        <p className={styles.sub}>Paste code and get an instant AI-powered analysis</p>
      </div>

      <div className={styles.layout}>
        {/* Input panel */}
        <div className={"fade-in-1 " + styles.inputPanel}>
          <Card>
            <CardHeader title="Code Input" subtitle={`${code.length.toLocaleString()} / 20,000 chars`} />

            <div className={styles.fileRow}>
              <input
                className={styles.fileInput}
                placeholder="filename.js"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <button className={styles.sampleBtn} onClick={() => { setFileName("example.js"); setCode(SAMPLE); }}>
                Load Sample
              </button>
            </div>

            <div className={styles.editorWrap}>
              <div className={styles.lineNums}>
                {code.split("\n").map((_, i) => (
                  <div key={i} className={styles.lineNum}>{i + 1}</div>
                ))}
                {code.length === 0 && <div className={styles.lineNum}>1</div>}
              </div>
              <textarea
                className={styles.editor}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// paste your code here..."
                spellCheck={false}
              />
            </div>

            {error && <div style={{ marginTop: 12 }}><Alert type="error">{error}</Alert></div>}

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => { setCode(""); setFileName(""); setResult(null); setError(""); }}>
                Clear
              </Button>
              <Button loading={loading} onClick={submit} icon={!loading && "◈"}>
                {loading ? "Analyzing..." : "Run Analysis"}
              </Button>
            </div>

            {loading && (
              <div className={styles.analyzing}>
                <div className={styles.scanLine} />
                <code className={styles.analyzeMsg}>
                  <span className={styles.greenDot}>▶</span> Sending to Groq llama3-70b...
                </code>
              </div>
            )}
          </Card>
        </div>

        {/* Result panel */}
        <div className={"fade-in-2 " + styles.resultPanel}>
          {!result && !loading && (
            <div className={styles.emptyResult}>
              <div className={styles.emptyIcon}>◈</div>
              <div className={styles.emptyText}>Results will appear here</div>
              <div className={styles.emptyHint}>Supports JS, TS, Python, Go, Rust, and 20+ languages</div>
            </div>
          )}

          {result && (
            <div className={styles.resultInner}>
              {/* Score header */}
              <Card className={styles.scoreCard}>
                <div className={styles.scoreRow}>
                  <ScoreRing score={result.overallScore} size={96} />
                  <div className={styles.scoreInfo}>
                    <div className={styles.scoreName}>{result.fileName}</div>
                    <div className={styles.scoreLang}>
                      <Badge>{result.language}</Badge>
                      <Badge variant={result.issueCount.critical > 0 ? "red" : "green"}>
                        {result.issueCount.critical} critical
                      </Badge>
                      <Badge variant="amber">{result.issueCount.warning} warnings</Badge>
                    </div>
                    <p className={styles.summary}>{result.summary}</p>
                  </div>
                </div>

                {/* Dimension scores */}
                <div className={styles.dimGrid}>
                  {SCORE_KEYS.map((k) => (
                    <div key={k} className={styles.dimCard}>
                      <div className={styles.dimVal} style={{
                        color: result.scores[k] >= 7 ? "var(--green)" : result.scores[k] >= 5 ? "var(--amber)" : "var(--red)"
                      }}>
                        {result.scores[k]?.toFixed(1)}
                      </div>
                      <div className={styles.dimLabel}>{SCORE_LABELS[k]}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Tabs */}
              <div className={styles.tabs}>
                {["issues", "positives", "refactor"].map((t) => (
                  <button
                    key={t}
                    className={styles.tab + (activeTab === t ? " " + styles.tabActive : "")}
                    onClick={() => setActiveTab(t)}
                  >
                    {t === "issues" ? `Issues (${sortedIssues.length})` : t === "positives" ? `Positives (${result.positives?.length || 0})` : "Refactored"}
                  </button>
                ))}
              </div>

              {/* Issues tab */}
              {activeTab === "issues" && (
                <div className={styles.issuesList}>
                  {sortedIssues.length === 0 && <div className={styles.noIssues}>✓ No issues found — great code!</div>}
                  {sortedIssues.map((issue, i) => (
                    <Card key={i} className={styles.issueCard} style={{
                      borderLeftColor: issue.severity === "critical" ? "var(--red)" : issue.severity === "warning" ? "var(--amber)" : "var(--blue)",
                      borderLeftWidth: 3,
                    }}>
                      <div className={styles.issueHead}>
                        <SeverityBadge severity={issue.severity} />
                        <Badge>{issue.category}</Badge>
                        {issue.line && <span className={styles.issueLine}>Line {issue.line}</span>}
                      </div>
                      <div className={styles.issueTitle}>{issue.title}</div>
                      <div className={styles.issueDesc}>{issue.description}</div>
                      {issue.codeContext && (
                        <pre className={styles.codeCtx}><code>{issue.codeContext}</code></pre>
                      )}
                      {issue.suggestion && (
                        <div className={styles.suggestion}>
                          <span className={styles.suggestionLabel}>↳ Fix:</span> {issue.suggestion}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Positives tab */}
              {activeTab === "positives" && (
                <div className={styles.positivesList}>
                  {(result.positives || []).length === 0 && <div className={styles.noIssues}>No positives noted.</div>}
                  {(result.positives || []).map((p, i) => (
                    <div key={i} className={styles.positiveItem}>
                      <span className={styles.checkMark}>✓</span> {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Refactor tab */}
              {activeTab === "refactor" && (
                <Card>
                  <CardHeader title="Suggested Refactor" />
                  {result.refactoredSnippet ? (
                    <pre className={styles.refactorCode}><code>{result.refactoredSnippet}</code></pre>
                  ) : (
                    <div className={styles.noIssues}>No refactored snippet provided.</div>
                  )}
                </Card>
              )}

              <div className={styles.resultFoot}>
                <span className={styles.metaInfo}>Model: {result.model} · {result.tokensUsed} tokens</span>
                <button className={styles.histBtn} onClick={() => navigate("/history")}>
                  View in History →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
