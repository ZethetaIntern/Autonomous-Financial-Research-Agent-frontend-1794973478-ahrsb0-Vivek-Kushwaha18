
"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

type ResearchItem = {
  research_id: string;
  question: string;
  company: string | null;
  status: string;
  created_at?: string;
};

type ResearchRecord = {
  research_id: string;
  question: string;
  company: string | null;
  ticker: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  job: {
    job_id: string;
    status: string;
    attempts: number;
    error: string | null;
  } | null;
  evidence: {
    source_name: string;
    source_type: string;
    source_url: string | null;
    title: string;
    content: string;
    data: unknown;
  }[];
  report: {
    title: string;
    content: string;
    format: string;
    metadata: Record<string, unknown>;
    created_at: string;
  } | null;
};

type Tab = "overview" | "report" | "evidence";

function statusClass(status: string) {
  if (status === "completed") return "status completed";
  if (status === "partial_success") return "status partial";
  if (status === "failed") return "status failed";
  if (status === "running") return "status running";
  return "status queued";
}

function readableStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

export default function Home() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  const [question, setQuestion] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [record, setRecord] = useState<ResearchRecord | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Authentication check
  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then(() => {
        if (!cancelled) {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadRecord = useCallback(async (id: string, quiet = false) => {
    if (!id) return;

    if (!quiet) setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/research/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Research session was not found.");
        }
        throw new Error(`Research request failed (${response.status}).`);
      }

      const data: ResearchRecord = await response.json();
      setRecord(data);
      setApiOnline(true);

      setResearchList((previous) =>
        previous.map((item) =>
          item.research_id === id
            ? {
                ...item,
                status: data.status,
                company: data.company,
                question: data.question,
              }
            : item
        )
      );
    } catch (err) {
      if (!quiet) {
        setError(
          err instanceof Error ? err.message : "Unable to load research."
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("zetheta-research-history");

    if (saved) {
      try {
        const items = JSON.parse(saved) as ResearchItem[];
        setResearchList(items);

        if (items.length > 0) {
          setSelectedId(items[0].research_id);
        }
      } catch {
        localStorage.removeItem("zetheta-research-history");
      }
    }

    fetch(`${API_URL}/health`)
      .then((response) => setApiOnline(response.ok))
      .catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "zetheta-research-history",
      JSON.stringify(researchList)
    );
  }, [researchList]);

  useEffect(() => {
    if (!selectedId) {
      setRecord(null);
      return;
    }

    loadRecord(selectedId);
  }, [selectedId, loadRecord]);

  useEffect(() => {
    if (!selectedId) return;

    const interval = window.setInterval(() => {
      loadRecord(selectedId, true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [selectedId, loadRecord]);

  async function submitResearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (question.trim().length < 5) {
      setError("Please enter a research question with at least 5 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          company: company.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to submit research.");
      }

      const item: ResearchItem = {
        research_id: data.research_id,
        question: question.trim(),
        company: company.trim() || null,
        status: data.status,
        created_at: new Date().toISOString(),
      };

      setResearchList((previous) => [
        item,
        ...previous.filter(
          (entry) => entry.research_id !== item.research_id
        ),
      ]);

      setSelectedId(item.research_id);
      setTab("overview");
      setQuestion("");
      setCompany("");
      setApiOnline(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the research API."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isActive =
    record?.status === "queued" || record?.status === "running";

  const completedCount = researchList.filter(
    (item) => item.status === "completed"
  ).length;

  const partialCount = researchList.filter(
    (item) => item.status === "partial_success"
  ).length;

  const activeCount = researchList.filter(
    (item) => item.status === "queued" || item.status === "running"
  ).length;

  if (!authChecked) {
    return (
      <main className="auth-page">
        <div className="auth-heading">
          <h1>Loading Zetheta</h1>
          <p>Verifying your session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">Z</span>
          <span>
            <strong>zetheta</strong>
            <small>FINANCIAL INTELLIGENCE</small>
          </span>
        </a>

        <div className="side-label">WORKSPACE</div>

        <button className="nav-item active" onClick={() => setTab("overview")}>
          <span className="nav-icon">◫</span>
          Research workspace
        </button>

        <button
          className="nav-item"
          onClick={() => {
            setSelectedId("");
            setRecord(null);
          }}
        >
          <span className="nav-icon">＋</span>
          New research
        </button>

        <div className="side-label history-label">RESEARCH HISTORY</div>

        <div className="history-list">
          {researchList.length === 0 ? (
            <p className="empty-history">Your research will appear here.</p>
          ) : (
            researchList.map((item) => (
              <button
                key={item.research_id}
                className={`history-item ${
                  selectedId === item.research_id ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedId(item.research_id);
                  setTab("overview");
                  setError("");
                }}
              >
                <span className="history-title">
                  {item.company || item.question}
                </span>
                <span className={statusClass(item.status)}>
                  {readableStatus(item.status)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="connection-card">
            <span
              className={`connection-dot ${
                apiOnline ? "online" : apiOnline === false ? "offline" : ""
              }`}
            />
            <div>
              <strong>API connection</strong>
              <small>
                {apiOnline === null
                  ? "Checking connection"
                  : apiOnline
                    ? "Backend connected"
                    : "Backend unavailable"}
              </small>
            </div>
          </div>
          <span className="version-label">Zetheta Research Platform · v1.0</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> Financial research
          </div>

          <div className="topbar-right">
            <span className="live-indicator">
              <i /> LIVE RESEARCH SYSTEM
            </span>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">AUTONOMOUS RESEARCH PLATFORM</div>
              <h1>Financial research workspace</h1>
              <p>
                Investigate companies, analyze financial performance and
                generate evidence-backed investment reports.
              </p>
            </div>
            <div className="date-chip">
              <span>◷</span> Research on demand
            </div>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total research</span>
                <span className="stat-symbol">▤</span>
              </div>
              <strong>{researchList.length}</strong>
              <small>Sessions in this browser</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>Completed</span>
                <span className="stat-symbol green">✓</span>
              </div>
              <strong>{completedCount}</strong>
              <small>Fully completed sessions</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>In progress</span>
                <span className="stat-symbol blue">◷</span>
              </div>
              <strong>{activeCount}</strong>
              <small>Queued or running</small>
            </div>
            <div className="stat-card">
              <div className="stat-top">
                <span>Partial results</span>
                <span className="stat-symbol amber">!</span>
              </div>
              <strong>{partialCount}</strong>
              <small>Require further investigation</small>
            </div>
          </section>

          <section className="research-layout">
            <div className="panel new-research-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">START AN INVESTIGATION</div>
                  <h2>New research</h2>
                </div>
                <span className="panel-icon">✳</span>
              </div>

              <p className="panel-description">
                Submit a question. The agent will plan and execute its
                research independently.
              </p>

              <form onSubmit={submitResearch}>
                <label htmlFor="company">Company name (optional)</label>
                <input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="e.g. Apple Inc."
                  maxLength={200}
                />

                <label htmlFor="question">Research question</label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Example: Analyze Apple's financial performance, revenue growth, profitability, competitive position, recent developments and key investment risks."
                  rows={5}
                  minLength={5}
                  maxLength={2000}
                  required
                />

                <div className="input-footer">
                  <span>{question.length}/2000 characters</span>
                  <span>Autonomous Plan &amp; Execute</span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>Submitting research...</>
                  ) : (
                    <>✳ &nbsp; Start autonomous research <span>→</span></>
                  )}
                </button>
              </form>

              <div className="source-note">
                <strong>Research sources</strong>
                <div className="source-tags">
                  <span>SEC EDGAR</span>
                  <span>Market data</span>
                  <span>Financial APIs</span>
                  <span>News feeds</span>
                  <span>Transcripts</span>
                  <span>Web search</span>
                </div>
              </div>
            </div>

            <div className="panel execution-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">RESEARCH MONITOR</div>
                  <h2>Execution details</h2>
                </div>
                {record && (
                  <span className={statusClass(record.status)}>
                    {readableStatus(record.status)}
                  </span>
                )}
              </div>

              {!record ? (
                <div className="empty-state">
                  <div className="empty-icon">⌕</div>
                  <h3>No research selected</h3>
                  <p>
                    Start a new investigation or select a session from your
                    research history.
                  </p>
                </div>
              ) : (
                <>
                  <div className="selected-company">
                    <span className="company-avatar">
                      {(record.company || "R").charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{record.company || "Research session"}</strong>
                      <small>
                        {record.ticker || "Ticker not resolved"} ·{" "}
                        {record.research_id.slice(0, 8)}
                      </small>
                    </div>
                  </div>

                  <div className="research-question">
                    <small>RESEARCH QUESTION</small>
                    <p>{record.question}</p>
                  </div>

                  <div className="execution-timeline">
                    <div className="timeline-row">
                      <span className="timeline-dot done">✓</span>
                      <div>
                        <strong>Research request received</strong>
                        <small>{formatDate(record.created_at)}</small>
                      </div>
                    </div>
                    <div className="timeline-row">
                      <span
                        className={`timeline-dot ${
                          record.started_at ? "done" : ""
                        }`}
                      >
                        {record.started_at ? "✓" : "2"}
                      </span>
                      <div>
                        <strong>Agent execution</strong>
                        <small>
                          {record.started_at
                            ? formatDate(record.started_at)
                            : "Waiting for worker"}
                        </small>
                      </div>
                    </div>
                    <div className="timeline-row">
                      <span
                        className={`timeline-dot ${
                          record.completed_at ? "done" : ""
                        }`}
                      >
                        {record.completed_at ? "✓" : "3"}
                      </span>
                      <div>
                        <strong>Report generation</strong>
                        <small>
                          {record.report
                            ? "Report saved in PostgreSQL"
                            : "Awaiting research completion"}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="execution-metrics">
                    <div>
                      <strong>{record.evidence.length}</strong>
                      <small>Evidence records</small>
                    </div>
                    <div>
                      <strong>{record.job?.attempts ?? 0}</strong>
                      <small>Attempts</small>
                    </div>
                    <div>
                      <strong>{record.report ? "Yes" : "No"}</strong>
                      <small>Report saved</small>
                    </div>
                  </div>

                  {record.job?.error && (
                    <div className="error-message">
                      {record.job.error}
                    </div>
                  )}

                  {isActive && (
                    <div className="polling-note">
                      <span className="spinner" />
                      Automatically refreshing every 5 seconds
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="panel results-panel">
            <div className="results-heading">
              <div>
                <div className="eyebrow">RESEARCH OUTPUT</div>
                <h2>Analysis and evidence</h2>
              </div>
              {record?.report && (
                <button
                  className="download-button"
                  onClick={() => {
                    const blob = new Blob([record.report!.content], {
                      type: "text/markdown;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `zetheta-${record.research_id}.md`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  ↓ &nbsp; Export report
                </button>
              )}
            </div>

            <div className="tabs">
              <button
                className={tab === "overview" ? "tab active-tab" : "tab"}
                onClick={() => setTab("overview")}
              >
                Overview
              </button>
              <button
                className={tab === "report" ? "tab active-tab" : "tab"}
                onClick={() => setTab("report")}
              >
                Research report
              </button>
              <button
                className={tab === "evidence" ? "tab active-tab" : "tab"}
                onClick={() => setTab("evidence")}
              >
                Evidence ({record?.evidence.length || 0})
              </button>
            </div>

            {!record ? (
              <div className="results-empty">
                Select a research session to view its results.
              </div>
            ) : tab === "report" ? (
              record.report ? (
                <article className="report-content">
                  <div className="report-title">
                    <span>GENERATED INVESTMENT RESEARCH</span>
                    <h3>{record.report.title}</h3>
                    <small>
                      Generated {formatDate(record.report.created_at)}
                    </small>
                  </div>
                  <pre>{record.report.content}</pre>
                </article>
              ) : (
                <div className="results-empty">
                  The report is not available yet. The research worker may
                  still be processing this session.
                </div>
              )
            ) : tab === "evidence" ? (
              record.evidence.length > 0 ? (
                <div className="evidence-list">
                  {record.evidence.map((item, index) => (
                    <article
                      className="evidence-card"
                      key={`${item.source_name}-${index}`}
                    >
                      <div className="evidence-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="evidence-body">
                        <span className="evidence-type">
                          {item.source_type}
                        </span>
                        <h3>{item.title || item.source_name}</h3>
                        <p>{item.content}</p>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open source ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="results-empty">
                  No evidence records have been saved yet.
                </div>
              )
            ) : (
              <div className="overview-content">
                <div className="overview-message">
                  <div className="overview-icon">✳</div>
                  <div>
                    <h3>
                      {record.report
                        ? "Research report generated"
                        : "Research session created"}
                    </h3>
                    <p>
                      {record.report
                        ? "Your investment research report is stored in PostgreSQL. Open the Research report tab to read or export it."
                        : "The agent is processing this research request. Results will appear here automatically."}
                    </p>
                  </div>
                </div>
                <div className="overview-grid">
                  <div>
                    <small>SESSION STATUS</small>
                    <strong>{readableStatus(record.status)}</strong>
                  </div>
                  <div>
                    <small>COMPANY</small>
                    <strong>{record.company || "Not identified"}</strong>
                  </div>
                  <div>
                    <small>TICKER</small>
                    <strong>{record.ticker || "Not resolved"}</strong>
                  </div>
                  <div>
                    <small>EVIDENCE</small>
                    <strong>{record.evidence.length} records</strong>
                  </div>
                </div>
              </div>
            )}
          </section>

          <footer className="footer">
            <span>© 2026 Zetheta Financial Research Agent</span>
            <span>Evidence-backed research · Not investment advice</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
