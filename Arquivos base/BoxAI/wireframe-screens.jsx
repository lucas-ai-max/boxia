// BoxIA wireframe screens — sketchy, low-fi
// All screens use Caveat (handwritten) + Architects Daughter for headings,
// with Kalam for body. B&W with a single accent.

const ACCENT = '#FF6B4A';
const ACCENT_SOFT = '#FFE4DB';
const INK = '#1a1a1a';
const PAPER = '#FAFAF7';
const SKETCH = '#2a2a2a';

// ── Sketchy primitives ────────────────────────────────────────
const Box = ({ children, style = {}, dashed = false, fill, h, w, rough = true, onClick }) => (
  <div onClick={onClick} style={{
    border: `1.8px ${dashed ? 'dashed' : 'solid'} ${SKETCH}`,
    borderRadius: rough ? '14px 12px 13px 11px / 11px 13px 12px 14px' : 10,
    padding: '8px 10px',
    background: fill || 'transparent',
    height: h, width: w,
    boxSizing: 'border-box',
    position: 'relative',
    ...style,
  }}>{children}</div>
);

const Pill = ({ children, fill, style = {}, active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    border: `1.5px solid ${SKETCH}`,
    borderRadius: '20px 18px 22px 19px / 18px 22px 19px 21px',
    padding: '3px 10px',
    fontSize: 13,
    background: active ? ACCENT : (fill || 'transparent'),
    color: active ? '#fff' : INK,
    fontFamily: 'Kalam, cursive',
    ...style,
  }}>{children}</span>
);

const Btn = ({ children, primary, style = {}, full, h = 44 }) => (
  <div style={{
    border: `2px solid ${SKETCH}`,
    borderRadius: '14px 12px 14px 12px / 12px 14px 12px 14px',
    padding: '0 16px',
    height: h,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: primary ? ACCENT : '#fff',
    color: primary ? '#fff' : INK,
    fontFamily: '"Architects Daughter", cursive',
    fontSize: 15,
    fontWeight: 600,
    width: full ? '100%' : undefined,
    boxShadow: primary ? '2px 2px 0 ' + SKETCH : '1px 1px 0 ' + SKETCH,
    ...style,
  }}>{children}</div>
);

const Squiggle = ({ w = '100%', short }) => (
  <svg width={w} height="6" viewBox="0 0 200 6" preserveAspectRatio="none" style={{ display: 'block' }}>
    <path d={short
      ? "M2 3 Q 20 1, 40 3 T 80 3 T 120 3"
      : "M2 3 Q 20 1, 40 3 T 80 3 T 120 3 T 160 3 T 198 3"}
      stroke={SKETCH} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
  </svg>
);

const TextLine = ({ w = '90%', dark }) => (
  <div style={{
    height: 8, width: w, background: dark ? '#444' : '#bbb',
    borderRadius: 4, margin: '4px 0',
  }} />
);

const Avatar = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `1.8px solid ${SKETCH}`,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Caveat, cursive', fontSize: size * 0.5, fontWeight: 700,
    color: SKETCH,
    flexShrink: 0,
  }}>C</div>
);

const ImgPlaceholder = ({ h = 60, label = 'img' }) => (
  <div style={{
    height: h, background: '#eee',
    border: `1.5px dashed ${SKETCH}`,
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#888', fontFamily: 'monospace', fontSize: 11,
    position: 'relative', overflow: 'hidden',
  }}>
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
      <line x1="0" y1="0" x2="100%" y2="100%" stroke={SKETCH} strokeWidth="1"/>
      <line x1="100%" y1="0" x2="0" y2="100%" stroke={SKETCH} strokeWidth="1"/>
    </svg>
    <span style={{ position: 'relative', background: '#eee', padding: '0 4px' }}>{label}</span>
  </div>
);

const ScoreDot = ({ score }) => {
  const color = score >= 70 ? '#2a8c3a' : score >= 40 ? '#c89020' : '#999';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Caveat, cursive', fontSize: 14, fontWeight: 700, color,
      flexShrink: 0,
    }}>{score}</div>
  );
};

// Status bar (lo-fi)
const StatusBar = () => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 22px 6px', fontFamily: 'Caveat, cursive', fontSize: 16,
    fontWeight: 700, color: INK,
  }}>
    <span>9:41</span>
    <span style={{ display: 'flex', gap: 4, fontSize: 14 }}>•••  ▮▮▮</span>
  </div>
);

