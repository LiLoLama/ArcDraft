import { useMemo, useState } from 'react';
import useCustomerStyleStore from '../store/customerStyleStore';

const emptyForm = { name: '', description: '', tone: '', language: 'de' };

export default function CustomerStylesPage() {
  const styles = useCustomerStyleStore((s) => s.styles);
  const addStyle = useCustomerStyleStore((s) => s.addStyle);
  const updateStyle = useCustomerStyleStore((s) => s.updateStyle);
  const removeStyle = useCustomerStyleStore((s) => s.removeStyle);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const filteredStyles = useMemo(() => {
    if (!search) return styles;
    const term = search.toLowerCase();
    return styles.filter((style) => `${style.name} ${style.description}`.toLowerCase().includes(term));
  }, [search, styles]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addStyle({ ...form, name: form.name.trim(), description: form.description.trim() });
    setForm(emptyForm);
  };

  const startEditing = (style) => {
    setEditingId(style.id);
    setEditForm({ name: style.name, description: style.description || '', tone: style.tone || '', language: style.language || 'de' });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateStyle(editingId, { ...editForm });
    setEditingId(null);
    setEditForm(emptyForm);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kundenstile & Sprachen</h1>
          <p className="muted">Verwalte wiederverwendbare Töne und Sprachpräferenzen für deine Kund:innen.</p>
        </div>
        <input
          type="search"
          placeholder="Stile durchsuchen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="products-layout">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Gespeicherte Stile</h2>
              <p className="muted">{styles.length} Varianten</p>
            </div>
          </div>
          <div className="section-scroll">
            {filteredStyles.length ? (
              <div className="product-grid management">
                {filteredStyles.map((style) => (
                  <article key={style.id} className="product-row">
                    {editingId === style.id ? (
                      <div className="product-edit-row">
                        <div className="grid grid-2">
                          <label>
                            Name
                            <input name="name" value={editForm.name} onChange={handleEditChange} />
                          </label>
                          <label>
                            Sprache
                            <select name="language" value={editForm.language} onChange={handleEditChange}>
                              <option value="de">Deutsch</option>
                              <option value="en">Englisch</option>
                              <option value="fr">Französisch</option>
                            </select>
                          </label>
                        </div>
                        <div className="grid grid-2">
                          <label>
                            Tonalität
                            <input name="tone" value={editForm.tone} onChange={handleEditChange} />
                          </label>
                          <label>
                            Beschreibung
                            <input name="description" value={editForm.description} onChange={handleEditChange} />
                          </label>
                        </div>
                        <div className="action-buttons">
                          <button className="ghost-button" type="button" onClick={() => setEditingId(null)}>
                            Abbrechen
                          </button>
                          <button className="primary" type="button" onClick={saveEdit}>
                            Speichern
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="product-row-content">
                        <div>
                          <strong>{style.name}</strong>
                          <p className="muted">{style.description || 'Keine Beschreibung hinterlegt.'}</p>
                          <p className="muted small">Ton: {style.tone || '—'}</p>
                          <p className="muted small">Sprache: {style.language?.toUpperCase() || '—'}</p>
                        </div>
                        <div className="action-buttons">
                          <button className="ghost-button" type="button" onClick={() => startEditing(style)}>
                            Bearbeiten
                          </button>
                          <button className="ghost-button" type="button" onClick={() => removeStyle(style.id)}>
                            Löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Keine Stile gefunden.</p>
            )}
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Neuer Stil</h2>
              <p className="muted">Hinterlege z. B. Tone-of-Voice und bevorzugte Sprache.</p>
            </div>
          </div>
          <form className="product-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="z. B. Corporate DACH" required />
            </label>
            <label>
              Sprache
              <select name="language" value={form.language} onChange={handleChange}>
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
                <option value="fr">Französisch</option>
              </select>
            </label>
            <label>
              Tonalität
              <input name="tone" value={form.tone} onChange={handleChange} placeholder="z. B. seriös, freundlich" />
            </label>
            <label>
              Beschreibung
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </label>
            <button className="primary" type="submit">
              Stil speichern
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
