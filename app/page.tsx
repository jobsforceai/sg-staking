import Image from "next/image";
import { MotionEffects } from "./MotionEffects";
import { SgcPriceCard } from "./SgcPriceCard";

const SGCHAIN_URL = "https://sgchain.sgxmeta.ai/";

const journey = [
  ["01", "Activate", "Redeem a valid coupon or submit a supported crypto deposit."],
  ["02", "Verify", "Coupon stakes activate directly; deposit proofs enter administrator review."],
  ["03", "Accrue", "Your dashboard tracks interest through each 30-day cycle."],
  ["04", "Request", "Choose an eligible cash or USDT interest-withdrawal route."],
  ["05", "Review", "Follow the request from pending review to its final status."],
];

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
      <MotionEffects />
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

      <section className="journey-section" id="journey">
        <div className="shell">
          <div className="section-heading landing-heading">
            <div><span className="kicker">AFTER YOU JOIN</span><h2>One position.<br/>Every step visible.</h2></div>
            <p>From activation through an eligible interest withdrawal, your Sagenex Staking account keeps the full journey in one clear timeline.</p>
          </div>
          <div className="journey-track">
            <div className="journey-line" aria-hidden="true" />
            {journey.map(([number, title, copy]) => (
              <article className="journey-step" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="shell">
          <div className="section-heading">
            <div><span className="kicker">CHOOSE YOUR ENTRY POINT</span><h2>Pick the route that fits.</h2></div>
            <p>Start with where your funds are today. Each route follows four clear actions from entry to confirmation.</p>
          </div>

          <div className="route-map">
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

      <section className="dashboard-preview-section">
        <div className="shell dashboard-preview-grid">
          <div className="preview-copy">
            <span className="kicker">YOUR MEMBER DASHBOARD</span>
            <h2>Clarity after every activation.</h2>
            <p>See your staked value, SGC position, accrued interest, eligible withdrawal balance, and review history without switching between systems.</p>
            <ul>
              <li><span>✓</span> Live totals returned by your authenticated account</li>
              <li><span>✓</span> Cash and USDT availability shown separately</li>
              <li><span>✓</span> Stake and withdrawal status history</li>
            </ul>
            <a className="button button-primary" href="/signup">Create an account <ArrowIcon /></a>
          </div>
          <div className="dashboard-mock" aria-label="Illustration of the Sagenex Staking dashboard">
            <div className="mock-top"><div><span className="mock-logo">S</span><b>Portfolio overview</b></div><span className="mock-live">LIVE ACCOUNT DATA</span></div>
            <div className="mock-metrics">
              <div className="mock-primary"><small>TOTAL STAKED</small><strong>$—</strong><span>— SGC</span><em>Principal locked</em></div>
              <div><small>INTEREST ACCRUED</small><strong>$—</strong><span>Updated by cycle</span></div>
              <div><small>WITHDRAWABLE</small><strong>$—</strong><span>Eligible interest only</span></div>
            </div>
            <div className="mock-history">
              <div className="mock-history-head"><b>Recent activity</b><small>ILLUSTRATIVE STATUS PREVIEW</small></div>
              <div><span className="mock-source">SG</span><p><b>Coupon stake</b><small>SGChain · Stake activation</small></p><em className="mock-status active">Active</em></div>
              <div><span className="mock-source crypto">₮</span><p><b>Crypto deposit</b><small>USDT · Proof submitted</small></p><em className="mock-status pending">Pending review</em></div>
              <div><span className="mock-source cash">$</span><p><b>Interest withdrawal</b><small>Cash · Administrator review</small></p><em className="mock-status approved">Approved</em></div>
            </div>
          </div>
        </div>
      </section>

      <section className="policy-section">
        <div className="shell policy-grid">
          <div className="policy-statement"><span className="kicker">INTEREST POLICY</span><h2><span>3%</span> every<br/>30 days.</h2><p>Simple policy visibility inside your dashboard. Actual account values and eligibility are returned by the staking backend.</p></div>
          <div className="policy-rules">
            <article><span>01</span><div><h3>Principal stays locked</h3><p>Your original staked principal is not available for withdrawal.</p></div></article>
            <article><span>02</span><div><h3>Interest is tracked separately</h3><p>Accrued, locked, and currently withdrawable interest appear as separate totals.</p></div></article>
            <article><span>03</span><div><h3>Eligibility comes first</h3><p>Available methods depend on the source of the stake and current account eligibility.</p></div></article>
            <article><span>04</span><div><h3>Every payout is reviewed</h3><p>Withdrawal requests remain pending until the administrator completes the review.</p></div></article>
          </div>
        </div>
      </section>

      <section className="withdrawal-section">
        <div className="shell">
          <div className="section-heading landing-heading">
            <div><span className="kicker">ELIGIBLE INTEREST WITHDRAWALS</span><h2>Two routes.<br/>One review trail.</h2></div>
            <p>The dashboard calculates what is available for each method. Users can never request more than their eligible interest balance.</p>
          </div>
          <div className="withdrawal-cards">
            <article><div className="withdrawal-symbol">$</div><small>OFFLINE ROUTE</small><h3>Cash withdrawal</h3><p>Request eligible interest as cash. This is the only route available to offline or cash-origin stakes.</p><div><span>Submit amount</span><b>→</b><span>Admin review</span><b>→</b><span>Status update</span></div></article>
            <article><div className="withdrawal-symbol">₮</div><small>ONLINE ROUTE</small><h3>USDT withdrawal</h3><p>Eligible online or crypto-derived interest may be requested to a supplied USDT wallet address.</p><div><span>Add wallet</span><b>→</b><span>Admin review</span><b>→</b><span>Status update</span></div></article>
          </div>
        </div>
      </section>

      <section className="trust-process-section">
        <div className="shell trust-process-grid">
          <div><span className="kicker">BUILT AROUND VERIFICATION</span><h2>Nothing important disappears into a black box.</h2></div>
          <ol>
            <li><span>01</span><p><b>Authenticated account</b>Your staking activity belongs to your signed-in profile.</p></li>
            <li><span>02</span><p><b>Proof verification</b>Crypto payment files are checked before activation.</p></li>
            <li><span>03</span><p><b>Recorded activation</b>Every approved position appears in stake history.</p></li>
            <li><span>04</span><p><b>Withdrawal review</b>Every request keeps a visible status and decision trail.</p></li>
          </ol>
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

      <section className="final-cta-section">
        <div className="shell final-cta-inner">
          <div><span className="kicker">SAGENEX STAKING</span><h2>Your SGCOIN position,<br/><em>clearly tracked.</em></h2></div>
          <div><p>Create your member account to activate stakes, monitor cycles, and manage eligible interest withdrawals.</p><div><a className="button final-primary" href="/signup">Create staking account <ArrowIcon /></a><a className="final-link" href="/login">Sign in to dashboard ↗</a></div></div>
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
