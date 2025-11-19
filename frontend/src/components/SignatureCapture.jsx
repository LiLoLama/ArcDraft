import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function SignatureCapture({ onChange }) {
  const sigRef = useRef();
  const [mode, setMode] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('');

  const handleClear = () => {
    if (sigRef.current) sigRef.current.clear();
    onChange(null);
  };

  const handleEnd = () => {
    if (sigRef.current) {
      onChange({ type: 'drawn', data: sigRef.current.getTrimmedCanvas().toDataURL('image/png') });
    }
  };

  const handleTyped = (value) => {
    setTypedSignature(value);
    onChange({ type: 'typed', data: value });
  };

  return (
    <div className="signature-capture">
      <div className="tab-switcher">
        <button className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')} type="button">
          Zeichnen
        </button>
        <button className={mode === 'type' ? 'active' : ''} onClick={() => setMode('type')} type="button">
          Typisieren
        </button>
      </div>
      {mode === 'draw' ? (
        <div>
          <SignatureCanvas
            penColor="#111"
            ref={sigRef}
            canvasProps={{ width: 500, height: 200, className: 'signature-canvas' }}
            onEnd={handleEnd}
          />
          <button type="button" className="ghost-button" onClick={handleClear}>
            Zurücksetzen
          </button>
        </div>
      ) : (
        <input
          value={typedSignature}
          onChange={(e) => handleTyped(e.target.value)}
          className="signature-typed"
          placeholder="Vollständiger Name"
        />
      )}
    </div>
  );
}