const HomeBar = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px' }}>
    <div style={{ width: 110, height: 4, background: SKETCH, borderRadius: 2 }} />
  </div>
);

// Wrap: phone-shaped page (no real bezel — sketch frame)
const Phone = ({ children, label, w = 320, h = 640 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: w, height: h,
      border: `2.5px solid ${SKETCH}`,
      borderRadius: '36px 34px 36px 34px / 34px 36px 34px 36px',
      background: PAPER,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '4px 4px 0 ' + SKETCH,
      fontFamily: 'Kalam, cursive',
      color: INK,
    }}>
      <StatusBar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      <HomeBar />
    </div>
    {label && (
      <div style={{
        fontFamily: 'Caveat, cursive', fontSize: 18, color: SKETCH,
        textAlign: 'center', maxWidth: w + 20,
      }}>{label}</div>
    )}
  </div>
);

// ─── SCREENS ──────────────────────────────────────────────────

// S1 — Onboarding: Welcome
function Welcome() {
  return (
    <Phone label="① Onboarding — boas-vindas">
      <div style={{ flex: 1, padding: '40px 24px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 38, lineHeight: 1, fontWeight: 700 }}>
          Box<span style={{ color: ACCENT }}>IA</span>
        </div>
        <Squiggle />
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 24, lineHeight: 1.1, marginTop: 4 }}>
          Você grava.<br/>
          A gente lê, classifica<br/>
          e responde no seu tom.
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box style={{ padding: 20, width: '100%', textAlign: 'center', background: '#fff' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>
              [ilustração — caixinha sendo lida]
            </div>
            <div style={{ fontSize: 56, color: ACCENT, lineHeight: 1, margin: '14px 0' }}>📦✨</div>
            <div style={{ fontSize: 13, fontFamily: 'Kalam, cursive' }}>caixinha → IA → resposta</div>
          </Box>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn primary full>Continuar com Google</Btn>
          <Btn full>Email + senha</Btn>
        </div>
        <div style={{ fontSize: 11, textAlign: 'center', color: '#777' }}>
          ao continuar, você aceita nossos termos
        </div>
      </div>
    </Phone>
  );
}

// S2 — Onboarding: DNA da marca
function BrandDNA() {
  return (
    <Phone label="② Onboarding — DNA da marca">
      <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: 'Caveat, cursive', fontSize: 14, color: '#888' }}>passo 2 de 3</span>
        <span style={{ fontSize: 14, color: '#888' }}>pular</span>
      </div>
      <div style={{ padding: '8px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 26, lineHeight: 1.1, fontWeight: 700 }}>
          Qual é o seu<br/>tom de voz?
        </div>
        <div style={{ fontFamily: 'Kalam, cursive', fontSize: 14, color: '#555' }}>
          A IA vai imitar isso. Suba um manual<br/>ou cole um texto.
        </div>

        <Box dashed style={{ padding: 18, textAlign: 'center', background: '#fff' }}>
          <div style={{ fontSize: 30 }}>📄</div>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, marginTop: 4 }}>
            Subir PDF
          </div>
          <div style={{ fontSize: 11, color: '#888' }}>até 10MB</div>
        </Box>

        <div style={{ textAlign: 'center', fontFamily: 'Caveat, cursive', fontSize: 16, color: '#888' }}>
          ── ou ──
        </div>

        <Box style={{ background: '#fff', padding: 12, flex: 1, minHeight: 100 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Cole seu manual aqui...</div>
          <TextLine w="92%" />
          <TextLine w="78%" />
          <TextLine w="86%" />
          <TextLine w="40%" />
        </Box>

        <div>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 14, marginBottom: 6 }}>
            + Exemplos de tom (opcional)
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill>+ exemplo</Pill>
            <Pill fill={ACCENT_SOFT}>"oi gente, bom dia..."</Pill>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 22px 14px' }}>
        <Btn primary full>Salvar e continuar →</Btn>
      </div>
    </Phone>
  );
}

