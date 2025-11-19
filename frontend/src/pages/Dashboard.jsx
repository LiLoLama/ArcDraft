import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

const initialFormState = {
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  projectTitle: '',
  projectDescription: '',
  budgetRange: '',
  tone: 'freundlich',
  language: 'de',
};

const curatedProducts = [
  {
    id: 'strategy-sprint',
    name: 'Strategie Sprint',
    description: '3-tägiger Workshop mit Workshops, Research & Priorisierung.',
    price: '€4.200',
  },
  {
    id: 'ai-rollout',
    name: 'AI Rollout Paket',
    description: 'Implementierung von 2–3 Automationen inkl. Training.',
    price: '€9.800',
  },
  {
    id: 'care-plan',
    name: 'Care & Success Plan',
    description: 'Monatliche Betreuung, Optimierungen und KPI Reviews.',
    price: '€2.200 / Monat',
  },
  {
    id: 'prototype',
    name: 'Interactive Prototype',
    description: 'Klickbares Konzept inkl. Copy, UI und Microcopy.',
    price: '€6.500',
  },
];

const fieldConfig = {
  clientName: { label: 'Ansprechpartner*in', placeholder: 'z. B. Alex Client' },
  clientCompany: { label: 'Unternehmen', placeholder: 'Client GmbH' },
  clientEmail: { label: 'E-Mail-Adresse', placeholder: 'alex@client.com', type: 'email' },
  projectTitle: { label: 'Projektüberschrift', placeholder: 'AI Sales Playbook' },
  projectDescription: {
    label: 'Projektbeschreibung',
    placeholder: 'Was soll mit dem Proposal erreicht werden?',
  },
  budgetRange: { label: 'Budgetrahmen (optional)', placeholder: 'z. B. 20.000 – 30.000 €' },
  tone: {
    label: 'Ton der Kommunikation',
    type: 'select',
    options: [
      { value: 'freundlich', label: 'Freundlich & optimistisch' },
      { value: 'bold', label: 'Mutig & visionär' },
      { value: 'formal', label: 'Seriös & strukturiert' },
    ],
  },
  language: {
    label: 'Sprache des Proposals',
    type: 'select',
    options: [
      { value: 'de', label: 'Deutsch' },
      { value: 'en', label: 'Englisch' },
    ],
  },
};

