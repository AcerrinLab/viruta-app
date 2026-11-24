import { useEffect, useState } from 'react';

/**
 * Cartel discreto mientras el servidor despierta. En los planes gratis el backend se duerme y la
 * primera visita puede tardar hasta un minuto: mejor decirlo que dejar la pantalla quieta.
 */
export default function AvisoServidor() {
  const [despertando, setDespertando] = useState(false);
  useEffect(() => {
    const oir = (e) => setDespertando(e.detail === 'despertando');
    window.addEventListener('viruta-servidor', oir);
    return () => window.removeEventListener('viruta-servidor', oir);
  }, []);
  if (!despertando) return null;
  return (
    <div className="aviso-servidor" role="status" aria-live="polite">
      <span className="aviso-servidor-punto" aria-hidden="true" />
      Estamos despertando el servidor. Puede tardar unos segundos la primera vez.
    </div>
  );
}
