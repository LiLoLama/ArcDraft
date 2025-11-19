import { useMemo, useState } from 'react';
import useProductStore from '../store/productStore';

const emptyForm = { name: '', description: '', price: '' };

export default function ProductsPage() {
  const products = useProductStore((s) => s.products);
  const addProduct = useProductStore((s) => s.addProduct);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const term = search.toLowerCase();
    return products.filter((product) => {
      const haystack = `${product.name} ${product.description || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [products, search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    addProduct({
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim() || 'Preis auf Anfrage',
    });
    setForm(emptyForm);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">Verwalte deine Leistungen zentral und verwende sie später in Proposals.</p>
        </div>
        <input
          type="search"
          placeholder="Suchen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="products-layout">
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Aktive Produkte</h2>
              <p className="muted">{products.length} Einträge</p>
            </div>
          </div>
          {filteredProducts.length ? (
            <div className="product-grid management">
              {filteredProducts.map((product) => (
                <article key={product.id} className="product-row">
                  <div>
                    <span className="price-pill">{product.price}</span>
                    <strong>{product.name}</strong>
                    <p className="muted">{product.description || 'Keine Beschreibung hinterlegt.'}</p>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => removeProduct(product.id)}>
                    Löschen
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Keine Produkte gefunden.</p>
          )}
        </section>
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Neues Produkt</h2>
              <p className="muted">Benenne Leistungen und füge Preise oder Hinweise hinzu.</p>
            </div>
          </div>
          <form className="product-form" onSubmit={handleSubmit}>
            <label>
              Produktname
              <input name="name" value={form.name} onChange={handleChange} placeholder="z. B. Discovery Sprint" required />
            </label>
            <label>
              Beschreibung
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Welche Ergebnisse liefert das Produkt?"
                rows={4}
              />
            </label>
            <label>
              Preis
              <input name="price" value={form.price} onChange={handleChange} placeholder="z. B. €2.200 / Monat" />
            </label>
            <button className="primary" type="submit">
              Produkt speichern
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
