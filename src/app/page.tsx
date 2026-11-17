
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AuthPanel from "./auth-panel";
import {
  AuthUser,
  getCurrentUser,
  logoutUser,
} from "@/lib/auth";

const products = [
  {
    number: "01",
    name: "AI Financial Research",
    description:
      "Ask complex financial questions and let the research agent investigate, organize evidence, and produce a structured report.",
    tags: ["Natural language research", "Evidence-backed reports"],
    className: "product-card-primary",
    symbol: "✳",
  },
  {
    number: "02",
    name: "Company Analysis",
    description:
      "Explore company fundamentals, financial performance, business information, and key financial metrics.",
    tags: ["Company fundamentals", "Financial metrics"],
    className: "product-card-offset",
    symbol: "◫",
  },
  {
    number: "03",
    name: "SEC Filings & Financials",
    description:
      "Research company filings and financial facts using information from SEC EDGAR.",
    tags: ["10-K · 10-Q · 8-K", "Financial statements"],
    className: "product-card-lower",
    symbol: "▤",
  },
  {
    number: "04",
    name: "Market & Earnings Research",
    description:
      "Bring together stock performance, company news, market news, and earnings-call research.",
    tags: ["Market research", "Earnings transcripts"],
    className: "product-card-offset",
    symbol: "↗",
  },
];