// S3 — Home / Histórico
function Home() {
  return (
    <Phone label="③ Home — histórico de sessões">
      <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Avatar />
        <Box rough fill={ACCENT_SOFT} style={{ padding: '4px 12px' }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 700 }}>
            🟢 47 pares
          </span>
        </Box>
        <div style={{ fontSize: 22 }}>≡</div>
      </div>
      <div style={{ padding: '4px 20px 10px' }}>
        <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
          Olá, Camila
        </div>
        <div style={{ fontFamily: 'Kalam, cursive', fontSize: 14, color: '#666', marginTop: 4 }}>
          últimas sessões ↓
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        {[
          { date: 'hoje, 09:12', src: '🎬 vídeo 4m23s', count: 17, used: '12/17 usadas' },
          { date: 'ontem', src: '🖼 12 prints', count: 12, used: '8/12 usadas' },
          { date: '28 abr', src: '🎬 vídeo 2m08s', count: 9, used: '9/9 usadas ✨' },
          { date: '24 abr', src: '🖼 8 prints', count: 8, used: '5/8 usadas' },
        ].map((s, i) => (
          <Box key={i} style={{ background: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              border: `1.8px solid ${SKETCH}`, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 700,
              flexShrink: 0,
            }}>{s.count}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700 }}>
                {s.src}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>{s.date} · {s.used}</div>
            </div>
            <div style={{ fontSize: 18, color: '#aaa' }}>›</div>
          </Box>
        ))}
      </div>

      <div style={{ padding: '12px 20px 8px' }}>
        <Btn primary full h={52}>＋ Nova sessão</Btn>
      </div>

      {/* tab bar */}
      <div style={{
        display: 'flex', borderTop: `1.5px solid ${SKETCH}`,
        padding: '6px 0',
      }}>
        {['🏠 Home', '📚 Biblioteca', '📊 Métricas', '⚙️'].map((t, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontFamily: 'Caveat, cursive', fontSize: 14,
            color: i === 0 ? ACCENT : '#777', fontWeight: i === 0 ? 700 : 400,
          }}>{t}</div>
        ))}
      </div>
    </Phone>
  );
}

// S4 — Nova sessão
function NewSession() {
  return (
    <Phone label="④ Nova sessão — vídeo ou prints">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>×</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          Nova sessão
        </span>
        <span style={{ width: 22 }} />
      </div>

      <div style={{ padding: '8px 20px', display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <Pill active style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 15 }}>
            🎬 Vídeo
          </Pill>
        </div>
        <div style={{ flex: 1 }}>
          <Pill style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 15 }}>
            🖼 Prints
          </Pill>
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Box dashed style={{
          flex: 1, minHeight: 200,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#fff', textAlign: 'center', padding: 20,
        }}>
          <div style={{ fontSize: 56, lineHeight: 1 }}>🎬</div>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 20, fontWeight: 700, marginTop: 10 }}>
            Toque para escolher<br/>vídeo da galeria
          </div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
            mp4/mov · até 500MB · 15min
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn>📁 Abrir galeria</Btn>
          </div>
        </Box>

        <Box fill={ACCENT_SOFT} style={{ padding: 10, fontSize: 12, lineHeight: 1.4 }}>
          <strong>🔒 Privacidade:</strong> seu vídeo é apagado automaticamente
          em 7 dias. Handles e nomes são removidos.
        </Box>

        <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
          processamento ~ 2min
        </div>
      </div>

      <div style={{ padding: '10px 20px 14px' }}>
        <Btn primary full>Processar →</Btn>
      </div>
    </Phone>
  );
}

