import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';
import useProductStore from '../store/productStore';

const emptyTemplate = {
  name: '',
  description: '',
  status: 'draft',
  projectTitle: '',
  projectDescription: '',
  tone: 'freundlich',
  language: 'de',
  productIds: [],
  customProducts: [],
};

const toneOptions = [
  { value: 'freundlich', label: 'Freundlich & optimistisch' },
  { value: 'bold', label: 'Mutig & visionär' },
  { value: 'formal', label: 'Seriös & strukturiert' },
];

const languageOptions = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
];

export default function TemplateDetailPage() {
  const token = useAuthStore((s) => s.token);
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(emptyTemplate);
  const products = useProductStore((s) => s.products);
  const initializeProducts = useProductStore((s) => s.initializeProducts);
  const [customProductDraft, setCustomProductDraft] = useState({ name: '', description: '', price: '' });

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  useEffect(() => {
    if (id === 'new') return;
    apiRequest(`/api/templates/${id}`, { token }).then((data) =>
      setTemplate({
        ...emptyTemplate,
        ...data,
        productIds: data.productIds || [],
        customProducts: data.customProducts || [],
      })
    );
  }, [id, token]);

  const updateField = (field, value) => setTemplate((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (id === 'new') {
      const created = await apiRequest('/api/templates', { method: 'POST', token, body: template });
      navigate(`/templates/${created.id}`);
    } else {
      const updated = await apiRequest(`/api/templates/${id}`, { method: 'PUT', token, body: template });
      setTemplate({
        ...emptyTemplate,
        ...updated,
        productIds: updated.productIds || [],
        customProducts: updated.customProducts || [],
      });
    }
  };

  const toggleProduct = (productId) => {
    updateField(
      'productIds',
      template.productIds.includes(productId)
        ? template.productIds.filter((id) => id !== productId)
        : [...template.productIds, productId]
    );
  };

  const addCustomProduct = () => {
    if (!customProductDraft.name.trim()) return;
    const idValue = crypto?.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}`;
    const newProduct = {
      id: idValue,
      ...customProductDraft,
      price: customProductDraft.price || 'auf Anfrage',
      isCustom: true,
    };
    updateField('customProducts', [...template.customProducts, newProduct]);
    updateField('productIds', [...new Set([...template.productIds, idValue])]);
    setCustomProductDraft({ name: '', description: '', price: '' });
  };

  const updateCustomProduct = (productId, field, value) => {
    const next = template.customProducts.map((product) =>
      product.id === productId ? { ...product, [field]: value } : product
    );
    updateField('customProducts', next);
  };

  const removeCustomProduct = (productId) => {
    updateField('customProducts', template.customProducts.filter((product) => product.id !== productId));
    updateField('productIds', template.productIds.filter((id) => id !== productId));
  };

  const availableProducts = [...products, ...template.customProducts];
  const selectedProducts = availableProducts.filter((product) => template.productIds.includes(product.id));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Template</h1>
          <p className="muted">Definiere die Standardbausteine für neue Proposals.</p>
        </div>
        <button className="primary" onClick={handleSave}>
          Speichern
        </button>
      </div>
      <div className="grid grid-2">
        <label>
          Name
          <input value={template.name} onChange={(e) => updateField('name', e.target.value)} />
        </label>
        <label>
          Status
          <select value={template.status} onChange={(e) => updateField('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </label>
      </div>
      <label>
        Beschreibung
        <textarea value={template.description} onChange={(e) => updateField('description', e.target.value)} />
      </label>

      <section>
        <div className="section-header">
          <h2>Projektstory</h2>
          <p className="muted">Halte fest, was das Template vermitteln soll.</p>
        </div>
        <div className="grid grid-2">
          <label>
            Überschrift
            <input
              value={template.projectTitle}
              onChange={(e) => updateField('projectTitle', e.target.value)}
              placeholder="z. B. AI Sales Playbook"
            />
          </label>
          <label className="span-2">
            Beschreibung
            <textarea
              value={template.projectDescription}
              onChange={(e) => updateField('projectDescription', e.target.value)}
              placeholder="Was ist das Ziel und warum ist es wichtig?"
            />
          </label>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Ton & Sprache</h2>
          <p className="muted">Passe Tone of Voice und Proposal-Sprache an.</p>
        </div>
        <div className="grid grid-2">
          <label>
            Ton
            <select value={template.tone} onChange={(e) => updateField('tone', e.target.value)}>
              {toneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sprache
            <select value={template.language} onChange={(e) => updateField('language', e.target.value)}>
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Produkte & Leistungen</h2>
          <span className="chip success">{selectedProducts.length} ausgewählt</span>
        </div>
        {availableProducts.length > 0 ? (
          <div className="product-grid">
            {availableProducts.map((product) => {
              const isSelected = template.productIds.includes(product.id);
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
                  {product.isCustom && <span className="chip subtle">Eigenes Produkt</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Noch keine Produkte vorhanden.</p>
        )}

        <div className="custom-product">
          <h5>Eigenes Produkt hinzufügen</h5>
          <p className="muted">Perfekt für individuelle Pakete oder Add-ons.</p>
          <div className="custom-product-form">
            <label>
              Produktname
              <input
                name="name"
                value={customProductDraft.name}
                onChange={(e) => setCustomProductDraft({ ...customProductDraft, name: e.target.value })}
                placeholder="z. B. Discovery Call"
              />
            </label>
            <label>
              Beschreibung
              <input
                name="description"
                value={customProductDraft.description}
                onChange={(e) => setCustomProductDraft({ ...customProductDraft, description: e.target.value })}
                placeholder="Kurzbeschreibung"
              />
            </label>
            <label>
              Preis
              <input
                name="price"
                value={customProductDraft.price}
                onChange={(e) => setCustomProductDraft({ ...customProductDraft, price: e.target.value })}
                placeholder="z. B. €1.200"
              />
            </label>
            <button type="button" className="secondary" onClick={addCustomProduct}>
              Produkt anlegen
            </button>
          </div>
        </div>

        {template.customProducts.length > 0 && (
          <div className="product-edit-panel">
            <div className="section-header">
              <div>
                <h5>Eigene Produkte verwalten</h5>
                <p className="muted">Passe Details an oder entferne sie aus dem Template.</p>
              </div>
            </div>
            {template.customProducts.map((product) => (
              <div key={product.id} className="modal-grid">
                <label>
                  Produktname
                  <input
                    value={product.name}
                    onChange={(e) => updateCustomProduct(product.id, 'name', e.target.value)}
                  />
                </label>
                <label>
                  Preis
                  <input value={product.price} onChange={(e) => updateCustomProduct(product.id, 'price', e.target.value)} />
                </label>
                <label className="span-2">
                  Beschreibung
                  <textarea
                    value={product.description}
                    rows={2}
                    onChange={(e) => updateCustomProduct(product.id, 'description', e.target.value)}
                  />
                </label>
                <div className="action-buttons inline">
                  <button type="button" className="ghost-button" onClick={() => removeCustomProduct(product.id)}>
                    Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
