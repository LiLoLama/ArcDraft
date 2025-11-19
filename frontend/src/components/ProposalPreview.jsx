import { StatusBadge } from './StatusBadge';

export function ProposalPreview({ proposal }) {
  if (!proposal) return null;
  return (
    <div className="proposal-preview">
      <header>
        <div>
          <h2>{proposal.title}</h2>
          <p className="muted">Recipient: {proposal.recipient?.name}</p>
        </div>
        <StatusBadge status={proposal.status} />
      </header>
      <div className="proposal-sections">
        {proposal.sections?.map((section) => (
          <section key={section.id} id={`section-${section.id}`}>
            <h3>{section.title}</h3>
            <SectionRenderer section={section} />
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionRenderer({ section }) {
  switch (section.type) {
    case 'pricing':
      return (
        <table className="pricing-table">
          <tbody>
            {section.content?.rows?.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <div className="pricing-title">{row.title}</div>
                  <div className="muted">{row.description}</div>
                </td>
                <td className="price">{row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'hero':
      return (
        <div className="hero-block">
          <h1>{section.content?.title}</h1>
          <p>{section.content?.subtitle}</p>
        </div>
      );
    default:
      return <p>{section.content?.text || section.content?.body || '—'}</p>;
  }
}