// S5 — Processando
function Processing() {
  return (
    <Phone label="⑤ Processando — status em tempo real">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: '#888' }}>Cancelar</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          Processando…
        </span>
        <span style={{ width: 50 }} />
      </div>
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, lineHeight: 1 }}>⚙️</div>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 22, fontWeight: 700, marginTop: 14 }}>
            lendo seu vídeo…
          </div>
          <div style={{ fontFamily: 'Kalam, cursive', fontSize: 14, color: '#666', marginTop: 4 }}>
            ~ 2min restantes
          </div>
        </div>

        {/* progress bar */}
        <div style={{ padding: '0 10px' }}>
          <Box style={{ padding: 0, height: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0, width: '62%',
              background: ACCENT,
            }} />
          </Box>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#777' }}>
            <span>62%</span>
            <span>4m23s de vídeo</span>
          </div>
        </div>

        {/* steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['✓', 'upload concluído', true],
            ['✓', 'enviando p/ IA', true],
            ['•', 'extraindo caixinhas…', false],
            ['○', 'classificando relevância', false],
          ].map(([icon, label, done], i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'Kalam, cursive', fontSize: 14,
              color: done ? INK : '#888',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `1.8px solid ${done ? '#2a8c3a' : SKETCH}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Caveat, cursive', fontSize: 14, fontWeight: 700,
                color: done ? '#2a8c3a' : '#888',
                background: done ? '#e8f5e9' : '#fff',
              }}>{icon}</div>
              {label}
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// S6 — Lista classificada
function ResultsList() {
  const cards = [
    { score: 87, cat: 'oportunidade-lead', q: 'tem como fazer consultoria 1:1 contigo?', urgent: true },
    { score: 76, cat: 'pedido-conteúdo', q: 'faz um vídeo sobre rotina matinal pf 🙏' },
    { score: 71, cat: 'dúvida-produto', q: 'qual creme você usa de manhã?' },
    { score: 58, cat: 'pergunta-pessoal', q: 'mora sozinha? como organiza o tempo?' },
    { score: 42, cat: 'feedback', q: 'amei o último reels mas fica meio rápido' },
  ];
  return (
    <Phone label="⑥ Resultado — caixinhas classificadas">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          Resultado
        </span>
        <span style={{ fontSize: 18 }}>⋯</span>
      </div>

      {/* TRANSPARENCY BANNER */}
      <div style={{ padding: '0 16px 8px' }}>
        <Box fill={ACCENT_SOFT} style={{
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 22 }}>✅</div>
          <div style={{ flex: 1, lineHeight: 1.25 }}>
            <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
              17 caixinhas identificadas
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              vídeo de 4m23s · processado pela IA
            </div>
          </div>
          <span style={{ fontSize: 11, textDecoration: 'underline' }}>ver todas</span>
        </Box>
      </div>

      {/* filter chips */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 6, overflow: 'auto' }}>
        <Pill active>Todas (17)</Pill>
        <Pill>⚠ urgentes (2)</Pill>
        <Pill>por categoria</Pill>
        <Pill>ruído (4)</Pill>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cards.map((c, i) => (
          <Box key={i} style={{ background: '#fff', padding: '10px 12px', display: 'flex', gap: 10 }}>
            <ScoreDot score={c.score} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                <Pill style={{ fontSize: 10, padding: '1px 6px' }}>{c.cat}</Pill>
                {c.urgent && <Pill fill={ACCENT} style={{ fontSize: 10, padding: '1px 6px', color: '#fff', borderColor: ACCENT }}>⚡ urgente</Pill>}
              </div>
              <div style={{ fontFamily: 'Kalam, cursive', fontSize: 13.5, lineHeight: 1.3 }}>
                "{c.q}"
              </div>
            </div>
            <div style={{ fontSize: 18, color: '#aaa', alignSelf: 'center' }}>›</div>
          </Box>
        ))}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#999', padding: 8 }}>
          ── 4 caixinhas marcadas como ruído (toque p/ ver) ──
        </div>
      </div>
    </Phone>
  );
}

