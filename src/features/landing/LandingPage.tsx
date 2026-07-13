import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleBrain } from './ParticleBrain';

const VOID = '#000000';
const WHITE = '#ffffff';
const ASH = '#9a9a9a';
const SILVER = '#bdbdbd';
const IRIS = '#8052ff';
const SAFFRON = '#ffb829';
const FONT = "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";

const MODULES: { name: string; body: string }[] = [
  { name: 'План развития', body: 'Дорожная карта: Гант и канбан, теги, приоритеты, автопрогресс.' },
  { name: 'Roadmap разработки', body: 'Операционный роадмап с исполнителями и расчётом задержек.' },
  { name: 'Очередь задач', body: 'Три потока, импорт Excel и понедельная логика переноса.' },
  { name: 'Планирование недели', body: 'Личные задачи команды: кто, что и когда.' },
  { name: 'Статистика багов', body: 'Ежедневная динамика открытых и закрытых багов.' },
  { name: 'Дашборд', body: 'Просрочки, готовность фич и динамика багов на одном экране.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const login = () => navigate('/login');

  const label: CSSProperties = { color: SAFFRON, fontSize: 14, fontWeight: 600, letterSpacing: '0.35px', textTransform: 'uppercase', marginBottom: 22 };
  const body: CSSProperties = { color: SILVER, fontSize: 18, fontWeight: 200, lineHeight: 1.55, maxWidth: 480 };
  const heading = (size: string): CSSProperties => ({ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.08, color: WHITE, fontSize: size, marginBottom: 26 });
  const pill: CSSProperties = { background: IRIS, color: WHITE, border: 'none', cursor: 'pointer', borderRadius: 24, padding: '15px 26px', fontSize: 14, fontWeight: 600, letterSpacing: '0.35px', textTransform: 'uppercase' };

  return (
    <div style={{ background: VOID, color: WHITE, fontFamily: FONT, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        .vdms-cta { transition: transform .15s ease, opacity .15s ease; }
        .vdms-cta:hover { transform: translateY(-1px); opacity: .92; }
        .vdms-ghost { color: ${ASH}; transition: color .15s ease; }
        .vdms-ghost:hover { color: ${WHITE}; }
        /* keep text readable while particle transitions pass behind it */
        .vdms-txt { text-shadow: 0 2px 34px rgba(0,0,0,0.92), 0 0 14px rgba(0,0,0,0.7); }
        .vdms-sec { max-width: 1280px; margin: 0 auto; padding: 0 48px; position: relative; z-index: 1;
                    min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 40px; }
        .vdms-col-left  { grid-column: 1; }
        .vdms-col-right { grid-column: 2; }
        @media (max-width: 900px) {
          .vdms-sec { grid-template-columns: 1fr; }
          .vdms-col-left, .vdms-col-right { grid-column: 1; }
        }
      `}</style>

      <ParticleBrain />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 3, maxWidth: 1280, margin: '0 auto', padding: '24px 48px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="vdms-txt">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden><polygon points="11,2 20,19 2,19" fill={IRIS} /></svg>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>VDMS</span>
        </div>
        <button type="button" onClick={login} className="vdms-ghost"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, letterSpacing: '0.35px', textTransform: 'uppercase' }}>
          Войти
        </button>
      </nav>

      {/* S1 — text LEFT (nudged up), VDMS logo RIGHT */}
      <section className="vdms-sec">
        <div className="vdms-col-left vdms-txt" style={{ transform: 'translateY(-36px)', paddingRight: 12 }}>
          <div style={label}>VDMS — Система управления разработкой</div>
          <h1 style={heading('clamp(44px, 6vw, 84px)')}>Вся разработка —<br />в одном месте.</h1>
          <p style={{ ...body, marginBottom: 34 }}>
            VDMS заменяет пять разрозненных Excel-таблиц единой средой — в реальном времени,
            с автоматическим прогрессом и полной историей изменений.
          </p>
          <button type="button" onClick={login} className="vdms-cta" style={pill}>Войти</button>
        </div>
      </section>

      {/* S2 — VTB logo LEFT, text RIGHT (nudged down) */}
      <section className="vdms-sec">
        <div className="vdms-col-right vdms-txt" style={{ transform: 'translateY(44px)' }}>
          <div style={{ ...label, marginLeft: 4 }}>Как устроено</div>
          <h2 style={heading('clamp(30px, 4vw, 52px)')}>Шесть разделов.<br />Одна система.</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {MODULES.map((m, i) => (
              <div key={m.name} style={{ marginLeft: (i % 2 === 0 ? 0 : 22) }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: IRIS, fontSize: 13, fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ color: WHITE, fontSize: 19, fontWeight: 400, letterSpacing: '-0.02em' }}>{m.name}</span>
                </div>
                <p style={{ color: SILVER, fontSize: 15, fontWeight: 200, lineHeight: 1.4, marginTop: 2, paddingLeft: 26 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S3 — bulb RIGHT, text LEFT (slightly up, nudged right) */}
      <section className="vdms-sec">
        <div className="vdms-col-left vdms-txt" style={{ transform: 'translate(28px, -14px)' }}>
          <div style={label}>Ясность и доступ</div>
          <h2 style={heading('clamp(30px, 4vw, 52px)')}>От хаоса таблиц —<br />к моменту ясности.</h2>
          <p style={{ ...body, maxWidth: 500 }}>
            Супер-администратор, администратор, менеджер и разработчик видят ровно то, что им нужно.
            Права разграничены на уровне базы данных, а каждое изменение фиксируется в истории —
            прозрачно и безопасно.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '40px 48px',
                       display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="vdms-txt">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="18" height="18" viewBox="0 0 22 22" aria-hidden><polygon points="11,2 20,19 2,19" fill={IRIS} /></svg>
          <span style={{ color: ASH, fontSize: 12 }}>© VDMS · Система управления разработкой</span>
        </div>
        <button type="button" onClick={login} className="vdms-ghost"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.35px', textTransform: 'uppercase' }}>
          Войти
        </button>
      </footer>
    </div>
  );
}
