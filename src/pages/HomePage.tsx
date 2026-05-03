import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

const featureCards = [
  {
    title: "Real-Time Synchronization",
    text: "Keep data, teams, and workflows in sync the moment anything changes.",
  },
  {
    title: "End-to-End Type Safety",
    text: "Protect frontend and backend contracts with predictable full-stack types.",
  },
  {
    title: "Cloud-Ready Infrastructure",
    text: "Deploy with confidence using architecture designed for scale and resilience.",
  },
  {
    title: "Intelligent Search & Filtering",
    text: "Surface what matters fast with precise search and context-aware filtering.",
  },
  {
    title: "Responsive & Fluid Design",
    text: "Deliver a fast, polished experience across mobile, tablet, and desktop.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$19",
    audience: "For solo builders",
    perks: ["1 project workspace", "Core synchronization", "Email support"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    audience: "For product teams",
    perks: ["Unlimited projects", "Advanced search", "Priority support"],
    featured: true,
  },
  {
    name: "Scale",
    price: "$99",
    audience: "For larger operations",
    perks: [
      "Cloud-ready deployment",
      "Custom roles",
      "Dedicated success support",
    ],
    featured: false,
  },
];

export default function HomePage() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="site-header">
        <nav className="navbar">
          <Link className="brand" to={ROUTES.home}>
            <span className="brand-mark">S</span>
            <span className="brand-name">Syntax</span>
          </Link>

          <div className="nav-actions">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#pricing" className="nav-link">
              Pricing
            </a>
            <Link to={ROUTES.login} className="button button-secondary">
              Login
            </Link>
            <Link to={ROUTES.register} className="button button-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero section-frame">
          <div className="hero-copy reveal">
            <p className="eyebrow">MERN stack foundation for modern products</p>
            <h1>
              Build fast. Sync instantly. Scale with clean full-stack structure.
            </h1>
            <p className="hero-text">
              Syntax gives your application a sharp launchpad with real-time
              behaviour, safer data contracts, and a polished interface built to
              move.
            </p>
            <div className="hero-actions">
              <Link to={ROUTES.register} className="button button-primary">
                Start Building
              </Link>
              <a href="#pricing" className="button button-secondary">
                View Pricing
              </a>
            </div>
          </div>

          <div className="hero-panel reveal reveal-delay">
            <div className="hero-orbit">
              <div className="pulse-ring pulse-ring-large" />
              <div className="pulse-ring pulse-ring-small" />
              <div className="core-panel">
                <span className="core-label">Live Stack Health</span>
                <strong>99.98%</strong>
                <p>
                  API, client, and database state stay aligned in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section-frame features-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Features</p>
            <h2>
              Capabilities designed to keep your application responsive and
              dependable.
            </h2>
          </div>

          <div className="feature-roller">
            <div className="feature-track">
              {[...featureCards, ...featureCards].map((feature, index) => (
                <article
                  className="feature-card"
                  key={`${feature.title}-${index}`}
                >
                  <span className="feature-index">
                    0{(index % featureCards.length) + 1}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="section-frame pricing-section">
          <div className="section-heading reveal">
            <p className="eyebrow">Pricing</p>
            <h2>Simple subscription tiers for launch, growth, and scale.</h2>
          </div>

          <div className="pricing-grid">
            {pricingTiers.map((tier) => (
              <article
                className={`price-card${tier.featured ? " featured" : ""}`}
                key={tier.name}
              >
                <p className="tier-name">{tier.name}</p>
                <div className="tier-price">
                  <span>{tier.price}</span>
                  <small>/month</small>
                </div>
                <p className="tier-audience">{tier.audience}</p>
                <ul className="perk-list">
                  {tier.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <Link
                  to={ROUTES.register}
                  className="button button-primary full-width"
                >
                  Choose {tier.name}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