// S7 — Detalhe + sugestões (bottom sheet feel)
function ReplyDetail() {
  return (
    <Phone label="⑦ Detalhe + 3 sugestões no seu tom">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: 'Caveat, cursive', fontSize: 14, color: '#888' }}>3 de 17</span>
        <span style={{ fontSize: 18 }}>⋯</span>
      </div>

      {/* Question card */}
      <div style={{ padding: '0 16px 10px' }}>
        <Box style={{ background: '#fff', padding: 14 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <Pill style={{ fontSize: 11 }}>dúvida-produto</Pill>
            <ScoreDot score={71} />
          </div>
          <div style={{ fontFamily: 'Kalam, cursive', fontSize: 16, lineHeight: 1.3 }}>
            "qual creme você usa de manhã?<br/>tô procurando algo pra pele oleosa 🙏"
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
            ⏱ 1m24s · ✨ confiança 92%
          </div>
        </Box>
      </div>

      {/* Sheet handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <div style={{ width: 36, height: 4, background: '#ccc', borderRadius: 2 }} />
      </div>
      <div style={{ padding: '4px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          ✨ sugestões no seu tom
        </span>
        <span style={{ fontSize: 12, color: ACCENT }}>1/3 →</span>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Active suggestion */}
        <Box style={{ background: '#fff', padding: 12, borderColor: ACCENT, borderWidth: 2.5 }}>
          <div style={{ fontFamily: 'Kalam, cursive', fontSize: 14, lineHeight: 1.35 }}>
            adoroo essa pergunta! tô usando o gel da Vichy faz uns 3 meses,
            ele controla a oleosidade sem ressecar 💛 vou gravar um stories sobre!
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
            🔗 inspirado em 3 respostas suas (skincare · jan/26)
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'space-between' }}>
            <Pill style={{ fontSize: 18, padding: '4px 10px' }}>👍</Pill>
            <Pill style={{ fontSize: 16, padding: '4px 10px' }}>✏️</Pill>
            <Pill style={{ fontSize: 16, padding: '4px 10px' }}>🗑</Pill>
            <Pill fill={ACCENT} active style={{ fontSize: 14, padding: '4px 14px', flex: 1, justifyContent: 'center' }}>
              📋 Copiar
            </Pill>
          </div>
        </Box>

        {/* regen chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: 13, color: '#666', alignSelf: 'center' }}>
            regenerar:
          </span>
          <Pill style={{ fontSize: 11 }}>+ curta</Pill>
          <Pill style={{ fontSize: 11 }}>+ informal</Pill>
          <Pill style={{ fontSize: 11 }}>com humor</Pill>
          <Pill style={{ fontSize: 11 }}>+ emoji</Pill>
          <Pill style={{ fontSize: 11 }}>✏️ custom</Pill>
        </div>

        {/* dimmed next suggestions */}
        <Box style={{ background: '#f4f4f0', padding: 10, opacity: 0.7 }}>
          <div style={{ fontFamily: 'Kalam, cursive', fontSize: 13, lineHeight: 1.3 }}>
            usa o gel da Vichy! controla a oleosidade ✨
          </div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>sugestão 2 · mais curta</div>
        </Box>
      </div>
    </Phone>
  );
}

// S8 — Biblioteca
function Library() {
  const items = [
    { q: 'qual creme você usa?', a: 'tô usando o gel da Vichy...', tags: ['skincare', 'auto'] },
    { q: 'mora em SP?', a: 'sim! moro em pinheiros 🌳', tags: ['pessoal', 'print'] },
    { q: 'faz dieta?', a: 'não sigo dieta restritiva, mas...', tags: ['saúde', 'manual'] },
    { q: 'recomenda algum livro?', a: 'tô lendo "atomic habits" agora!', tags: ['conteúdo'] },
  ];
  return (
    <Phone label="⑧ Minha biblioteca de respostas (RAG)">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          Minha biblioteca
        </span>
        <span style={{ fontSize: 18 }}>⋯</span>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <Box fill={ACCENT_SOFT} style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 26 }}>🟢</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
              47 pares · saúde boa
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>+17 nos últimos 7 dias ↑</div>
          </div>
        </Box>
      </div>

      {/* search */}
      <div style={{ padding: '0 16px 8px' }}>
        <Box style={{ background: '#fff', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span style={{ color: '#aaa', fontSize: 13 }}>buscar pergunta ou resposta…</span>
        </Box>
      </div>

      {/* filters */}
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 5, overflow: 'auto' }}>
        <Pill active>Todas</Pill>
        <Pill>skincare</Pill>
        <Pill>pessoal</Pill>
        <Pill>print</Pill>
        <Pill>auto</Pill>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <Box key={i} style={{ background: '#fff', padding: 10 }}>
            <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              ❓ {it.q}
            </div>
            <div style={{ fontFamily: 'Kalam, cursive', fontSize: 13, color: '#444', lineHeight: 1.3 }}>
              💬 {it.a}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {it.tags.map((t, j) => (
                <Pill key={j} style={{ fontSize: 10, padding: '1px 6px' }}>{t}</Pill>
              ))}
            </div>
          </Box>
        ))}
      </div>

      {/* FAB */}
      <div style={{ padding: '8px 16px 12px' }}>
        <Btn primary full h={48}>＋ Adicionar par Q&A</Btn>
      </div>
    </Phone>
  );
}

