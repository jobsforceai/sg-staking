import Image from "next/image";
import { SgcPriceCard } from "./SgcPriceCard";

const SGCHAIN_URL = "https://sgchain.sgxmeta.ai/";

const routes = [
  {
    id: "sagenex",
    number: "01",
    eyebrow: "FROM YOUR SAGENEX BALANCE",
    title: "Sagenex transfer",
    summary: "Move available Sagenex wallet value into SGChain with a short-lived transfer code.",
    status: "Temporarily paused",
    statusTone: "paused",
    icon: "wallet",
    steps: [
      ["Open Wallet", "Sign in to Sagenex and check your available balance."],
      ["Enter amount", "Choose Transfer to SGChain and enter an amount within your balance."],
      ["Get a code", "Sagenex creates a secure transfer code valid for five minutes."],
      ["Redeem on SGChain", "Paste the code in SGChain; redemption debits Sagenex and posts the transfer."],
    ],
    note: "The backend route exists, but the user-dashboard panels were hidden by team directive on 1 June 2026.",
  },
  {
    id: "assisted",
    number: "02",
    eyebrow: "COLLECTOR + SUPER ADMIN",
    title: "Offline assisted",
    summary: "Pay through an authorized collector and let the operations team record and verify your deposit.",
    status: "Manual review",
    statusTone: "review",
    icon: "shield",
    steps: [
      ["Share User ID", "Give the collector the Sagenex user ID that should receive the activation."],
      ["Pay offline", "Use cash, UPI, or bank transfer and retain the reference or payment proof."],
      ["Collector records", "The collector submits INR amount, method, reference, proof, and plan data."],
      ["Admin verifies", "A super admin reviews the pending record, selects the ROI plan, and approves or rejects it."],
    ],
    note: "Approval posts a Sagenex package activation. The current repositories do not show this step directly crediting SGCOIN.",
  },
  {
    id: "sgchain",
    number: "03",
    eyebrow: "BUY ON THE OFFICIAL PLATFORM",
    title: "Direct on SGChain",
    summary: "Create or access your SGChain account and complete the coin order directly on the platform.",
    status: "Direct route",
    statusTone: "live",
    icon: "coin",
    steps: [
      ["Create account", "Register or sign in at the official SGChain website."],
      ["Verify account", "Complete any identity or security checks shown for your account."],
      ["Choose Buy SGC", "Enter the amount and use a funding option available in your region."],
      ["Review & confirm", "Check the quote, fees, and final amount before confirming the order."],
    ],
    note: "After the order is confirmed, track the SGC balance and transaction status inside your SGChain wallet.",
  },
];

function Icon({ name }: { name: string }) {
  if (name === "user") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 19c.7-3.4 3-5.1 6.5-5.1s5.8 1.7 6.5 5.1"/></svg>;
  }
  if (name === "shield") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.3c0 4.2-2.4 7.2-7 9.2-4.6-2-7-5-7-9.2V6l7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>;
  }
  if (name === "wallet") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9H5.5A1.5 1.5 0 0 1 4 16.5v-9Z"/><path d="M4.5 7.5 16 4v3.5M15 12h5v3h-5a1.5 1.5 0 1 1 0-3Z"/></svg>;
  }
  if (name === "coin") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M14.7 8.5h-4a2 2 0 0 0 0 4h2.6a2 2 0 1 1 0 4H9M12 6.5v11"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.4 5.1L18 6l-2.1 4.6L21 12l-5.1 1.4L18 18l-4.6-2.1L12 21l-1.4-5.1L6 18l2.1-4.6L3 12l5.1-1.4L6 6l4.6 2.1L12 3Z"/></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4"/></svg>;
}

