const CITY_DATA = [
  { city: "Lisbon", country: "Portugal", rent: 1350, food: 430, transport: 70, insurance: 160, coworking: 140, taxRate: 0.26, visaIncome: 3000 },
  { city: "Porto", country: "Portugal", rent: 980, food: 370, transport: 55, insurance: 150, coworking: 120, taxRate: 0.24, visaIncome: 2600 },
  { city: "Barcelona", country: "Spain", rent: 1600, food: 460, transport: 70, insurance: 180, coworking: 180, taxRate: 0.28, visaIncome: 3200 },
  { city: "Valencia", country: "Spain", rent: 1150, food: 390, transport: 55, insurance: 165, coworking: 140, taxRate: 0.25, visaIncome: 2800 },
  { city: "Madrid", country: "Spain", rent: 1750, food: 470, transport: 65, insurance: 190, coworking: 180, taxRate: 0.3, visaIncome: 3500 },
  { city: "Berlin", country: "Germany", rent: 1750, food: 470, transport: 95, insurance: 230, coworking: 190, taxRate: 0.29, visaIncome: 3600 },
  { city: "Munich", country: "Germany", rent: 2050, food: 490, transport: 90, insurance: 240, coworking: 210, taxRate: 0.31, visaIncome: 3900 },
  { city: "Amsterdam", country: "Netherlands", rent: 2100, food: 520, transport: 110, insurance: 250, coworking: 210, taxRate: 0.33, visaIncome: 4200 },
  { city: "Dublin", country: "Ireland", rent: 2200, food: 530, transport: 120, insurance: 240, coworking: 210, taxRate: 0.34, visaIncome: 4300 },
  { city: "London", country: "UK", rent: 2600, food: 600, transport: 180, insurance: 260, coworking: 240, taxRate: 0.35, visaIncome: 5200 },
  { city: "Prague", country: "Czech Republic", rent: 1050, food: 360, transport: 45, insurance: 130, coworking: 120, taxRate: 0.22, visaIncome: 2400 },
  { city: "Budapest", country: "Hungary", rent: 930, food: 340, transport: 40, insurance: 120, coworking: 110, taxRate: 0.21, visaIncome: 2200 },
  { city: "Warsaw", country: "Poland", rent: 980, food: 350, transport: 45, insurance: 130, coworking: 120, taxRate: 0.21, visaIncome: 2300 },
  { city: "Tallinn", country: "Estonia", rent: 1200, food: 380, transport: 50, insurance: 140, coworking: 130, taxRate: 0.22, visaIncome: 2500 },
  { city: "Athens", country: "Greece", rent: 990, food: 350, transport: 45, insurance: 135, coworking: 110, taxRate: 0.22, visaIncome: 2300 },
  { city: "Mexico City", country: "Mexico", rent: 1200, food: 340, transport: 45, insurance: 130, coworking: 120, taxRate: 0.24, visaIncome: 2400 },
  { city: "Buenos Aires", country: "Argentina", rent: 900, food: 310, transport: 35, insurance: 110, coworking: 90, taxRate: 0.2, visaIncome: 2000 },
  { city: "Sao Paulo", country: "Brazil", rent: 1300, food: 380, transport: 70, insurance: 160, coworking: 130, taxRate: 0.26, visaIncome: 2600 },
  { city: "Toronto", country: "Canada", rent: 2050, food: 540, transport: 120, insurance: 240, coworking: 200, taxRate: 0.3, visaIncome: 4200 },
  { city: "Singapore", country: "Singapore", rent: 2400, food: 500, transport: 110, insurance: 220, coworking: 220, taxRate: 0.2, visaIncome: 4500 }
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Spain", "Portugal", "Brazil", "Mexico", "Argentina",
  "India", "Australia", "Netherlands", "Ireland", "Italy", "Poland", "South Africa", "Japan", "South Korea", "Singapore"
];

