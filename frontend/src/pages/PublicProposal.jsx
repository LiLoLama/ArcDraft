import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { ProposalPreview } from '../components/ProposalPreview';
import { SignatureCapture } from '../components/SignatureCapture';

export default function PublicProposalPage() {
  const { slug } = useParams();
  const [proposal, setProposal] = useState(null);
  const [branding, setBranding] = useState(null);
  const [needsPasscode, setNeedsPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [signature, setSignature] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadProposal = async () => {
    try {
      const data = await apiRequest(`/api/public/proposals/${slug}`);
      if (data.requiresPasscode) {
        setNeedsPasscode(true);
      } else {
        setProposal(data.proposal);
        setBranding(data.branding);
      }
    } catch (err) {
      setStatusMessage('Proposal nicht gefunden');
    }
  };

  useEffect(() => {
    loadProposal();
  }, [slug]);

  useEffect(() => {
    if (!proposal) return;
    apiRequest(`/api/public/proposals/${slug}/events`, {
      method: 'POST',
      body: { eventType: 'view', metadata: { userAgent: navigator.userAgent } },
    });
    const onScroll = () => {
      const scrollPercent = Math.min(100, Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100));
      apiRequest(`/api/public/proposals/${slug}/events`, {
        method: 'POST',
        body: { eventType: 'scroll_depth', metadata: { scrollPercent } },
      });
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [proposal, slug]);

  const verifyPasscode = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest(`/api/public/proposals/${slug}/verify-passcode`, { method: 'POST', body: { passcode } });
      setProposal(data.proposal);
      setBranding(data.branding);
      setNeedsPasscode(false);
    } catch (err) {
      setStatusMessage('Passcode falsch');
    }
  };

  const handleSign = async () => {
    if (!signature || !accepted) {
      setStatusMessage('Bitte Signatur erfassen und Bedingungen akzeptieren');
      return;
    }
    try {
      const response = await apiRequest(`/api/public/proposals/${slug}/sign`, {
        method: 'POST',
        body: {
          signerName,
          signerEmail,
          signatureType: signature.type,
          signatureData: signature.data,
        },
      });
      setProposal(response.proposal);
      setStatusMessage('Erfolgreich unterschrieben.');
    } catch (err) {
      setStatusMessage('Signatur fehlgeschlagen');
    }
  };

  if (needsPasscode) {
    return (
      <div className="public-shell">
        <form className="passcode-form" onSubmit={verifyPasscode}>
          <h2>Passcode benötigt</h2>
          <input value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Passcode" />
          <button className="primary" type="submit">
            Öffnen
          </button>
          <p>{statusMessage}</p>
        </form>
      </div>
    );
  }

  if (!proposal) return <p>{statusMessage || 'Lade Proposal…'}</p>;

  return (
    <div className="public-proposal" style={{ '--primary': branding?.primaryColor || '#3EF0E7' }}>
      <header className="public-header">
        <div>
          {branding?.logoUrl && <img src={branding.logoUrl} alt="logo" />}
          <h1>{proposal.title}</h1>
          <p className="muted">{proposal.recipient?.company}</p>
        </div>
      </header>
      <main className="public-main">
        <article>
          <ProposalPreview proposal={proposal} />
          <div className="signature-panel">
            <h2>Unterschrift</h2>
            <label>
              Vollständiger Name
              <input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
            </label>
            <label>
              E-Mail
              <input value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder={proposal.recipient?.email} />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Ich akzeptiere dieses Proposal
            </label>
            <SignatureCapture onChange={setSignature} />
            <button className="primary" onClick={handleSign}>
              Verbindlich unterschreiben
            </button>
            {statusMessage && <p>{statusMessage}</p>}
          </div>
        </article>
        <aside>
          <h3>Inhalt</h3>
          <ul>
            {proposal.sections?.map((section) => (
              <li key={section.id}>
                <a href={`#section-${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
