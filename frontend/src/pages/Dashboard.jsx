import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import useProductStore from '../store/productStore';
import useCustomerStyleStore from '../store/customerStyleStore';
import useCustomerStore from '../store/customerStore';

const initialFormState = {
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  projectTitle: '',
  projectDescription: '',
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
  { title: 'Projektstory', description: 'Was ist das Ziel und warum ist es wichtig?', fields: ['projectTitle', 'projectDescription'] },
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
  const initializeStyles = useCustomerStyleStore((s) => s.initializeStyles);
  const customers = useCustomerStore((s) => s.customers);
  const initializeCustomers = useCustomerStore((s) => s.initialize);
  const addCustomer = useCustomerStore((s) => s.addCustomer);

  const [form, setForm] = useState(initialFormState);
  const [startMode, setStartMode] = useState('');
  const [customerMode, setCustomerMode] = useState('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', email: '', styleId: '' });
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [proposalProducts, setProposalProducts] = useState([]);
  const [customProducts, setCustomProducts] = useState([]);
  const [customProductForm, setCustomProductForm] = useState({ name: '', description: '', price: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDraft, setProductDraft] = useState({ name: '', description: '', price: '' });
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    initializeStyles();
    initializeCustomers();
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [initializeCustomers, initializeStyles]);

  useEffect(() => {
    setProposalProducts(products.map((product) => ({ ...product })));
  }, [products]);

  useEffect(() => {
    if (!token || startMode !== 'template') return;
    setTemplatesLoading(true);
    apiRequest('/api/templates', { token })
      .then(setTemplates)
      .finally(() => setTemplatesLoading(false));
  }, [startMode, token]);

  useEffect(() => {
    if (!startMode) return;
    setForm((prev) => ({ ...prev, startMode }));
  }, [startMode]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  useEffect(() => {
    if (!selectedTemplate) return;
    setForm((prev) => ({
      ...prev,
      projectTitle: selectedTemplate.projectTitle || selectedTemplate.name || prev.projectTitle,
      projectDescription:
        selectedTemplate.projectDescription || selectedTemplate.description || prev.projectDescription,
      tone: selectedTemplate.tone || prev.tone,
      language: selectedTemplate.language || prev.language,
      templateId: selectedTemplate.id,
    }));
    setSelectedProductIds(selectedTemplate.productIds || []);
    setCustomProducts(selectedTemplate.customProducts || []);
  }, [selectedTemplate]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  useEffect(() => {
    if (customerMode === 'existing' && selectedCustomer) {
      const styleId = selectedCustomer.useCustomerStyle ? '' : selectedCustomer.styleId;
      const style = customerStyles.find((entry) => entry.id === styleId);
      setForm((prev) => ({
        ...prev,
        clientName: selectedCustomer.name || prev.clientName,
        clientCompany: selectedCustomer.company || prev.clientCompany,
        clientEmail: selectedCustomer.email || prev.clientEmail,
        customerStyleId: styleId || '',
        useCustomerStyle: selectedCustomer.useCustomerStyle,
        tone: selectedCustomer.useCustomerStyle
          ? selectedCustomer.styleTone || prev.tone
          : style?.tone || prev.tone,
        language: selectedCustomer.useCustomerStyle
          ? selectedCustomer.styleLanguage || prev.language
          : style?.language || prev.language,
      }));
    }
    if (customerMode === 'new') {
      const style = customerStyles.find((entry) => entry.id === newCustomer.styleId);
      setForm((prev) => ({
        ...prev,
        clientName: newCustomer.name || prev.clientName,
        clientCompany: newCustomer.company || prev.clientCompany,
        clientEmail: newCustomer.email || prev.clientEmail,
        customerStyleId: newCustomer.styleId || '',
        useCustomerStyle: false,
        tone: style?.tone || prev.tone,
        language: style?.language || prev.language,
      }));
    }
  }, [customerMode, customerStyles, newCustomer, selectedCustomer]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const startReady =
    startMode &&
    ((startMode === 'template' && selectedTemplateId) || startMode === 'scratch') &&
    (customerMode === 'existing' ? selectedCustomerId : newCustomer.name.trim());

  const handleStartContinue = () => {
    if (!startReady) return;
    setShowDetails(true);
  };

  const resetToStart = () => {
    setShowDetails(false);
  };

  const handleNewCustomerChange = (e) => {
    const value = e.target.value;
    setNewCustomer({ ...newCustomer, [e.target.name]: value });
  };

  const handleStyleSelect = (styleId) => {
    const style = customerStyles.find((entry) => entry.id === styleId);
    setForm((prev) => ({
      ...prev,
      customerStyleId: styleId,
      useCustomerStyle: false,
      tone: style?.tone || prev.tone,
      language: style?.language || prev.language,
    }));
    if (customerMode === 'new') {
      setNewCustomer((prev) => ({ ...prev, styleId }));
    }
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

  const availableProducts = [...proposalProducts, ...customProducts];
  const selectedProducts = availableProducts.filter((product) => selectedProductIds.includes(product.id));

  const handleAddCustomProduct = (e) => {
    e?.preventDefault();
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
      let customerId = customerMode === 'existing' ? selectedCustomerId : '';
      if (customerMode === 'new') {
        const createdId = addCustomer({
          name: newCustomer.name || form.clientName || 'Neuer Kunde',
          company: newCustomer.company || form.clientCompany,
          email: newCustomer.email || form.clientEmail,
          styleId: form.customerStyleId || newCustomer.styleId,
          useCustomerStyle: false,
          notes: 'Automatisch beim Proposal angelegt.',
        });
        customerId = createdId;
      }

      const selectedStyle = customerStyles.find((style) => style.id === form.customerStyleId);
      const payloadBody = {
        ...form,
        startMode: startMode || form.startMode || (selectedTemplateId ? 'template' : 'scratch'),
        templateId: selectedTemplateId || form.templateId || null,
        customerId: customerId || null,
        tone: selectedStyle ? selectedStyle.tone : form.tone,
        language: selectedStyle ? selectedStyle.language : form.language,
        customerStyleId: form.customerStyleId || null,
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
      setStartMode('');
      setCustomerMode('existing');
      setSelectedCustomerId('');
      setSelectedTemplateId('');
      setNewCustomer({ name: '', company: '', email: '', styleId: '' });
      setShowDetails(false);
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
            {!showDetails ? (
              <>
                <section className="modal-section">
                  <div className="section-header">
                    <div>
                      <h4>Wie möchtest du starten?</h4>
                      <p className="muted">Entscheide, ob du ein bestehendes Template nutzt oder von Null beginnst.</p>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      type="button"
                      className={startMode === 'template' ? 'secondary' : 'ghost-button'}
                      onClick={() => setStartMode('template')}
                    >
                      Mit Template starten
                    </button>
                    <button
                      type="button"
                      className={startMode === 'scratch' ? 'secondary' : 'ghost-button'}
                      onClick={() => setStartMode('scratch')}
                    >
                      Von vorne starten
                    </button>
                  </div>
                  {startMode === 'template' && (
                    <div className="modal-grid">
                      <label className="span-2">
                        Template auswählen
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          disabled={templatesLoading}
                        >
                          <option value="">Bitte auswählen</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedTemplate && (
                        <div className="style-preview span-2">
                          <p>
                            <strong>Beschreibung:</strong> {selectedTemplate.description || 'Keine Beschreibung hinterlegt.'}
                          </p>
                          <p className="muted small">
                            Ton: {selectedTemplate.tone || '—'} · Sprache: {selectedTemplate.language?.toUpperCase() || '—'} ·
                            Produkte: {selectedTemplate.productIds?.length || 0}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {startMode && (
                    <div className="modal-grid">
                      <label>
                        Kundenzuordnung
                        <div className="action-buttons inline">
                          <button
                            type="button"
                            className={customerMode === 'existing' ? 'secondary' : 'ghost-button'}
                            onClick={() => setCustomerMode('existing')}
                          >
                            Bestehender Kunde
                          </button>
                          <button
                            type="button"
                            className={customerMode === 'new' ? 'secondary' : 'ghost-button'}
                            onClick={() => setCustomerMode('new')}
                          >
                            Neuer Kunde
                          </button>
                        </div>
                      </label>
                      {customerMode === 'existing' ? (
                        <label className="span-2">
                          Kunde auswählen
                          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                            <option value="">Bitte auswählen</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name} – {customer.company}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <div className="modal-grid span-2">
                          <label>
                            Kundenname
                            <input
                              name="name"
                              value={newCustomer.name}
                              onChange={handleNewCustomerChange}
                              placeholder="z. B. Neue Kundin"
                            />
                          </label>
                          <label>
                            Unternehmen
                            <input name="company" value={newCustomer.company} onChange={handleNewCustomerChange} placeholder="Firma" />
                          </label>
                          <label>
                            E-Mail
                            <input name="email" value={newCustomer.email} onChange={handleNewCustomerChange} placeholder="Kontakt" />
                          </label>
                          <label>
                            Standardstil
                            <select name="styleId" value={newCustomer.styleId} onChange={(e) => handleStyleSelect(e.target.value)}>
                              <option value="">Kein Stil</option>
                              {customerStyles.map((style) => (
                                <option key={style.id} value={style.id}>
                                  {style.name} ({style.language?.toUpperCase()})
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <div className="modal-actions">
                  <div>
                    <p className="muted">Wähle einen Startmodus und eine Kundenzuordnung, um Details zu pflegen.</p>
                  </div>
                  <div className="action-buttons">
                    <button type="button" className="ghost-button" onClick={onClose}>
                      Abbrechen
                    </button>
                    <button type="button" className="primary" onClick={handleStartContinue} disabled={!startReady}>
                      Weiter
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <section className="modal-section">
                  <div className="section-header">
                    <div>
                      <h4>Start-Einstellungen</h4>
                      <p className="muted">Bearbeite Startmodus, Template und Kundenzuordnung bei Bedarf.</p>
                    </div>
                    <button type="button" className="ghost-button small" onClick={resetToStart}>
                      Start anpassen
                    </button>
                  </div>
                  <div className="modal-grid start-summary">
                    <div>
                      <p className="muted small">Start</p>
                      <strong>{startMode === 'template' ? 'Mit Template' : 'Von vorne'}</strong>
                    </div>
                    <div>
                      <p className="muted small">Template</p>
                      <strong>{startMode === 'template' ? selectedTemplate?.name || 'Kein Template gewählt' : 'Keins'}</strong>
                    </div>
                    <div>
                      <p className="muted small">Kunde</p>
                      <strong>
                        {customerMode === 'existing'
                          ? selectedCustomer
                            ? `${selectedCustomer.name} – ${selectedCustomer.company || 'Kein Unternehmen'}`
                            : 'Kein Kunde gewählt'
                          : newCustomer.name
                            ? `${newCustomer.name} (neu)`
                            : 'Neuer Kunde'}
                      </strong>
                    </div>
                  </div>
                </section>

                {fieldGroups.map((group) => {
                  const isProjectStory = group.title === 'Projektstory';
                  return (
                    <section key={group.title} className={`modal-section ${isProjectStory ? 'project-story-section' : ''}`}>
                      <div className="section-header">
                        <div>
                          <h4>{group.title}</h4>
                          <p className="muted">{group.description}</p>
                        </div>
                      </div>
                      <div className={`modal-grid ${isProjectStory ? 'project-story-grid' : ''}`}>
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
                                  <textarea
                                    name={field}
                                    value={form[field]}
                                    onChange={handleChange}
                                    placeholder={config.placeholder}
                                    required
                                  />
                                </label>
                              );
                            }
                          return (
                            <label key={field} className={field === 'projectTitle' ? 'project-title-field' : ''}>
                              {config.label}
                              <input
                                type={config.type || 'text'}
                                name={field}
                                value={form[field]}
                                onChange={handleChange}
                                placeholder={config.placeholder}
                                required
                              />
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                <section className="modal-section">
                  <div className="section-header">
                    <div>
                      <h4>Ton & Sprache</h4>
                      <p className="muted">Nutze Standardstile aus den Einstellungen oder passe Tone und Sprache manuell an.</p>
                    </div>
                  </div>
                  <div className="modal-grid">
                    <label className="span-2">
                      Standardstil auswählen
                      <select name="customerStyleId" value={form.customerStyleId} onChange={(e) => handleStyleSelect(e.target.value)}>
                        <option value="">Kein Standardstil</option>
                        {customerStyles.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name} ({style.language?.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </label>
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
                    {form.customerStyleId ? (
                      <div className="style-preview span-2">
                        <p>
                          <strong>Ton:</strong> {customerStyles.find((style) => style.id === form.customerStyleId)?.tone || '—'}
                        </p>
                        <p className="muted">
                          {customerStyles.find((style) => style.id === form.customerStyleId)?.description || 'Kein Beschreibungstext hinterlegt.'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="modal-section">
                  <div className="section-header">
                    <div>
                      <h4>Produkte & Leistungen</h4>
                      <p className="muted">Wähle, was in das Angebot aufgenommen werden soll.</p>
                    </div>
                    <span className="chip success">{selectedProducts.length} ausgewählt</span>
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
                    <div className="custom-product-form">
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
                      <button type="button" className="secondary" onClick={handleAddCustomProduct}>
                        Produkt anlegen
                      </button>
                    </div>
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
              </>
            )}
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