const capabilities = [
  {
    number: "01",
    title: "Ask in plain English",
    description:
      "Start with a company, a financial question, or a research topic. Describe what you want to understand.",
    icon: "⌕",
  },
  {
    number: "02",
    title: "Investigate multiple sources",
    description:
      "Use connected research tools for SEC filings, financial data, stock information, news, and earnings calls.",
    icon: "⌘",
  },
  {
    number: "03",
    title: "Review the evidence",
    description:
      "Explore the research results, supporting evidence, and source references behind your report.",
    icon: "▧",
  },
];

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileInfoOpen, setProfileInfoOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
        setProfileInfoOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [profileOpen]);

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setProfileOpen(false);
    setProfileInfoOpen(false);
    setAuthMode(null);
  }

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <div className="marketing-nav">
          <Link href="/" className="marketing-brand" aria-label="Zetheta home">
            <span className="marketing-brand-mark">Z</span>
            <span>
              <strong>zetheta</strong>
              <small>FINANCIAL INTELLIGENCE</small>
            </span>
          </Link>

          <nav className="marketing-nav-links" aria-label="Main navigation">
            <details className="marketing-dropdown">
              <summary>
                Products <span>⌄</span>
              </summary>
              <div className="marketing-dropdown-panel">
                <a href="#products">AI Financial Research</a>
                <a href="#products">Company Analysis</a>
                <a href="#products">SEC Filings & Financials</a>
                <a href="#products">Market & Earnings Research</a>
              </div>
            </details>

            <a href="#how-it-works">How it works</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="marketing-nav-actions">
            {user ? (
              <div className="marketing-account-wrap" ref={profileRef}>
                <div className="marketing-home-account-actions">
                  <Link
                    href="/dashboard"
                    className="marketing-home-dashboard-button"
                  >
                    Dashboard
                    <span>↗</span>
                  </Link>

                  <button
                    type="button"
                    className="marketing-profile-icon"
                    onClick={() => {
                      setProfileOpen((open) => !open);
                      setProfileInfoOpen(false);
                    }}
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="21"
                      height="21"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c.5-3.5 3.2-5.5 7-5.5s6.5 2 7 5.5" />
                    </svg>
                  </button>
                </div>

                {profileOpen && (
                  <div className="marketing-profile-dropdown">
                    <button
                      type="button"
                      className="marketing-profile-menu-button"
                      onClick={() =>
                        setProfileInfoOpen((open) => !open)
                      }
                      aria-expanded={profileInfoOpen}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20c.5-3.5 3.2-5.5 7-5.5s6.5 2 7 5.5" />
                      </svg>

                      Profile

                      <span className="marketing-profile-chevron">
                        {profileInfoOpen ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {profileInfoOpen && (
                      <div className="marketing-profile-details">
                        <div className="marketing-profile-avatar">
                          {user.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>

                        <div className="marketing-profile-identity">
                          <strong>{user.full_name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    )}

                    <div className="marketing-profile-divider" />

                    <button
                      type="button"
                      className="marketing-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <span>↗</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="marketing-login"
                  onClick={() => setAuthMode("login")}
                >
                  Log in
                </button>

                <button
                  type="button"
                  className="marketing-button marketing-button-small"
                  onClick={() => setAuthMode("register")}
                >
                  Get started <span>↗</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-glow" />
        <div className="marketing-container marketing-hero-grid">
          <div className="marketing-hero-copy">
            <div className="marketing-eyebrow">
              <span className="marketing-eyebrow-dot" />
              FINANCIAL RESEARCH, REIMAGINED
            </div>

            <h1>
              Research smarter.
              <br />
              <span>Understand deeper.</span>
            </h1>

            <p className="marketing-hero-description">
              Turn complex financial questions into structured research.
              Explore company fundamentals, filings, market information, and
              evidence with an AI-powered research workspace.
            </p>

            <div className="marketing-hero-actions">
              <button
                type="button"
                className="marketing-button"
                onClick={() => setAuthMode("register")}
              >
                Start researching <span>↗</span>
              </button>
              <a href="#products" className="marketing-secondary-link">
                Explore the platform <span>↓</span>
              </a>
            </div>

            <div className="marketing-hero-note">
              <span>✳</span>
              Built for deeper financial understanding
            </div>
          </div>

          <div
            className="marketing-visual-wrap"
            aria-label="Research workflow illustration"
          >
            <div className="marketing-orbit marketing-orbit-one" />
            <div className="marketing-orbit marketing-orbit-two" />

            <div className="marketing-visual-card">
              <div className="visual-card-top">
                <div className="visual-window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>RESEARCH WORKSPACE</span>
                <span className="visual-live"><i /> READY</span>
              </div>

              <div className="visual-card-content">
                <div className="visual-welcome">
                  <span className="visual-sparkle">✳</span>
                  <div>
                    <small>YOUR RESEARCH ASSISTANT</small>
                    <strong>What would you like to understand?</strong>
                  </div>
                </div>

                <div className="visual-prompt">
                  <span>Research a company's financial performance...</span>
                  <span className="visual-send">↗</span>
                </div>

                <div className="visual-divider" />

                <small className="visual-section-label">
                  RESEARCH CAPABILITIES
                </small>

                <div className="visual-capability">
                  <span className="visual-capability-icon">▤</span>
                  <div>
                    <strong>SEC filings</strong>
                    <small>Company disclosures and filings</small>
                  </div>
                  <span className="visual-arrow">↗</span>
                </div>

                <div className="visual-capability">
                  <span className="visual-capability-icon">◫</span>
                  <div>
                    <strong>Financial data</strong>
                    <small>Company metrics and fundamentals</small>
                  </div>
                  <span className="visual-arrow">↗</span>
                </div>

                <div className="visual-capability">
                  <span className="visual-capability-icon">⌁</span>
                  <div>
                    <strong>News & earnings</strong>
                    <small>Market news and earnings research</small>
                  </div>
                  <span className="visual-arrow">↗</span>
                </div>

                <div className="visual-card-footer">
                  <span>Research connected to evidence</span>
                  <span>✳ ZETHETA</span>
                </div>
              </div>
            </div>

            <div className="visual-floating visual-floating-top">
              <span>✳</span>
              <div>
                <small>RESEARCH APPROACH</small>
                <strong>Evidence first</strong>
              </div>
            </div>

            <div className="visual-floating visual-floating-bottom">
              <span>↗</span>
              <div>
                <small>YOUR WORKSPACE</small>
                <strong>One research flow</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="marketing-hero-bottom">
          <span>RESEARCH</span>
          <i />
          <span>ANALYSIS</span>
          <i />
          <span>EVIDENCE</span>
          <i />
          <span>INSIGHT</span>
        </div>
      </section>

      <section className="marketing-intro" id="about">
        <div className="marketing-container marketing-intro-grid">
          <div>
            <span className="marketing-section-label">
              THE ZETHETA APPROACH
            </span>
            <h2>
              Financial research,
              <br />
              without the <span>fragmentation.</span>
            </h2>
          </div>
          <p>
            Financial research often means moving between filings, financial
            statements, market information, and news. Zetheta brings these
            research capabilities into one workspace, helping you investigate
            questions and review the evidence behind the findings.
          </p>
        </div>
      </section>

      <section className="marketing-products" id="products">
        <div className="marketing-container">
          <div className="marketing-section-heading">
            <div>
              <span className="marketing-section-label">
                EXPLORE THE PLATFORM
              </span>
              <h2>
                Research tools that work <span>together.</span>
              </h2>
            </div>
            <p>
              A connected set of capabilities for exploring companies,
              financial information, and markets.
            </p>
          </div>

          <div className="marketing-product-grid">
            {products.map((product) => (
              <article
                className={`marketing-product-card ${product.className}`}
                key={product.number}
              >
                <div className="product-card-top">
                  <span className="product-number">{product.number}</span>
                  <span className="product-symbol">{product.symbol}</span>
                </div>
                <div className="product-card-body">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-tags">
                    {product.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <a href="#how-it-works" className="product-card-link">
                  Explore capability <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-how" id="how-it-works">
        <div className="marketing-container marketing-how-grid">
          <div className="marketing-how-heading">
            <span className="marketing-section-label">
              A CLEARER RESEARCH PROCESS
            </span>
            <h2>
              From question
              <br />
              to <span>understanding.</span>
            </h2>
            <p>
              Move through a focused research process. You decide the question;
              the workspace helps organize the investigation and its evidence.
            </p>
            <button
              type="button"
              className="marketing-text-link"
              onClick={() => setAuthMode("register")}
            >
              Start your research <span>↗</span>
            </button>
          </div>

          <div className="marketing-steps">
            {capabilities.map((item) => (
              <article className="marketing-step" key={item.number}>
                <div className="step-number">{item.number}</div>
                <div className="step-icon">{item.icon}</div>
                <div className="step-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="step-arrow">↗</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-cta" id="contact">
        <div className="marketing-container">
          <div className="marketing-cta-panel">
            <div className="cta-decoration cta-decoration-one" />
            <div className="cta-decoration cta-decoration-two" />
            <span className="marketing-section-label">
              YOUR NEXT RESEARCH STARTS HERE
            </span>
            <h2>
              Make your next
              <br />
              financial question count.
            </h2>
            <p>
              Explore a more connected way to research companies and financial
              information.
            </p>
            <button
              type="button"
              className="marketing-button marketing-button-light"
              onClick={() => setAuthMode("register")}
            >
              Get started with Zetheta <span>↗</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="marketing-container">
          <div className="marketing-footer-main">
            <div className="marketing-footer-brand">
              <Link href="/" className="marketing-brand">
                <span className="marketing-brand-mark">Z</span>
                <span>
                  <strong>zetheta</strong>
                  <small>FINANCIAL INTELLIGENCE</small>
                </span>
              </Link>
              <p>
                A focused workspace for AI-powered financial research and
                evidence-backed analysis.
              </p>
            </div>

            <div className="marketing-footer-column">
              <strong>Platform</strong>
              <a href="#products">Products</a>
              <a href="#how-it-works">How it works</a>
              <Link href="/dashboard">Research workspace</Link>
            </div>

            <div className="marketing-footer-column">
              <strong>Account</strong>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
              >
                Create account
              </button>
            </div>
          </div>

          <div className="marketing-footer-bottom">
            <span>© 2026 Zetheta. All rights reserved.</span>
            <span>Financial research only. Not investment advice.</span>
          </div>
        </div>
      </footer>

      {authMode && (
        <AuthPanel
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setProfileOpen(false);
            setProfileInfoOpen(false);
          }}
        />
      )}
    </main>
  );
}