// S9 — Adicionar histórico (batch prints)
function AddHistorical() {
  return (
    <Phone label="⑨ Importar histórico — batch de prints">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>×</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 15, fontWeight: 700 }}>
          Importar prints
        </span>
        <span style={{ fontSize: 13, color: ACCENT }}>Salvar</span>
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <Box fill={ACCENT_SOFT} style={{ padding: 10 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700 }}>
            ✅ 12 caixinhas identificadas
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            confira e ajuste as respostas antes de salvar
          </div>
        </Box>
      </div>

      {/* tabs */}
      <div style={{ padding: '4px 16px 8px', display: 'flex', gap: 4 }}>
        <Pill active style={{ fontSize: 11 }}>1·2·3</Pill>
        <Pill style={{ fontSize: 11 }}>4·5·6</Pill>
        <Pill style={{ fontSize: 11 }}>7·8·9</Pill>
        <Pill style={{ fontSize: 11 }}>10·11·12</Pill>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((n) => (
          <Box key={n} style={{ background: '#fff', padding: 10, display: 'flex', gap: 10 }}>
            <div style={{ width: 60, flexShrink: 0 }}>
              <ImgPlaceholder h={80} label={`#${n}`} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>pergunta extraída:</div>
              <div style={{ fontFamily: 'Kalam, cursive', fontSize: 12, lineHeight: 1.3, marginBottom: 6 }}>
                "qual seu protetor solar favorito?"
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>sua resposta:</div>
              <Box style={{ padding: 6, fontSize: 12, fontFamily: 'Kalam, cursive', minHeight: 36 }}>
                {n === 1 ? 'uso o anthelios da La Roche…' : <span style={{ color: '#aaa' }}>toque p/ adicionar</span>}
              </Box>
            </div>
          </Box>
        ))}
      </div>

      <div style={{ padding: '8px 16px 12px' }}>
        <Btn primary full>Salvar 12 pares na biblioteca</Btn>
      </div>
    </Phone>
  );
}

// S10 — Métricas / Dashboard
function Metrics() {
  return (
    <Phone label="⑩ Métricas pessoais — evolução">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          Suas métricas
        </span>
        <span style={{ fontSize: 18 }}>⬇</span>
      </div>

      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8 }}>
        <Box style={{ background: '#fff', padding: 12, flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 30, fontWeight: 700, color: ACCENT }}>
            247
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>caixinhas processadas</div>
        </Box>
        <Box style={{ background: '#fff', padding: 12, flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 30, fontWeight: 700, color: ACCENT }}>
            68%
          </div>
          <div style={{ fontSize: 11, color: '#666' }}>taxa de "Usei essa"</div>
        </Box>
      </div>

      {/* chart */}
      <div style={{ padding: '0 16px 12px' }}>
        <Box style={{ background: '#fff', padding: 12 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            Evolução semanal — uso ↑
          </div>
          <svg width="100%" height="100" viewBox="0 0 280 100" preserveAspectRatio="none">
            <path d="M10 80 Q 50 70, 70 60 T 130 50 T 200 35 T 270 20"
              stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M10 80 Q 50 70, 70 60 T 130 50 T 200 35 T 270 20 L 270 95 L 10 95 Z"
              fill={ACCENT} opacity="0.15"/>
            {[10, 70, 130, 200, 270].map((x, i) => (
              <circle key={i} cx={x} cy={[80, 60, 50, 35, 20][i]} r="3" fill={ACCENT}/>
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginTop: 4 }}>
            <span>sem 1</span><span>sem 2</span><span>sem 3</span><span>sem 4</span><span>hoje</span>
          </div>
        </Box>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
        <Box style={{ background: '#fff', padding: 10 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 13, fontWeight: 700 }}>
            🟢 Consistência do tom
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            +12% mais consistente que há 30 dias
          </div>
        </Box>
        <Box style={{ background: '#fff', padding: 10 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 13, fontWeight: 700 }}>
            📚 Biblioteca RAG
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            47 pares · 30 manuais + 17 auto-importados
          </div>
        </Box>
        <Box style={{ background: '#fff', padding: 10 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 13, fontWeight: 700 }}>
            ⚡ Uso do mês
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            21% do limite mensal
          </div>
        </Box>
      </div>
    </Phone>
  );
}

// ─── ALT VARIATIONS ───────────────────────────────────────────

// V-Home: alternative — feed-style with quick stats
function HomeAltA() {
  return (
    <Phone label="③·A Home — variação 'feed' com stats no topo">
      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: '#888' }}>boa tarde,</div>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            Camila ✨
          </div>
        </div>
        <Avatar size={42} />
      </div>

      {/* hero stat row */}
      <div style={{ padding: '8px 16px 10px', display: 'flex', gap: 8 }}>
        <Box fill={ACCENT_SOFT} style={{ flex: 1, padding: 10 }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            47
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>pares no RAG</div>
        </Box>
        <Box style={{ flex: 1, padding: 10, background: '#fff' }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            68%
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>respostas usadas</div>
        </Box>
        <Box style={{ flex: 1, padding: 10, background: '#fff' }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            12
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>sessões</div>
        </Box>
      </div>

      {/* big CTA card */}
      <div style={{ padding: '0 16px 10px' }}>
        <Box fill={INK} style={{ padding: 16, color: '#fff', borderColor: INK }}>
          <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 18, fontWeight: 700 }}>
            tem caixinha nova?
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            grava → sobe → responde em 5min
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <Btn primary style={{ flex: 1, height: 36, fontSize: 13 }}>🎬 Vídeo</Btn>
            <Btn style={{ flex: 1, height: 36, fontSize: 13, background: '#fff' }}>🖼 Prints</Btn>
          </div>
        </Box>
      </div>

      <div style={{ padding: '0 20px 4px', fontSize: 12, color: '#666' }}>
        sessões recentes
      </div>

      <div style={{ flex: 1, padding: '4px 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['hoje', '🎬 4m23s', '17 caixinhas', '12 usadas'],
          ['ontem', '🖼 12 prints', '12 caixinhas', '8 usadas'],
          ['28/04', '🎬 2m08s', '9 caixinhas', '✨ 9/9'],
        ].map((s, i) => (
          <Box key={i} style={{ background: '#fff', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 13, fontWeight: 700 }}>{s[1]}</div>
              <div style={{ fontSize: 10, color: '#777' }}>{s[0]} · {s[2]}</div>
            </div>
            <Pill fill={ACCENT_SOFT} style={{ fontSize: 11 }}>{s[3]}</Pill>
          </Box>
        ))}
      </div>
    </Phone>
  );
}

