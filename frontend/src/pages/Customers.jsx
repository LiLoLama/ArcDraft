import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import useAuthStore from '../store/authStore';
import useCustomerStore from '../store/customerStore';
import useCustomerStyleStore from '../store/customerStyleStore';

const emptyCustomer = {
  name: '',
  company: '',
  email: '',
  notes: '',
  styleId: '',
  useCustomerStyle: false,
  styleLanguage: '',
  styleTone: '',
  styleDescription: '',
};

export default function CustomersPage() {
  const customers = useCustomerStore((s) => s.customers);
  const initializeCustomers = useCustomerStore((s) => s.initialize);
  const addCustomer = useCustomerStore((s) => s.addCustomer);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const removeCustomer = useCustomerStore((s) => s.removeCustomer);
  const styles = useCustomerStyleStore((s) => s.styles);
  const initializeStyles = useCustomerStyleStore((s) => s.initializeStyles);
  const token = useAuthStore((s) => s.token);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [customerProposals, setCustomerProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalError, setProposalError] = useState('');

  useEffect(() => {
    initializeCustomers();
    initializeStyles();
  }, [initializeCustomers, initializeStyles]);

  const openDetails = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
    if (!token) return;
    setLoadingProposals(true);
    setProposalError('');
    try {
      const proposals = await apiRequest('/api/proposals', { token });
      setCustomerProposals(proposals);
    } catch (err) {
      setProposalError(err.message || 'Proposals konnten nicht geladen werden.');
    } finally {
      setLoadingProposals(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.toLowerCase();
    return customers.filter((customer) => `${customer.name} ${customer.company} ${customer.email}`.toLowerCase().includes(term));
  }, [customers, search]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyCustomer);
    setShowModal(true);
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name || '',
      company: customer.company || '',
      email: customer.email || '',
      notes: customer.notes || '',
      styleId: customer.styleId || '',
      useCustomerStyle: customer.useCustomerStyle ?? false,
      styleLanguage: customer.styleLanguage || '',
      styleTone: customer.styleTone || '',
      styleDescription: customer.styleDescription || '',
    });
    setShowModal(true);
  };

  const saveCustomer = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      name: form.name.trim(),
      styleId: form.useCustomerStyle ? '' : form.styleId,
      useCustomerStyle: form.useCustomerStyle,
      styleLanguage: form.useCustomerStyle ? form.styleLanguage : '',
      styleTone: form.useCustomerStyle ? form.styleTone : '',
      styleDescription: form.useCustomerStyle ? form.styleDescription : '',
    };
    if (editingId) {
      updateCustomer(editingId, payload);
    } else {
      addCustomer(payload);
    }
    setShowModal(false);
    setEditingId(null);
    setForm(emptyCustomer);
  };

  const autoResizeTextarea = (target) => {
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleChange = (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      autoResizeTextarea(e.target);
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!showModal) return;
    requestAnimationFrame(() => {
      document.querySelectorAll('.modal textarea.auto-resize').forEach(autoResizeTextarea);
    });
  }, [showModal, form.styleDescription, form.notes, form.useCustomerStyle]);

  const getStyleLabel = (customer) => {
    if (customer.useCustomerStyle) {
      const language = customer.styleLanguage ? customer.styleLanguage.toUpperCase() : '—';
      const tone = customer.styleTone || 'Individueller Stil';
      return `${tone} (${language})`;
    }
    if (customer.styleId) {
      return styles.find((style) => style.id === customer.styleId)?.name || 'Kein Stil hinterlegt';
    }
    return 'Kein Stil aktiv';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kunden</h1>
          <p className="muted">Verwalte Kundendaten und verknüpfe sie mit passenden Kommunikationsstilen.</p>
        </div>
        <div className="header-actions">
          <input
            type="search"
            className="search-input"
            placeholder="Kunden suchen"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="primary" type="button" onClick={startCreate}>
            Neuer Kunde
          </button>
        </div>
      </div>

      {filteredCustomers.length ? (
        <div className="product-grid management">
          {filteredCustomers.map((customer) => (
            <article
              key={customer.id}
              className="product-row customer-card"
              role="button"
              tabIndex={0}
              onClick={() => openDetails(customer)}
              onKeyDown={(e) => e.key === 'Enter' && openDetails(customer)}
            >
              <div className="product-row-content">
                <div>
                  <strong>{customer.name}</strong>
                  <p className="muted">{customer.company || 'Kein Unternehmen hinterlegt'}</p>
                  <p className="muted small">{customer.email || 'Keine E-Mail hinterlegt'}</p>
                  <div className="chip-row">
                    <span className="chip subtle">Stil: {getStyleLabel(customer)}</span>
                  </div>
                  {customer.notes && <p className="muted small">Notizen: {customer.notes}</p>}
                </div>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(customer);
                    }}
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomer(customer.id);
                    }}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Keine Kund:innen gefunden.</p>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="proposal-modal">
            <div className="modal-header">
              <div>
                <p className="tagline">Kundenprofil</p>
                <h3>{editingId ? 'Kunde bearbeiten' : 'Neuen Kunden anlegen'}</h3>
                <p className="muted">Erfasse Basisdaten und den gewünschten Stil für deine Kommunikation.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowModal(false)} aria-label="Popup schließen">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l10 10m0-10L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <form className="modal-content" onSubmit={saveCustomer}>
              <div className="modal-grid">
                <label>
                  Name
                  <input name="name" value={form.name} onChange={handleChange} placeholder="z. B. Alex Kunde" required />
                </label>
                <label>
                  Unternehmen
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Firma" />
                </label>
                <label>
                  E-Mail
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="E-Mail-Adresse" />
                </label>
                <div className="toggle-row span-2">
                  <div>
                    <p className="toggle-label">Individuellen Kundenstil verwenden</p>
                    <p className="muted small">Aktiviere einen speziellen Stil nur für diesen Kunden.</p>
                  </div>
                  <label className="toggle-control">
                    <input
                      type="checkbox"
                      name="useCustomerStyle"
                      checked={form.useCustomerStyle}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          useCustomerStyle: checked,
                          styleId: checked ? '' : prev.styleId,
                        }));
                      }}
                    />
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                  </label>
                </div>
                {!form.useCustomerStyle && (
                  <label>
                    Zugeordneter Standardstil
                    <select name="styleId" value={form.styleId} onChange={handleChange}>
                      <option value="">Kein Stil</option>
                      {styles.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name} ({style.language?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {form.useCustomerStyle && (
                  <>
                    <label>
                      Sprache
                      <select name="styleLanguage" value={form.styleLanguage} onChange={handleChange}>
                        <option value="">Auswählen</option>
                        <option value="de">Deutsch</option>
                        <option value="en">Englisch</option>
                      </select>
                    </label>
                    <div className="span-2 tone-stack">
                      <label>
                        Tonalität
                        <input
                          name="styleTone"
                          value={form.styleTone}
                          onChange={handleChange}
                          placeholder="z. B. freundlich, formal"
                        />
                      </label>
                      <label>
                        Beschreibung
                        <textarea
                          name="styleDescription"
                          value={form.styleDescription}
                          onChange={handleChange}
                          className="auto-resize"
                          placeholder="Beschreibe den individuellen Stil"
                        />
                      </label>
                    </div>
                  </>
                )}
                <div className="span-2 tone-stack">
                  <label>
                    Notizen
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      className="auto-resize"
                      placeholder="Präferenzen, Besonderheiten"
                    />
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setShowModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="primary">
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedCustomer && (
        <div className="modal-overlay">
          <div className="proposal-modal">
            <div className="modal-header">
              <div>
                <p className="tagline">Kundenübersicht</p>
                <h3>{selectedCustomer.name}</h3>
                <p className="muted">{selectedCustomer.company || 'Kein Unternehmen hinterlegt'}</p>
                <p className="muted small">{selectedCustomer.email || 'Keine E-Mail hinterlegt'}</p>
              </div>
              <button className="icon-button" type="button" aria-label="Popup schließen" onClick={() => setShowDetails(false)}>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l10 10m0-10L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="modal-content customer-details-content">
              <div className="grid grid-3">
                <div className="card">
                  <p className="muted small">Proposals</p>
                  <h3>{customerProposals.filter((p) => p.customerId === selectedCustomer.id || p.recipient?.email === selectedCustomer.email).length}</h3>
                </div>
                <div className="card">
                  <p className="muted small">Signiert</p>
                  <h3>
                    {
                      customerProposals.filter(
                        (p) => (p.customerId === selectedCustomer.id || p.recipient?.email === selectedCustomer.email) && ['signed', 'signiert'].includes(p.status),
                      ).length
                    }
                  </h3>
                </div>
                <div className="card">
                  <p className="muted small">Umsatz (Proposals)</p>
                  <RevenueValue
                    proposals={customerProposals.filter(
                      (p) => p.customerId === selectedCustomer.id || p.recipient?.email === selectedCustomer.email,
                    )}
                  />
                </div>
              </div>

              <section className="customer-proposal-section">
                <h4>Proposals</h4>
                {loadingProposals && <p className="muted">Lade Daten...</p>}
                {proposalError && <p className="error-msg">{proposalError}</p>}
                {!loadingProposals && !proposalError && (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Titel</th>
                        <th>Status</th>
                        <th>Aktualisiert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerProposals
                        .filter((proposal) => proposal.customerId === selectedCustomer.id || proposal.recipient?.email === selectedCustomer.email)
                        .map((proposal) => (
                          <tr key={proposal.id}>
                            <td>{proposal.title}</td>
                            <td>
                              <StatusBadge status={proposal.status} />
                            </td>
                            <td>{proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      {!customerProposals.filter((proposal) => proposal.customerId === selectedCustomer.id || proposal.recipient?.email === selectedCustomer.email).length && (
                        <tr>
                          <td colSpan="3" className="muted">
                            Keine Proposals vorhanden.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueValue({ proposals }) {
  const parsePrice = (value) => {
    if (!value) return 0;
    const normalized = String(value).replace(/[^0-9,.-]/g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
  };

  const total = proposals.reduce((sum, proposal) => {
    const productSum = (proposal.products || []).reduce((acc, product) => acc + parsePrice(product.price), 0);
    return sum + productSum;
  }, 0);

  return <h3>{total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</h3>;
}

RevenueValue.propTypes = {
  proposals: PropTypes.arrayOf(PropTypes.object),
};
