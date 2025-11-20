import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import useProductStore from '../store/productStore';
import useCustomerStyleStore from '../store/customerStyleStore';

const initialFormState = {
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  projectTitle: '',
  projectDescription: '',
  budgetRange: '',
  tone: 'freundlich',
  language: 'de',
  useCustomerStyle: false,
  customerStyleId: '',
};

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
        <div className="header-actions">
          <button className="primary" onClick={() => setShowGenerator(true)}>
            Neues Proposal mit AI
          </button>
        </div>
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
  const products = useProductStore((s) => s.products);
  const customerStyles = useCustomerStyleStore((s) => s.styles);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [proposalProducts, setProposalProducts] = useState([]);
  const [customProducts, setCustomProducts] = useState([]);
  const [customProductForm, setCustomProductForm] = useState({ name: '', description: '', price: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDraft, setProductDraft] = useState({ name: '', description: '', price: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  useEffect(() => {
    setProposalProducts(products.map((product) => ({ ...product })));
  }, [products]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleCustomProductChange = (e) => {
    setCustomProductForm({ ...customProductForm, [e.target.name]: e.target.value });
  };

  const handleDraftChange = (e) => {
    setProductDraft({ ...productDraft, [e.target.name]: e.target.value });
  };

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  };

  useEffect(() => {
    if (!form.useCustomerStyle && form.customerStyleId) {
      setForm((prev) => ({ ...prev, customerStyleId: '' }));
    }
  }, [form.customerStyleId, form.useCustomerStyle]);

  const handleCustomerStyleChange = (styleId) => {
    const style = customerStyles.find((entry) => entry.id === styleId);
    setForm((prev) => ({
      ...prev,
      customerStyleId: styleId,
      tone: style?.tone || prev.tone,
      language: style?.language || prev.language,
    }));
  };

  const selectedStyle = customerStyles.find((style) => style.id === form.customerStyleId);

  const availableProducts = [...proposalProducts, ...customProducts];
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
    setCustomProductForm({ name: '', description: '', price: '' });
  };

  const startEditingProduct = (product) => {
    setEditingProductId(product.id);
    setProductDraft({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
    });
  };

  const saveProductDraft = () => {
    if (!editingProductId) return;
    setProposalProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...p, ...productDraft } : p)));
    setCustomProducts((prev) => prev.map((p) => (p.id === editingProductId ? { ...p, ...productDraft } : p)));
    setEditingProductId(null);
    setProductDraft({ name: '', description: '', price: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const selectedStyle = customerStyles.find((style) => style.id === form.customerStyleId);
      const payloadBody = {
        ...form,
        tone: form.useCustomerStyle && selectedStyle ? selectedStyle.tone : form.tone,
        language: form.useCustomerStyle && selectedStyle ? selectedStyle.language : form.language,
        customerStyleId: form.useCustomerStyle ? form.customerStyleId : null,
        products: selectedProducts,
      };
      const payload = await apiRequest('/api/proposals/ai-generate', {
        method: 'POST',
        body: payloadBody,
        token,
      });
      setResult({ ...payload.proposal, selectedProducts });
      setForm(initialFormState);
      setCustomProducts([]);
      setSelectedProductIds([]);
      setProposalProducts(products.map((product) => ({ ...product })));
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
          <button className="icon-button" type="button" onClick={onClose} aria-label="Modal schließen">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3l10 10m0-10L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
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
                  <h4>Ton & Sprache</h4>
                  <p className="muted">Nutze Standard-Optionen oder gespeicherte Kundenstile.</p>
                </div>
              </div>
              <label className="checkbox-row">
                <input type="checkbox" name="useCustomerStyle" checked={form.useCustomerStyle} onChange={handleChange} />
                <span>Individuelle Kundensprache verwenden</span>
              </label>
              {form.useCustomerStyle ? (
                customerStyles.length ? (
                  <div className="modal-grid">
                    <label className="span-2">
                      Kundensprache auswählen
                      <select
                        name="customerStyleId"
                        value={form.customerStyleId}
                        onChange={(e) => handleCustomerStyleChange(e.target.value)}
                        required
                      >
                        <option value="">Bitte auswählen</option>
                        {customerStyles.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name} ({style.language?.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </label>
                    {selectedStyle ? (
                      <div className="style-preview span-2">
                        <p>
                          <strong>Ton:</strong> {selectedStyle.tone || '—'}
                        </p>
                        <p className="muted">{selectedStyle.description || 'Kein Beschreibungstext hinterlegt.'}</p>
                      </div>
                    ) : (
                      <p className="muted span-2">Wähle einen Stil, um Tonalität und Sprache zu übernehmen.</p>
                    )}
                  </div>
                ) : (
                  <div className="product-empty-state">
                    <p>Keine Kundenstile angelegt.</p>
                    <Link to="/customer-styles" className="ghost-button small">
                      Kundenstile öffnen
                    </Link>
                  </div>
                )
              ) : (
                <div className="modal-grid">
                  <label>
                    {fieldConfig.tone.label}
                    <select name="tone" value={form.tone} onChange={handleChange}>
                      {fieldConfig.tone.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {fieldConfig.language.label}
                    <select name="language" value={form.language} onChange={handleChange}>
                      {fieldConfig.language.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </section>

            <section className="modal-section">
              <div className="section-header">
                <div>
                  <h4>Produkte & Leistungen</h4>
                  <p className="muted">Wähle, was in das Angebot aufgenommen werden soll.</p>
                </div>
                <span className="chip">{selectedProducts.length} ausgewählt</span>
              </div>
              {availableProducts.length > 0 ? (
                <div className="product-grid">
                  {availableProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        role="button"
                        tabIndex={0}
                        className={`product-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleProduct(product.id)}
                        onKeyDown={(e) => e.key === 'Enter' && toggleProduct(product.id)}
                      >
                        <span className="price-pill">{product.price}</span>
                        <strong>{product.name}</strong>
                        <p className="muted">{product.description || 'Individuelle Beschreibung folgt im Proposal.'}</p>
                        <div className="chip-row">
                          {product.isCustom && <span className="chip subtle">Eigenes Produkt</span>}
                          {editingProductId === product.id && <span className="chip subtle">In Bearbeitung</span>}
                        </div>
                        <div className="action-buttons inline">
                          <button
                            className="ghost-button small"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingProduct(product);
                            }}
                          >
                            Für dieses Proposal anpassen
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="product-empty-state">
                  <p>Noch keine Produkte verfügbar. Lege sie im Products Bereich an.</p>
                  <Link to="/products" className="ghost-button small">
                    Products öffnen
                  </Link>
                </div>
              )}
              {editingProductId && (
                <div className="product-edit-panel">
                  <div className="section-header">
                    <div>
                      <h5>Produktdetails anpassen</h5>
                      <p className="muted">Änderungen gelten nur für dieses Proposal.</p>
                    </div>
                  </div>
                  <div className="modal-grid">
                    <label>
                      Produktname
                      <input name="name" value={productDraft.name} onChange={handleDraftChange} />
                    </label>
                    <label>
                      Preis
                      <input name="price" value={productDraft.price} onChange={handleDraftChange} />
                    </label>
                    <label className="span-2">
                      Beschreibung
                      <textarea name="description" value={productDraft.description} onChange={handleDraftChange} rows={3} />
                    </label>
                  </div>
                  <div className="action-buttons">
                    <button type="button" className="ghost-button" onClick={() => setEditingProductId(null)}>
                      Abbrechen
                    </button>
                    <button type="button" className="primary" onClick={saveProductDraft}>
                      Änderungen übernehmen
                    </button>
                  </div>
                </div>
              )}
              <div className="custom-product">
                <h5>Eigenes Produkt hinzufügen</h5>
                <p className="muted">Perfekt für individuelle Pakete oder Add-ons – nur für dieses Proposal sichtbar.</p>
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