// V-Reply: alternative carousel of suggestions
function ReplyAltA() {
  return (
    <Phone label="⑦·A Detalhe — variação 'cartas' empilhadas">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: 'Caveat, cursive', fontSize: 14, color: '#888' }}>3 de 17 ─→</span>
        <span style={{ fontSize: 18 }}>⋯</span>
      </div>

      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ fontFamily: 'Kalam, cursive', fontSize: 15, lineHeight: 1.3, padding: '0 4px' }}>
          <span style={{ fontSize: 11, color: '#888' }}>caixinha:</span><br/>
          "qual creme você usa de manhã?"
        </div>
      </div>

      {/* stacked cards */}
      <div style={{ flex: 1, padding: '0 16px', position: 'relative' }}>
        {/* card 3 (back) */}
        <Box style={{
          background: '#fff', padding: 14, position: 'absolute',
          left: 30, right: 30, top: 18, height: 200,
          transform: 'rotate(2deg)', opacity: 0.5,
        }}>
          <div style={{ fontSize: 11, color: '#888' }}>sugestão 3 · com humor</div>
        </Box>
        {/* card 2 (mid) */}
        <Box style={{
          background: '#fff', padding: 14, position: 'absolute',
          left: 22, right: 22, top: 10, height: 210,
          transform: 'rotate(-1.5deg)', opacity: 0.7,
        }}>
          <div style={{ fontSize: 11, color: '#888' }}>sugestão 2 · mais curta</div>
        </Box>
        {/* card 1 (front) */}
        <Box style={{
          background: '#fff', padding: 16, position: 'relative',
          marginTop: 0, minHeight: 220,
          boxShadow: '3px 3px 0 ' + SKETCH,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Pill style={{ fontSize: 11 }}>sugestão 1</Pill>
            <span style={{ fontSize: 11, color: '#888' }}>147 / 280</span>
          </div>
          <div style={{ fontFamily: 'Kalam, cursive', fontSize: 14.5, lineHeight: 1.4 }}>
            adoroo essa pergunta! tô usando o gel da Vichy faz uns 3 meses,
            ele controla a oleosidade sem ressecar 💛 vou gravar um stories!
          </div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 10, fontStyle: 'italic' }}>
            🔗 inspirado em 3 respostas suas
          </div>
        </Box>
      </div>

      {/* swipe hint */}
      <div style={{ textAlign: 'center', fontFamily: 'Caveat, cursive', fontSize: 13, color: '#aaa', padding: '8px 0' }}>
        ← deslize para ver outras →
      </div>

      {/* actions row */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', gap: 6 }}>
        <Btn style={{ flex: 1, fontSize: 18, height: 48 }}>👍</Btn>
        <Btn style={{ flex: 1, fontSize: 16, height: 48 }}>✏️</Btn>
        <Btn style={{ flex: 1, fontSize: 16, height: 48 }}>🗑</Btn>
        <Btn primary style={{ flex: 2, fontSize: 14, height: 48 }}>📋 Copiar</Btn>
      </div>
    </Phone>
  );
}

