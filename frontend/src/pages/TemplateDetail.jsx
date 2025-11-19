import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import useAuthStore from '../store/authStore';

const emptyTemplate = {
  name: '',
  description: '',
  status: 'draft',
  variablesSchema: [],
  sections: [],
};

const sectionTypes = ['hero', 'text', 'pricing', 'signature_block', 'custom'];

export default function TemplateDetailPage() {
  const token = useAuthStore((s) => s.token);
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(emptyTemplate);

  useEffect(() => {
    if (id === 'new') return;
    apiRequest(`/api/templates/${id}`, { token }).then(setTemplate);
  }, [id, token]);

  const updateField = (field, value) => setTemplate((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (id === 'new') {
      const created = await apiRequest('/api/templates', { method: 'POST', token, body: template });
      navigate(`/templates/${created.id}`);
    } else {
      const updated = await apiRequest(`/api/templates/${id}`, { method: 'PUT', token, body: template });
      setTemplate(updated);
    }
  };

  const addVariable = () => {
    updateField('variablesSchema', [...template.variablesSchema, { key: '', label: '', type: 'string' }]);
  };

  const updateVariable = (index, field, value) => {
    const next = [...template.variablesSchema];
    next[index] = { ...next[index], [field]: value };
    updateField('variablesSchema', next);
  };

  const addSection = () => {
    const idValue = crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    updateField('sections', [...template.sections, { id: idValue, title: 'Neue Section', type: 'text', contentStructure: { text: '' } }]);
  };

  const updateSection = (index, field, value) => {
    const next = [...template.sections];
    next[index] = { ...next[index], [field]: value };
    updateField('sections', next);
  };

  const updateSectionContent = (index, key, value) => {
    const next = [...template.sections];
    next[index] = { ...next[index], contentStructure: { ...next[index].contentStructure, [key]: value } };
    updateField('sections', next);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Template</h1>
          <p className="muted">Definiere strukturierte Bausteine.</p>
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
          <h2>Variablen</h2>
          <button className="ghost-button" onClick={addVariable}>
            + Variable
          </button>
        </div>
        {template.variablesSchema.map((variable, index) => (
          <div key={index} className="grid grid-3">
            <input placeholder="key" value={variable.key} onChange={(e) => updateVariable(index, 'key', e.target.value)} />
            <input placeholder="label" value={variable.label} onChange={(e) => updateVariable(index, 'label', e.target.value)} />
            <select value={variable.type} onChange={(e) => updateVariable(index, 'type', e.target.value)}>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="textarea">Textarea</option>
            </select>
          </div>
        ))}
      </section>
      <section>
        <div className="section-header">
          <h2>Sections</h2>
          <button className="ghost-button" onClick={addSection}>
            + Section
          </button>
        </div>
        <div className="sections-list">
          {template.sections.map((section, index) => (
            <div key={section.id || index} className="section-card">
              <div className="grid grid-2">
                <input value={section.title} onChange={(e) => updateSection(index, 'title', e.target.value)} />
                <select value={section.type} onChange={(e) => updateSection(index, 'type', e.target.value)}>
                  {sectionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {section.type === 'pricing' ? (
                <textarea
                  value={JSON.stringify(section.contentStructure?.rows || [], null, 2)}
                  onChange={(e) => updateSectionContent(index, 'rows', JSON.parse(e.target.value || '[]'))}
                  rows={4}
                />
              ) : (
                <textarea
                  value={section.contentStructure?.text || ''}
                  onChange={(e) => updateSectionContent(index, 'text', e.target.value)}
                  rows={4}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