const fieldGroups = [
  { title: 'Kundendaten', description: 'Damit wir die Empfänger:innen persönlich ansprechen können.', fields: ['clientName', 'clientCompany', 'clientEmail'] },
  { title: 'Projektstory', description: 'Was ist das Ziel und warum ist es wichtig?', fields: ['projectTitle', 'projectDescription', 'budgetRange'] },
  { title: 'Ton & Sprache', description: 'Wie sollen wir klingen?', fields: ['tone', 'language'] },
];

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest('/api/analytics/overview', { token }).then(setMetrics);
    apiRequest('/api/proposals?status=sent', { token }).then((data) => setRecent(data.slice(-5)));
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Alle Proposal-Signale auf einen Blick.</p>
        </div>
        <button className="primary" onClick={() => setShowGenerator(true)}>
          Neues Proposal mit AI
        </button>
      </div>
      <div className="grid grid-4">
        <MetricCard label="Proposals" value={metrics?.proposalsTotal ?? '—'} />
        <MetricCard label="Signiert" value={metrics?.proposalsSigned ?? '—'} accent="green" />
        <MetricCard label="Conversion" value={`${metrics?.conversionRate ?? 0}%`} accent="cyan" />
        <MetricCard label="Views 30d" value={metrics?.viewsLast30Days ?? 0} accent="orange" />
      </div>
      <section>
        <h2>Zuletzt gesendete Proposals</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Kunde</th>
              <th>Status</th>
              <th>Letzte Aktivität</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((proposal) => (
              <tr key={proposal.id}>
                <td>{proposal.title}</td>
                <td>{proposal.recipient?.name}</td>
                <td>
                  <StatusBadge status={proposal.status} />
                </td>
                <td>{proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {showGenerator && <ProposalComposerModal onClose={() => setShowGenerator(false)} />}
    </div>
  );
}

function ProposalComposerModal({ onClose }) {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState(curatedProducts.slice(0, 2).map((p) => p.id));
  const [customProducts, setCustomProducts] = useState([]);
  const [customProductForm, setCustomProductForm] = useState({ name: '', description: '', price: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCustomProductChange = (e) => {
    setCustomProductForm({ ...customProductForm, [e.target.name]: e.target.value });
  };

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  };

  const availableProducts = [...curatedProducts, ...customProducts];
  const selectedProducts = availableProducts.filter((product) => selectedProductIds.includes(product.id));

  const handleAddCustomProduct = (e) => {
    e.preventDefault();
    if (!customProductForm.name) return;
    const newProduct = {
      id: `custom-${Date.now()}`,
      name: customProductForm.name,
      description: customProductForm.description,
      price: customProductForm.price || 'auf Anfrage',
      isCustom: true,
    };
    setCustomProducts((prev) => [...prev, newProduct]);
    setSelectedProductIds((prev) => [...prev, newProduct.id]);
    setCustomProductForm({ name: '', description: '', price: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = await apiRequest('/api/proposals/ai-generate', {
        method: 'POST',
        body: { ...form, products: selectedProducts },
        token,
      });
      setResult({ ...payload.proposal, selectedProducts });
      setForm(initialFormState);
      setCustomProducts([]);
      setSelectedProductIds(curatedProducts.slice(0, 2).map((p) => p.id));
    } catch (err) {
      setError(err.message || 'Etwas ist schiefgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="proposal-modal">
        <div className="modal-header">
          <div>
            <p className="tagline">Guided Proposal Flow</p>
            <h3>Erstelle in wenigen Klicks ein liebevoll gestaltetes Proposal</h3>
            <p className="muted">Wir übernehmen Struktur und Story – du bringst Kontext & Angebote mit.</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Schließen
          </button>
        </div>
        {!result ? (
          <form className="modal-content" onSubmit={handleSubmit}>
            {fieldGroups.map((group) => (
              <section key={group.title} className="modal-section">
                <div className="section-header">
                  <div>
                    <h4>{group.title}</h4>
                    <p className="muted">{group.description}</p>
                  </div>
                </div>
                <div className="modal-grid">
                  {group.fields.map((field) => {
                    const config = fieldConfig[field];
                    if (config.type === 'select') {
                      return (
                        <label key={field}>
                          {config.label}
                          <select name={field} value={form[field]} onChange={handleChange}>
                            {config.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    }
                    if (field === 'projectDescription') {
                      return (
                        <label key={field} className="span-2">
                          {config.label}
                          <textarea name={field} value={form[field]} onChange={handleChange} placeholder={config.placeholder} required />
                        </label>
                      );
                    }
                    return (
                      <label key={field}>
                        {config.label}
                        <input
                          type={config.type || 'text'}
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                          placeholder={config.placeholder}
                          required={field !== 'budgetRange'}
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="modal-section">
              <div className="section-header">
                <div>
                  <h4>Produkte & Leistungen</h4>
                  <p className="muted">Wähle, was in das Angebot aufgenommen werden soll.</p>
                </div>
                <span className="chip">{selectedProducts.length} ausgewählt</span>
              </div>
              <div className="product-grid">
                {availableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`product-card ${selectedProductIds.includes(product.id) ? 'selected' : ''}`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <span className="price-pill">{product.price}</span>
                    <strong>{product.name}</strong>
                    <p className="muted">{product.description || 'Individuelle Beschreibung folgt im Proposal.'}</p>
                    {product.isCustom && <span className="chip subtle">Eigenes Produkt</span>}
                  </button>
                ))}
              </div>
              <div className="custom-product">
                <h5>Eigenes Produkt hinzufügen</h5>
                <p className="muted">Perfekt für individuelle Pakete oder Add-ons.</p>
                <form className="custom-product-form" onSubmit={handleAddCustomProduct}>
                  <label>
                    Produktname
                    <input name="name" value={customProductForm.name} onChange={handleCustomProductChange} placeholder="z. B. Discovery Call" />
                  </label>
                  <label>
                    Beschreibung
                    <input name="description" value={customProductForm.description} onChange={handleCustomProductChange} placeholder="Kurzbeschreibung" />
                  </label>
                  <label>
                    Preis
                    <input name="price" value={customProductForm.price} onChange={handleCustomProductChange} placeholder="z. B. €1.200" />
                  </label>
                  <button type="submit" className="secondary">
                    Produkt anlegen
                  </button>
                </form>
              </div>
            </section>

            {error && <p className="error-msg">{error}</p>}

            <div className="modal-actions">
              <div>
                <p className="muted">{selectedProducts.length > 0 ? 'Wir verwenden deine Auswahl für das Pricing.' : 'Wähle mindestens ein Produkt aus.'}</p>
              </div>
              <div className="action-buttons">
                <button type="button" className="ghost-button" onClick={onClose}>
                  Abbrechen
                </button>
                <button className="primary" type="submit" disabled={loading || selectedProducts.length === 0}>
                  {loading ? 'Wird erstellt…' : 'Proposal anlegen'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="modal-content success-state">
            <div className="success-hero">
              <h4>Proposal "{result.title}" ist bereit!</h4>
              <p className="muted">Du findest es jetzt in deiner Proposal-Übersicht und kannst es finalisieren oder senden.</p>
            </div>
            {result.selectedProducts?.length ? (
              <div className="modal-section">
                <h5>Ausgewählte Produkte</h5>
                <ul className="success-list">
                  {result.selectedProducts.map((product) => (
                    <li key={product.id}>
                      <strong>{product.name}</strong>
                      <span className="muted">{product.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setResult(null)}>
                Noch eins erstellen
              </button>
              <button type="button" className="primary" onClick={onClose}>
                Zurück zum Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
