import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { historyApi } from "../services/api";
import { Card, ScoreRing, Badge, Spinner, Button } from "../components/ui";
import styles from "./HistoryPage.module.css";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const LANGUAGES = [
  "",
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "Ruby",
  "PHP",
  "SQL",
  "Bash",
];
const GRADES = ["", "A+", "A", "B", "C", "D", "F"];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    language: "",
    grade: "",
    search: "",
  });
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(
    async (pg = 1, f = filters) => {
      setLoading(true);
      try {
        const params = {
          page: pg,
          limit: 12,
          ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)),
        };
        const res = await historyApi.list(params);
        const payload = res?.data?.data ?? {};

        setReviews(payload.reviews ?? []);
        setTotal(payload.total ?? 0);
        setPage(payload.page ?? 1);
        setPages(payload.pages ?? 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    load(1, filters);
  }, []);

  const applyFilters = () => load(1, filters);
  const resetFilters = () => {
    const f = { language: "", grade: "", search: "" };
    setFilters(f);
    load(1, f);
  };

  const handleFavorite = async (e, id) => {
    e.stopPropagation();
    await historyApi.favorite(id);
    setReviews((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, isFavorited: !r.isFavorited } : r,
      ),
    );
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this review?")) return;
    setDeleting(id);
    try {
      await historyApi.delete(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={"fade-in " + styles.header}>
        <div>
          <h1 className={styles.heading}>Review History</h1>
          <p className={styles.sub}>
            {total} review{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => navigate("/review")} icon="◈">
          New Review
        </Button>
      </div>

      {/* Filters */}
      <div className={"fade-in-1 " + styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search by filename..."
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        />
        <select
          className={styles.select}
          value={filters.language}
          onChange={(e) =>
            setFilters((f) => ({ ...f, language: e.target.value }))
          }
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l || "All Languages"}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={filters.grade}
          onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))}
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g || "All Grades"}
            </option>
          ))}
        </select>
        <Button variant="ghost" onClick={applyFilters}>
          Filter
        </Button>
        <Button variant="ghost" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.loader}>
          <Spinner size={28} />
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>≡</div>
          <p>No reviews found.</p>
          <Button onClick={() => navigate("/review")} icon="◈">
            Run your first review
          </Button>
        </div>
      ) : (
        <div className={"fade-in-2 " + styles.grid}>
          {reviews.map((r, i) => (
            <div
              key={r._id}
              className={styles.reviewCard}
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => navigate(`/history/${r._id}`)}
            >
              <div className={styles.cardTop}>
                <ScoreRing score={r.overallScore} size={56} />
                <div className={styles.cardMeta}>
                  <button
                    className={
                      styles.favBtn +
                      (r.isFavorited ? " " + styles.favActive : "")
                    }
                    onClick={(e) => handleFavorite(e, r._id)}
                    title={r.isFavorited ? "Unfavorite" : "Favorite"}
                  >
                    ★
                  </button>
                  <button
                    className={styles.delBtn}
                    onClick={(e) => handleDelete(e, r._id)}
                    disabled={deleting === r._id}
                    title="Delete"
                  >
                    {deleting === r._id ? "…" : "✕"}
                  </button>
                </div>
              </div>

              <div className={styles.fileName} title={r.fileName}>
                {r.fileName}
              </div>

              <div className={styles.badges}>
                <Badge>{r.language}</Badge>
                <Badge
                  variant={
                    r.grade === "A+" || r.grade === "A"
                      ? "green"
                      : r.grade === "F"
                        ? "red"
                        : "amber"
                  }
                >
                  {r.grade}
                </Badge>
              </div>

              <div className={styles.issueRow}>
                {r.issueCount.critical > 0 && (
                  <span className={styles.issueBit + " " + styles.crit}>
                    {r.issueCount.critical} critical
                  </span>
                )}
                {r.issueCount.warning > 0 && (
                  <span className={styles.issueBit + " " + styles.warn}>
                    {r.issueCount.warning} warn
                  </span>
                )}
                {r.issueCount.suggestion > 0 && (
                  <span className={styles.issueBit + " " + styles.sugg}>
                    {r.issueCount.suggestion} hints
                  </span>
                )}
              </div>

              {r.tags?.length > 0 && (
                <div className={styles.tags}>
                  {r.tags.map((t) => (
                    <span key={t} className={styles.tag}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.date}>{fmt(r.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="ghost"
            onClick={() => load(page - 1)}
            disabled={page <= 1}
          >
            ← Prev
          </Button>
          <span className={styles.pageInfo}>
            Page {page} / {pages}
          </span>
          <Button
            variant="ghost"
            onClick={() => load(page + 1)}
            disabled={page >= pages}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
