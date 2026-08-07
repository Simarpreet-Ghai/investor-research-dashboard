import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const sectors = [
  'Technology',
  'Healthcare',
  'Energy',
  'Financial Services',
  'Industrials',
  'Mining',
];

const regions = [
  'Ontario',
  'British Columbia',
  'Alberta',
  'Quebec',
  'New York',
  'California',
  'Texas',
  'Illinois',
];

const statuses = ['New', 'Contacted', 'Qualified', 'Not a Fit'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function App() {
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [qualification, setQualification] = useState(null);
  const [criteria, setCriteria] = useState({
    sector: 'Technology',
    region: 'Ontario',
    desiredInvestment: 500000,
  });

  useEffect(() => {
    async function loadInvestors() {
      setLoading(true);
      setMessage('');

      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (sectorFilter) query.set('sector', sectorFilter);
      if (regionFilter) query.set('region', regionFilter);

      try {
        const response = await fetch(`${API_URL}/investors?${query}`);
        if (!response.ok) throw new Error('Could not load investors.');

        const data = await response.json();
        setInvestors(data);

        if (data.length === 0) {
          setSelectedInvestor(null);
        } else if (!data.some((investor) => investor.id === selectedInvestor?.id)) {
          setSelectedInvestor(data[0]);
        }
      } catch (error) {
        setMessage(`${error.message} Make sure the Express server is running.`);
      } finally {
        setLoading(false);
      }
    }

    loadInvestors();
  }, [search, sectorFilter, regionFilter]);

  useEffect(() => {
    if (!selectedInvestor) return;

    setCriteria({
      sector: selectedInvestor.sector,
      region: selectedInvestor.region,
      desiredInvestment: selectedInvestor.min_investment,
    });
    setQualification(null);
  }, [selectedInvestor?.id]);

  async function selectInvestor(id) {
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/investors/${id}`);
      if (!response.ok) throw new Error('Could not load this profile.');
      setSelectedInvestor(await response.json());
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(status) {
    if (!selectedInvestor) return;

    try {
      const response = await fetch(`${API_URL}/investors/${selectedInvestor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Could not update status.');

      const updatedInvestor = await response.json();
      setSelectedInvestor(updatedInvestor);
      setInvestors((current) =>
        current.map((investor) =>
          investor.id === updatedInvestor.id ? updatedInvestor : investor,
        ),
      );
      setMessage('Status updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function evaluateMatch(event) {
    event.preventDefault();
    if (!selectedInvestor) return;

    setMessage('');
    setQualification(null);

    try {
      const response = await fetch(
        `${API_URL}/investors/${selectedInvestor.id}/qualify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not evaluate this match.');
      setQualification(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">IR</div>
        <div className="brand-copy">
          <span className="eyebrow">Research workspace</span>
          <h1>Investor Qualification</h1>
        </div>
        <div className="simulation-label">
          <span className="pulse-dot" /> Simulated data
        </div>
      </header>

      <main className="dashboard">
        <section className="intro-card">
          <div>
            <span className="eyebrow">Investor pipeline</span>
            <h2>Find the right investment fit.</h2>
            <p>
              Search 500 fictional profiles, review their mandate, and run a
              transparent three-rule qualification check.
            </p>
          </div>
          <div className="summary-grid" aria-label="Dataset summary">
            <div><strong>500</strong><span>profiles</span></div>
            <div><strong>6</strong><span>sectors</span></div>
            <div><strong>3</strong><span>match rules</span></div>
          </div>
        </section>

        {message && <div className="notice" role="status">{message}</div>}

        <section className="workspace">
          <aside className="filter-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Discover</span>
                <h2>Investor directory</h2>
              </div>
              <span className="result-count">{investors.length}</span>
            </div>

            <label className="field search-field">
              <span>Search by name</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try Investor 042"
              />
            </label>

            <div className="filter-row">
              <label className="field">
                <span>Sector</span>
                <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
                  <option value="">All sectors</option>
                  {sectors.map((sector) => <option key={sector}>{sector}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Region</span>
                <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
                  <option value="">All regions</option>
                  {regions.map((region) => <option key={region}>{region}</option>)}
                </select>
              </label>
            </div>

            <div className="investor-list">
              {loading && <p className="empty-state">Loading profiles…</p>}
              {!loading && investors.length === 0 && (
                <p className="empty-state">No investors match these filters.</p>
              )}
              {investors.map((investor) => (
                <button
                  className={`investor-row ${selectedInvestor?.id === investor.id ? 'active' : ''}`}
                  key={investor.id}
                  onClick={() => selectInvestor(investor.id)}
                >
                  <span className="avatar">{String(investor.id).padStart(3, '0')}</span>
                  <span className="investor-row-copy">
                    <strong>{investor.name}</strong>
                    <span>{investor.sector} · {investor.region}</span>
                  </span>
                  <span className={`status-pill status-${investor.status.toLowerCase().replaceAll(' ', '-')}`}>
                    {investor.status}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="detail-panel">
            {!selectedInvestor ? (
              <div className="empty-detail">
                <span>IR</span>
                <h2>Select an investor</h2>
                <p>Choose a profile from the directory to review and qualify it.</p>
              </div>
            ) : (
              <>
                <div className="profile-header">
                  <div>
                    <span className="eyebrow">Profile #{String(selectedInvestor.id).padStart(3, '0')}</span>
                    <h2>{selectedInvestor.name}</h2>
                    <a href={`mailto:${selectedInvestor.email}`}>{selectedInvestor.email}</a>
                  </div>
                  <label className="status-control">
                    <span>Pipeline status</span>
                    <select value={selectedInvestor.status} onChange={(event) => updateStatus(event.target.value)}>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                </div>

                <div className="profile-facts">
                  <div><span>Sector focus</span><strong>{selectedInvestor.sector}</strong></div>
                  <div><span>Region</span><strong>{selectedInvestor.region}</strong></div>
                  <div className="range-fact">
                    <span>Investment range</span>
                    <strong>
                      {formatCurrency(selectedInvestor.min_investment)} – {formatCurrency(selectedInvestor.max_investment)}
                    </strong>
                  </div>
                </div>

                <div className="qualification-card">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">Rule-based check</span>
                      <h2>Evaluate company fit</h2>
                    </div>
                    <span className="rule-badge">No AI</span>
                  </div>

                  <form onSubmit={evaluateMatch}>
                    <div className="form-grid">
                      <label className="field">
                        <span>Company sector</span>
                        <select
                          value={criteria.sector}
                          onChange={(event) => setCriteria({ ...criteria, sector: event.target.value })}
                        >
                          {sectors.map((sector) => <option key={sector}>{sector}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        <span>Company region</span>
                        <select
                          value={criteria.region}
                          onChange={(event) => setCriteria({ ...criteria, region: event.target.value })}
                        >
                          {regions.map((region) => <option key={region}>{region}</option>)}
                        </select>
                      </label>
                      <label className="field amount-field">
                        <span>Desired investment (CAD)</span>
                        <input
                          type="number"
                          min="1"
                          step="10000"
                          value={criteria.desiredInvestment}
                          onChange={(event) => setCriteria({ ...criteria, desiredInvestment: event.target.value })}
                          required
                        />
                      </label>
                    </div>
                    <button className="primary-button" type="submit">Run qualification</button>
                  </form>

                  {qualification && (
                    <div className={`qualification-result ${qualification.result === 'QUALIFIED' ? 'qualified' : 'not-qualified'}`}>
                      <div>
                        <span className="eyebrow">Result</span>
                        <strong>{qualification.result}</strong>
                      </div>
                      <ul>
                        <li className={qualification.checks.sector ? 'pass' : 'fail'}>Sector</li>
                        <li className={qualification.checks.region ? 'pass' : 'fail'}>Region</li>
                        <li className={qualification.checks.investmentRange ? 'pass' : 'fail'}>Investment range</li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