export default function Home() {
  return (
    <main>
      <nav className="nav shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Sagenex home">
          <span className="brand-mark">
            <Image src="/sagenex-logo-transparent.png" alt="" width={64} height={64} priority />
          </span>
          <span className="brand-name">SAGENEX <b>STAKING</b></span>
        </a>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#why-sgc">Why SGC</a>
          <a href="#safety">Safety</a>
          <a href="/login">Sign in</a>
        </div>
        <a className="nav-cta" href="/dashboard">
          Dashboard <ArrowIcon />
        </a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> SGCHAIN · SGCOIN</div>
          <h1>Three paths.<br/><em>One clear journey.</em></h1>
          <p className="hero-lead">Choose the route that matches where your funds are today—from Sagenex, through an assisted offline deposit, or directly on SGChain.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/signup">Create staking account <ArrowIcon /></a>
            <a className="text-link" href={SGCHAIN_URL} target="_blank" rel="noreferrer">Go directly to SGChain <span>↗</span></a>
          </div>
          <div className="trust-row">
            <span><b>01</b> Sagenex transfer</span>
            <span><b>02</b> Offline assisted</span>
            <span><b>03</b> SGChain direct</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="SGC wallet preview">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="coin-stage">
            <Image
              src="/sgcoin-hero-transparent.png"
              alt="SGCOIN gold diamond coin with a green face and lightning emblem"
              width={1254}
              height={1254}
              className="sgcoin-image"
              priority
            />
          </div>
          <SgcPriceCard />
          <div className="status-pill status-one"><span><Icon name="shield" /></span><div><small>Account</small><b>Verified</b></div></div>
          <div className="status-pill status-two"><span><Icon name="spark" /></span><div><small>Order status</small><b>Confirmed</b></div></div>
        </div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="shell">
          <div className="section-heading">
            <div><span className="kicker">CHOOSE YOUR ENTRY POINT</span><h2>Three routes, mapped end to end.</h2></div>
            <p>Each path shows who acts, what gets verified, and exactly where the handoff occurs. Status labels reflect what is implemented in the current repositories.</p>
          </div>

          <div className="route-map">
            <div className="route-rail" aria-hidden="true"><span /><span /><span /></div>
            {routes.map((route) => (
              <article className={`route-card route-${route.id}`} key={route.id}>
                <header className="route-head">
                  <div className="route-title-wrap">
                    <span className="route-icon"><Icon name={route.icon} /></span>
                    <div><small>{route.eyebrow}</small><h3>{route.title}</h3></div>
                  </div>
                  <span className={`route-status ${route.statusTone}`}>{route.status}</span>
                </header>
                <p className="route-summary">{route.summary}</p>
                <ol className="route-steps">
                  {route.steps.map(([title, copy], index) => (
                    <li key={title}>
                      <span className="route-step-num">{String(index + 1).padStart(2, "0")}</span>
                      <div><b>{title}</b><p>{copy}</p></div>
                    </li>
                  ))}
                </ol>
                <div className="route-end">
                  <span>{route.number}</span>
                  <div className="route-end-line" />
                  <b>{route.id === "sgchain" ? "SGC visible in SGChain wallet" : route.id === "assisted" ? "Package activation posted" : "SGChain redeems transfer code"}</b>
                </div>
              </article>
            ))}
          </div>

          <div className="handoff">
            <div className="handoff-icon"><Icon name="coin" /></div>
            <div><small>FASTEST ACTIVE COIN ROUTE</small><h3>Buy directly on the official SGChain platform.</h3><p>Create an account or sign in, review the live options available to you, and confirm there.</p></div>
            <a className="button button-light" href={SGCHAIN_URL} target="_blank" rel="noreferrer">Open SGChain <ArrowIcon /></a>
          </div>
        </div>
      </section>

      <section className="why-section shell" id="why-sgc">
        <div className="why-intro">
          <span className="kicker">BUILT FOR UTILITY</span>
          <h2>One coin.<br/>A growing ecosystem.</h2>
          <p>SGC is the native digital asset used across SGChain’s wallet and financial products.</p>
        </div>
        <div className="benefit-grid">
          <article><span><Icon name="wallet" /></span><h3>Wallet-native</h3><p>Buy, hold, and view your balance from one SGChain account.</p></article>
          <article><span><Icon name="spark" /></span><h3>Designed for utility</h3><p>Built to move across SGChain products as the ecosystem expands.</p></article>
          <article><span><Icon name="shield" /></span><h3>Clear ownership</h3><p>Your confirmed SGC balance is shown directly inside your wallet.</p></article>
          <article><span><Icon name="coin" /></span><h3>Simple entry</h3><p>A guided order journey makes buying approachable for new users.</p></article>
        </div>
      </section>

      <section className="safety-section" id="safety">
        <div className="shell safety-grid">
          <div className="safety-title"><span className="kicker">BEFORE YOU BUY</span><h2>A 30-second safety check.</h2></div>
          <div className="checks">
            <div><span>01</span><p><b>Use the official website.</b> Check that the address begins with <code>sgchain.sgxmeta.ai</code>.</p></div>
            <div><span>02</span><p><b>Review the full quote.</b> Confirm the amount, rate, and any fee before placing your order.</p></div>
            <div><span>03</span><p><b>Never share credentials.</b> Sagenex will never ask for your password or verification code.</p></div>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="#top">
          <span className="brand-mark"><Image src="/sagenex-logo-transparent.png" alt="" width={64} height={64} /></span>
          <span className="brand-name">SAGENEX <b>STAKING</b></span>
        </a>
        <p>This guide explains the purchase journey. Availability, payment methods, pricing, and product eligibility are shown by SGChain and may vary.</p>
        <a href={SGCHAIN_URL} target="_blank" rel="noreferrer">sgchain.sgxmeta.ai ↗</a>
      </footer>
    </main>
  );
}