const FACTORS = {
  lifestyle: { Basic: 0.88, Standard: 1, Comfortable: 1.18 },
  housing: { Shared: 0.8, Studio: 1, "1BR": 1.2 },
  movingType: { Alone: 1, Partner: 1.32, Family: 1.7 }
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const form = document.getElementById("smart-form");
const reportNode = document.getElementById("report");
const helpNode = document.getElementById("help-accordion");
const resetBtn = document.getElementById("reset-btn");
const originCountrySelect = form.elements.originCountry;
const citySelect = form.elements.targetCity;

let lastReport = null;

function bootstrapOptions() {
  originCountrySelect.innerHTML += COUNTRIES.map((country) => `<option>${country}</option>`).join("");
  citySelect.innerHTML = CITY_DATA.map(({ city, country }) => `<option>${city}, ${country}</option>`).join("");
  citySelect.selectedIndex = 0;
}

function parseCity(value) {
  const cityName = value.split(",")[0].trim();
  return CITY_DATA.find((entry) => entry.city === cityName) || CITY_DATA[0];
}

function validateField(field) {
  const value = String(field.value || "").trim();
  const wrapper = field.closest(".field");
  const error = wrapper?.querySelector(".error");
  let message = "";

  if (!value) message = "This field is required.";
  if ((field.name === "income" || field.name === "savings") && Number(value) < 0) {
    message = "Value must be zero or greater.";
  }
  if (field.name === "income" && Number(value) === 0) {
    message = "Monthly income must be greater than zero.";
  }

  if (wrapper) wrapper.classList.toggle("invalid", Boolean(message));
  if (error) error.textContent = message;
  return !message;
}

function validateForm() {
  return Array.from(form.elements)
    .filter((field) => field.matches?.("input, select"))
    .every((field) => validateField(field));
}

function computeReport(input) {
  const city = parseCity(input.targetCity);
  const lifestyleFactor = FACTORS.lifestyle[input.lifestyle];
  const housingFactor = FACTORS.housing[input.housing];
  const householdFactor = FACTORS.movingType[input.movingType];

  const monthlyCosts = {
    rent: city.rent * housingFactor * householdFactor,
    food: city.food * lifestyleFactor * householdFactor,
    transport: city.transport * householdFactor,
    insurance: city.insurance * householdFactor,
    coworking: city.coworking
  };

  const grossIncome = Number(input.income);
  const tax = grossIncome * city.taxRate;
  const totalCosts = Object.values(monthlyCosts).reduce((sum, value) => sum + value, 0);
  const net = grossIncome - tax - totalCosts;
  const runwayMonths = net < 0 ? Number(input.savings) / Math.abs(net) : Infinity;

  const emergencyTargetMonths = input.risk === "Conservative" ? 8 : input.risk === "Balanced" ? 6 : 4;
  const emergencyFundTarget = totalCosts * emergencyTargetMonths;

  const scenarios = [
    { label: "Income -20%", income: grossIncome * 0.8, extraRent: 0 },
    { label: "Rent +15%", income: grossIncome, extraRent: monthlyCosts.rent * 0.15 },
    { label: "Both", income: grossIncome * 0.8, extraRent: monthlyCosts.rent * 0.15 }
  ].map((scenario) => {
    const scenarioTax = scenario.income * city.taxRate;
    const scenarioNet = scenario.income - scenarioTax - (totalCosts + scenario.extraRent);
    const scenarioRunway = scenarioNet < 0 ? Number(input.savings) / Math.abs(scenarioNet) : Infinity;
    return { ...scenario, net: scenarioNet, runway: scenarioRunway };
  });

  const visaPass = grossIncome >= city.visaIncome;

  const timelinePenalty = { "1–3 months": 8, "3–6 months": 4, "6–12 months": 0 }[input.timeline];
  const riskPenalty = { Conservative: 0, Balanced: 4, Aggressive: 8 }[input.risk];
  const netScore = Math.max(0, Math.min(45, ((net + 1800) / 3600) * 45));
  const savingsScore = Math.max(0, Math.min(25, (Number(input.savings) / emergencyFundTarget) * 25));
  const visaScore = visaPass ? 20 : 6;
  const readinessScore = Math.round(Math.max(0, Math.min(100, netScore + savingsScore + visaScore - timelinePenalty - riskPenalty)));

  const alternatives = CITY_DATA
    .filter((entry) => entry.city !== city.city)
    .map((entry) => {
      const altCosts = (entry.rent * housingFactor * householdFactor) +
        (entry.food * lifestyleFactor * householdFactor) +
        (entry.transport * householdFactor) +
        (entry.insurance * householdFactor) +
        entry.coworking;
      return { city: `${entry.city}, ${entry.country}`, delta: totalCosts - altCosts };
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 2);

  const verdict = net >= 500 && visaPass ? "Strong" : net >= 0 && visaPass ? "Borderline" : "High Risk";

  return {
    input,
    city,
    monthlyCosts,
    grossIncome,
    tax,
    totalCosts,
    net,
    runwayMonths,
    emergencyFundTarget,
    scenarios,
    visaPass,
    readinessScore,
    alternatives,
    verdict
  };
}

function verdictClass(verdict) {
  if (verdict === "Strong") return "good";
  if (verdict === "Borderline") return "warn";
  return "bad";
}

function formatRunway(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} months` : "Stable";
}

function generateRecommendations(report) {
  const recommendations = [];
  const { input, net, runwayMonths, emergencyFundTarget, totalCosts } = report;

  if (net < 0) {
    recommendations.push("Reduce initial housing tier by one step for the first 90 days to stop monthly deficit burn.");
  } else {
    recommendations.push("Keep fixed costs below 70% of post-tax income to preserve optionality after the move.");
  }

  if (input.movingType === "Family") recommendations.push("Pre-qualify family housing and healthcare providers before signing a lease.");
  if (input.timeline === "1–3 months") recommendations.push("Compress planning into a weekly checklist and secure visa documents immediately.");
  if (input.risk === "Conservative") recommendations.push("Do not relocate until emergency savings are at or above the full target buffer.");
  if (input.housing === "1BR") recommendations.push("Negotiate lease incentives and cap furnished upgrades to protect early cashflow.");

  recommendations.push(`Build an emergency fund target of ${usd.format(emergencyFundTarget)} (${Math.round(emergencyFundTarget / totalCosts)} months of costs).`);
  recommendations.push(`Set a no-go threshold: if runway drops below ${input.risk === "Aggressive" ? 3 : 5} months, pause relocation commitments.`);

  if (runwayMonths < 6 && Number.isFinite(runwayMonths)) {
    recommendations.push("Create a contingency income channel before departure to reduce downside in stress scenarios.");
  }

  if (recommendations.length < 5) {
    recommendations.push("Complete a 30-day trial budget using target-city pricing before making irreversible commitments.");
  }

  return recommendations.slice(0, 8);
}

function renderReport(report) {
  const keyBullets = [
    `Projected monthly ${report.net >= 0 ? "surplus" : "deficit"}: ${usd.format(report.net)}.`,
    `Readiness score: ${report.readinessScore}/100 with a ${report.input.timeline} timeline.`,
    `${report.visaPass ? "Visa income threshold met" : "Visa income threshold not met"} for ${report.city.city}.`
  ];

  const bottomLine = report.verdict === "Strong"
    ? "Bottom line: financially feasible now, with disciplined budget controls."
    : report.verdict === "Borderline"
      ? "Bottom line: feasible with preparation and tighter cost management before moving."
      : "Bottom line: defer relocation until income stability or savings buffer improves.";

  const recommendations = generateRecommendations(report);

  reportNode.innerHTML = `
    <h2>Relocation decision memo</h2>
    <p class="muted">Target: ${report.city.city}, ${report.city.country}</p>

    <section class="report-section section-reveal">
      <h3>A) Executive Summary</h3>
      <span class="badge ${verdictClass(report.verdict)}">Verdict: ${report.verdict}</span>
      <ul>${keyBullets.map((line) => `<li>${line}</li>`).join("")}</ul>
      <p><strong>${bottomLine}</strong></p>
    </section>

    <section class="report-section section-reveal">
      <h3>B) Cost & Cashflow</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Estimated monthly cost</th></tr></thead>
          <tbody>
            <tr><td>Rent</td><td>${usd.format(report.monthlyCosts.rent)}</td></tr>
            <tr><td>Food</td><td>${usd.format(report.monthlyCosts.food)}</td></tr>
            <tr><td>Transport</td><td>${usd.format(report.monthlyCosts.transport)}</td></tr>
            <tr><td>Insurance</td><td>${usd.format(report.monthlyCosts.insurance)}</td></tr>
            <tr><td>Coworking</td><td>${usd.format(report.monthlyCosts.coworking)}</td></tr>
            <tr><td><strong>Total living costs</strong></td><td><strong>${usd.format(report.totalCosts)}</strong></td></tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>Estimated tax: ${usd.format(report.tax)} (${Math.round(report.city.taxRate * 100)}%).</li>
        <li>Net monthly result: ${usd.format(report.net)} (${report.net >= 0 ? "surplus" : "deficit"}).</li>
        <li>${report.net >= 0 ? "Cashflow is positive; focus on preserving margin." : "Cashflow is negative; reduce fixed costs before relocating."}</li>
      </ul>
    </section>

    <section class="report-section section-reveal">
      <h3>C) Runway & Safety Buffer</h3>
      <div class="key-value">
        <div class="metric"><p>Runway</p><strong>${formatRunway(report.runwayMonths)}</strong></div>
        <div class="metric"><p>Emergency fund target</p><strong>${usd.format(report.emergencyFundTarget)}</strong></div>
      </div>
    </section>

    <section class="report-section section-reveal">
      <h3>D) Stress Test</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Scenario</th><th>Net after costs</th><th>Runway</th></tr></thead>
          <tbody>
            ${report.scenarios.map((s) => `<tr><td>${s.label}</td><td>${usd.format(s.net)}</td><td>${formatRunway(s.runway)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="report-section section-reveal">
      <h3>E) Visa Fit</h3>
      <ul>
        <li>Required monthly income: ${usd.format(report.city.visaIncome)}.</li>
        <li>Your monthly income: ${usd.format(report.grossIncome)} (${report.visaPass ? "Pass" : "Fail"}).</li>
        <li>Practical note: keep 6+ months of statements and tax records ready for application review.</li>
      </ul>
    </section>

    <section class="report-section section-reveal">
      <h3>F) Readiness Score</h3>
      <div class="readiness">
        <p><strong>${report.readinessScore}/100</strong></p>
        <div class="meter"><span style="width: ${report.readinessScore}%;"></span></div>
        <p class="muted">Score combines cashflow margin, savings buffer, visa fit, and timeline risk.</p>
      </div>
    </section>

    <section class="report-section section-reveal">
      <h3>G) Recommendations</h3>
      <ul>${recommendations.map((item) => `<li>${item}</li>`).join("")}</ul>
    </section>

    <section class="report-section section-reveal">
      <h3>H) Alternatives</h3>
      <ul>
        ${report.alternatives.map((alt) => `<li>${alt.city}: ${usd.format(alt.delta)} lower estimated monthly spend.</li>`).join("")}
      </ul>
    </section>
  `;
}

function helpAnswer(question, report) {
  const cushionIncome = report.totalCosts / (1 - report.city.taxRate) + 700;
  const biggestRisk = report.net < 0 ? "persistent monthly deficit" : "insufficient savings buffer under downside scenarios";

  const map = {
    "Explain my verdict": `Your verdict is ${report.verdict}. It is driven by a projected ${report.net >= 0 ? "surplus" : "deficit"} of ${usd.format(report.net)} and visa fit status of ${report.visaPass ? "pass" : "fail"}.`,
    "How can I reduce costs quickly?": `Reduce housing one tier, cap discretionary spending, and avoid premium neighborhood leases in the first 90 days. Estimated fixed-cost base is ${usd.format(report.totalCosts)}.`,
    "What runway should I aim for?": `Target at least ${report.input.risk === "Aggressive" ? "4" : report.input.risk === "Balanced" ? "6" : "8"} months of expenses. Your current modeled runway is ${formatRunway(report.runwayMonths)}.`,
    "What’s my biggest risk?": `Your biggest risk is ${biggestRisk}. Stress scenarios show downside net values as low as ${usd.format(Math.min(...report.scenarios.map((s) => s.net)))}.`,
    "Do I meet visa requirements?": `${report.visaPass ? "Yes" : "No"}. Required income is ${usd.format(report.city.visaIncome)} and your input income is ${usd.format(report.grossIncome)}.`,
    "What income target makes this comfortable?": `A more comfortable threshold is approximately ${usd.format(cushionIncome)} monthly to maintain surplus plus contingency room.`,
    "Should I wait or move now?": `${report.verdict === "Strong" ? "Move now with disciplined execution." : report.verdict === "Borderline" ? "Wait briefly to improve buffer, then move." : "Wait and strengthen income/savings before committing."}`,
    "Give me a 30-day plan": "Week 1: collect documentation and reset budget. Week 2: shortlist housing + legal tasks. Week 3: stress-test income and savings assumptions. Week 4: finalize go/no-go decision.",
    "How should I sequence housing decisions?": "Start with flexible 1-3 month housing, validate actual spend, then commit to longer lease after cashflow proves stable.",
    "What should I prioritize before departure?": "Prioritize visa paperwork, emergency fund completion, and a pre-approved budget with clear stop-loss thresholds."
  };

  return map[question];
}

function renderHelp(report) {
  const questions = [
    "Explain my verdict",
    "How can I reduce costs quickly?",
    "What runway should I aim for?",
    "What’s my biggest risk?",
    "Do I meet visa requirements?",
    "What income target makes this comfortable?",
    "Should I wait or move now?",
    "Give me a 30-day plan",
    "How should I sequence housing decisions?",
    "What should I prioritize before departure?"
  ];

  helpNode.innerHTML = questions
    .map((question) => `
      <details>
        <summary>${question}</summary>
        <p>${helpAnswer(question, report)}</p>
      </details>
    `)
    .join("");
}

function getFormInput() {
  return Object.fromEntries(new FormData(form).entries());
}

function runAnalysis() {
  if (!validateForm()) return;

  const input = getFormInput();
  const report = computeReport(input);
  lastReport = report;
  renderReport(report);
  renderHelp(report);
  reportNode.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runAnalysis();
});

form.addEventListener("input", (event) => {
  if (event.target.matches("input, select")) validateField(event.target);
});

resetBtn.addEventListener("click", () => {
  form.reset();
  citySelect.selectedIndex = 0;
  Array.from(form.elements).forEach((field) => {
    if (field.matches?.("input, select")) validateField(field);
  });

  reportNode.innerHTML = `
    <h2>Your report will appear here</h2>
    <p class="muted">Complete the form to generate your relocation decision memo.</p>
  `;

  helpNode.innerHTML = "";
  lastReport = null;
});

bootstrapOptions();
