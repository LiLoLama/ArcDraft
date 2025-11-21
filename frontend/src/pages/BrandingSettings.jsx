import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useBrandingStore from '../store/brandingStore';
import useCustomerStyleStore from '../store/customerStyleStore';

export default function BrandingSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const branding = useBrandingStore((s) => s.branding);
  const fetchBranding = useBrandingStore((s) => s.fetchBranding);
  const saveBranding = useBrandingStore((s) => s.saveBranding);
  const setBranding = useBrandingStore((s) => s.setBranding);
  const [form, setForm] = useState({ logoUrl: '', primaryColor: '#3EF0E7', accentColor: '#FF6A3D', fontFamily: 'Inter' });
  const [saveState, setSaveState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const styles = useCustomerStyleStore((s) => s.styles);
  const initializeStyles = useCustomerStyleStore((s) => s.initializeStyles);
  const addStyle = useCustomerStyleStore((s) => s.addStyle);
  const updateStyle = useCustomerStyleStore((s) => s.updateStyle);
  const removeStyle = useCustomerStyleStore((s) => s.removeStyle);
  const [styleForm, setStyleForm] = useState({ name: '', description: '', tone: '', language: 'de' });
  const [editingStyleId, setEditingStyleId] = useState(null);
  const [showStyleForm, setShowStyleForm] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchBranding(token).then((data) => {
      if (data) setForm((prev) => ({ ...prev, ...data }));
    });
  }, [fetchBranding, token]);

  useEffect(() => {
    initializeStyles();
  }, [initializeStyles]);

  useEffect(() => {
    if (branding) {
      setForm((prev) => ({ ...prev, ...branding }));
    }
  }, [branding]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async () => {
    if (!token) {
      setSaveState('Fehlender Login');
      return;
    }
    try {
      setIsSaving(true);
      setSaveState('');
      const saved = await saveBranding(token, form);
      setBranding(saved);
      setForm((prev) => ({ ...prev, ...saved }));
      setSaveState('Gespeichert');
    } catch (e) {
      const message = e.message || 'Fehler beim Speichern';
      if (message.toLowerCase().includes('invalid token')) {
        setSaveState('Session abgelaufen. Bitte erneut einloggen.');
        logout();
      } else {
        setSaveState(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleStyleChange = (e) => {
    setStyleForm({ ...styleForm, [e.target.name]: e.target.value });
  };

  const startEditStyle = (style) => {
    setEditingStyleId(style.id);
    setStyleForm({
      name: style.name || '',
      description: style.description || '',
      tone: style.tone || '',
      language: style.language || 'de',
    });
    setShowStyleForm(true);
  };

  const startCreateStyle = () => {
    setEditingStyleId(null);
    setStyleForm({ name: '', description: '', tone: '', language: 'de' });
    setShowStyleForm(true);
  };

  const resetStyleForm = () => {
    setEditingStyleId(null);
    setStyleForm({ name: '', description: '', tone: '', language: 'de' });
    setShowStyleForm(false);
  };

  const saveStyle = (e) => {
    e.preventDefault();
    if (!styleForm.name.trim()) return;
    if (editingStyleId) {
      updateStyle(editingStyleId, { ...styleForm, name: styleForm.name.trim() });
    } else {
      addStyle({ ...styleForm, name: styleForm.name.trim() });
    }
    resetStyleForm();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Branding</h1>
          <p className="muted">Passe Branding und Darstellung deiner App zentral an.</p>
        </div>
        <div className="header-actions">
          {saveState && <span className="muted">{saveState}</span>}
          <button className="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>
      <section className="appearance-card">
        <div className="section-header">
          <div>
            <p className="tagline">Interface</p>
            <h2>Darstellung & Theme</h2>
            <p className="muted">Dark Mode ist die Voreinstellung und nur hier änderbar.</p>
          </div>
        </div>
        <div className="theme-options">
          {[
            { id: 'dark', label: 'Dunkler Modus', description: 'Beste Lesbarkeit, hohe Kontraste.' },
            { id: 'light', label: 'Heller Modus', description: 'Klassischer Look mit mehr Weißraum.' },
          ].map((option) => (
            <label key={option.id} className={`theme-option ${theme === option.id ? 'selected' : ''}`}>
              <input type="radio" name="theme" value={option.id} checked={theme === option.id} onChange={handleThemeChange} />
              <span className="theme-label">{option.label}</span>
              <span className="muted">{option.description}</span>
            </label>
          ))}
        </div>
      </section>
      <div className="grid grid-2 brand-grid">
        <div className="logo-upload-field">
          <span className="field-label">Logo Upload</span>
          <p className="muted">Unterstützt PNG, JPG oder SVG. Wir speichern das Bild verschlüsselt.</p>
          <div className="logo-upload-panel">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo Vorschau" className="logo-preview" />
            ) : (
              <div className="logo-placeholder">Noch kein Logo hochgeladen</div>
            )}
            <div className="logo-upload-actions">
              <label className="upload-button">
                Bild auswählen
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
              </label>
              {form.logoUrl && (
                <button type="button" className="ghost-button small" onClick={handleLogoRemove}>
                  Entfernen
                </button>
              )}
            </div>
          </div>
        </div>
        <label>
          Primary Color
          <input name="primaryColor" value={form.primaryColor || ''} onChange={handleChange} />
        </label>
        <label>
          Accent Color
          <input name="accentColor" value={form.accentColor || ''} onChange={handleChange} />
        </label>
        <label>
          Font Family
          <input name="fontFamily" value={form.fontFamily || ''} onChange={handleChange} />
        </label>
      </div>

      <section className="section-card">
        <div className="section-header">
          <div>
            <p className="tagline">Kommunikationsleitplanken</p>
            <h2>Standardstile</h2>
            <p className="muted">Verwalte zentrale Tone-of-Voice Presets, die du Kunden und Templates zuordnen kannst.</p>
          </div>
        </div>
        {styles.length ? (
          <div className="product-grid management">
            {styles.map((style) => (
              <article key={style.id} className="product-row">
                <div className="product-row-content">
                  <div>
                    <strong>{style.name}</strong>
                    <p className="muted">{style.description || 'Keine Beschreibung hinterlegt.'}</p>
                    <p className="muted small">Ton: {style.tone || '—'}</p>
                    <p className="muted small">Sprache: {style.language?.toUpperCase() || '—'}</p>
                  </div>
                  <div className="action-buttons">
                    <button type="button" className="ghost-button" onClick={() => startEditStyle(style)}>
                      Bearbeiten
                    </button>
                    <button type="button" className="ghost-button" onClick={() => removeStyle(style.id)}>
                      Löschen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Noch keine Standardstile angelegt.</p>
        )}

        <div className="style-actions">
          <button type="button" className="secondary" onClick={startCreateStyle}>
            Neuen Standardstil erstellen
          </button>
        </div>

        {(showStyleForm || editingStyleId) && (
          <div className="product-edit-panel style-form-panel">
            <form className="product-form" onSubmit={saveStyle}>
              <div className="grid grid-2">
                <label>
                  Name
                  <input
                    name="name"
                    value={styleForm.name}
                    onChange={handleStyleChange}
                    placeholder="z. B. Corporate DACH"
                    required
                  />
                </label>
                <label>
                  Sprache
                  <select name="language" value={styleForm.language} onChange={handleStyleChange}>
                    <option value="de">Deutsch</option>
                    <option value="en">Englisch</option>
                    <option value="fr">Französisch</option>
                  </select>
                </label>
              </div>
              <label>
                Tonalität
                <input name="tone" value={styleForm.tone} onChange={handleStyleChange} placeholder="z. B. seriös, freundlich" />
              </label>
              <label>
                Beschreibung
                <textarea name="description" value={styleForm.description} onChange={handleStyleChange} rows={3} />
              </label>
              <div className="action-buttons">
                <button type="button" className="ghost-button" onClick={resetStyleForm}>
                  Abbrechen
                </button>
                <button className="primary" type="submit">
                  {editingStyleId ? 'Stil aktualisieren' : 'Neuen Stil speichern'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