// V-Results: alt — grouped by category
function ResultsAltA() {
  return (
    <Phone label="⑥·A Resultado — agrupado por categoria">
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22 }}>←</span>
        <span style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 16, fontWeight: 700 }}>
          17 caixinhas
        </span>
        <span style={{ fontSize: 13, color: '#888' }}>ordem ↓</span>
      </div>

      <div style={{ padding: '0 16px 10px' }}>
        <Box fill={ACCENT_SOFT} style={{ padding: '8px 12px', fontSize: 12 }}>
          ✅ extraídas em 1m43s · pela IA · 4m23s vídeo
        </Box>
      </div>

      <div style={{ flex: 1, padding: '0 16px 8px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { title: '⚡ urgentes', color: ACCENT, items: ['"tem como fazer 1:1 contigo?"', '"recebi o produto rasgado"'] },
          { title: '💡 oportunidades', color: '#2a8c3a', items: ['"posso indicar pra minha amiga?"', '"valor da consultoria?"'] },
          { title: '🛍 dúvidas-produto', color: '#3a6cb8', items: ['"qual creme você usa?"', '"onde compra o tônico?"', '"protetor solar favorito?"'] },
          { title: '💬 elogios e ruído (4)', color: '#999', items: [], collapsed: true },
        ].map((g, i) => (
          <div key={i}>
            <div style={{
              fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700,
              color: g.color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {g.title}
              <span style={{ flex: 1, borderBottom: `1.5px dashed ${g.color}`, opacity: 0.4 }} />
            </div>
            {g.collapsed ? (
              <Box dashed style={{ padding: 8, fontSize: 11, color: '#888', textAlign: 'center' }}>
                toque para expandir ↓
              </Box>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {g.items.map((q, j) => (
                  <Box key={j} style={{ background: '#fff', padding: '8px 10px', fontSize: 12, fontFamily: 'Kalam, cursive' }}>
                    {q}
                  </Box>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Phone>
  );
}

// Notes / legend
function Legend() {
  return (
    <div style={{
      width: 320, padding: 24,
      background: PAPER, border: `2.5px solid ${SKETCH}`,
      borderRadius: '20px 22px 18px 24px / 22px 18px 24px 20px',
      fontFamily: 'Kalam, cursive',
      boxShadow: '4px 4px 0 ' + SKETCH,
    }}>
      <div style={{ fontFamily: '"Architects Daughter", cursive', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
        Box<span style={{ color: ACCENT }}>IA</span>
      </div>
      <Squiggle />
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, marginTop: 8, lineHeight: 1.1 }}>
        Wireframes mobile<br/>v0.1 · low-fi
      </div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 14, lineHeight: 1.5 }}>
        Wireframes baseados no PRD v1.0.<br/>
        Foco: estrutura, fluxo, hierarquia.<br/>
        Tipografia, cores e ilustrações<br/>
        ainda não foram definidas.
      </div>

      <div style={{ marginTop: 18, fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700 }}>
        Legenda
      </div>
      <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScoreDot score={87} /> score de relevância (0-100)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Pill style={{ fontSize: 10 }}>categoria</Pill>
          tag automática
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ color: ACCENT, fontSize: 18 }}>✅</span>
          banner de transparência
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <ImgPlaceholder h={18} label="img" />
          placeholder
        </div>
      </div>

      <div style={{ marginTop: 18, fontFamily: '"Architects Daughter", cursive', fontSize: 14, fontWeight: 700 }}>
        Próximos passos
      </div>
      <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
        ① validar fluxos com PO<br/>
        ② escolher direção visual<br/>
        ③ hi-fi do happy path
      </div>
    </div>
  );
}

Object.assign(window, {
  Welcome, BrandDNA, Home, NewSession, Processing,
  ResultsList, ReplyDetail, Library, AddHistorical, Metrics,
  HomeAltA, ReplyAltA, ResultsAltA, Legend,
});
