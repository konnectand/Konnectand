'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import './landing.css'

export default function LandingPage() {
  const cursorDotRef  = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Scroll reveal — runs once on mount, independent of cursor
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Cursor — runs after mounted=true so refs are attached
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const dot  = cursorDotRef.current
    const ring = cursorRingRef.current
    if (!dot || !ring) return

    let raf: number
    let rx = 0, ry = 0
    let mx = 0, my = 0

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMove)

    function tick() {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      dot.style.transform  = `translate(${mx - 4}px, ${my - 4}px)`
      ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [mounted])

  return (
    <>
      {/* Cursor — client-only to avoid hydration mismatch */}
      {mounted && (
        <>
          <div id="cursor-dot"  ref={cursorDotRef}  />
          <div id="cursor-ring" ref={cursorRingRef} />
        </>
      )}

      {/* ── NAVBAR ── */}
      <nav className="lp-nav">
        <a href="#" className="lp-logo">Konect<span>AND</span></a>
        <ul className="lp-links">
          <li><a href="#nosotros">Quiénes somos</a></li>
          <li><a href="#lo-que">Experiencias</a></li>
          <li><a href="#para-quien">Clientes</a></li>
          <li><a href="#andorra">Primer proyecto</a></li>
          <li><a href="#cta">Contacto</a></li>
          <li><Link href="/login" className="lp-btn">Acceder</Link></li>
        </ul>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow" />
        <h1>
          Conexiones humanas.<br />
          <span className="gradient">Experiencias reales.</span>
        </h1>
        <p className="hero-sub">
          KonnectAND diseña e instala portales experienciales que generan conexiones humanas auténticas, transmiten emociones, acercan el arte y la cultura, y crean experiencias de marketing únicas. Apoyados en tecnología. Centrados en las personas.
        </p>
        <div className="hero-actions">
          <a href="#cta" className="btn-primary">Hablar con nosotros</a>
          <a href="#lo-que" className="btn-ghost">Descubrir más</a>
        </div>
        <div className="hero-badges">
          <span className="badge"><span className="badge-dot" style={{ background: '#8B7FF5' }} />Andorra · España · Internacional</span>
          <span className="badge"><span className="badge-dot" style={{ background: '#2DD4A8' }} />Vídeo 4K en tiempo real</span>
          <span className="badge"><span className="badge-dot" style={{ background: '#D4A832' }} />Presencia permanente</span>
        </div>
      </section>

      {/* ── TAGLINE ── */}
      <div className="tagline-section">
        <blockquote>
          "Las personas no recuerdan lo que vieron.<br />
          Recuerdan lo que sintieron."
        </blockquote>
      </div>

      {/* ── QUIÉNES SOMOS ── */}
      <section id="nosotros" className="lp-section">
        <div className="section-inner">
          <div className="reveal">
            <span className="section-tag">Quiénes somos</span>
            <h2 className="section-title">Pioneros en conexiones experienciales</h2>
            <p className="section-lead">
              Creamos portales físicos que conectan lugares distantes en tiempo real, convirtiendo la distancia en presencia.
            </p>
          </div>
          <div className="pillars">
            {[
              {
                icon: '💜',
                bg: 'rgba(139,127,245,.12)',
                title: 'Tecnología de presencia',
                text: 'Nuestros portales no son pantallas — son ventanas permanentes que recrean la sensación de compartir el mismo espacio físico.',
              },
              {
                icon: '🌊',
                bg: 'rgba(45,212,168,.12)',
                title: 'Diseño invisible',
                text: 'La mejor tecnología es la que desaparece. Integramos cada portal en el entorno para que la conexión sea natural y fluida.',
              },
              {
                icon: '⭐',
                bg: 'rgba(212,168,50,.12)',
                title: 'Impacto medible',
                text: 'Cada instalación aumenta la interacción, el tiempo de permanencia y el recuerdo de marca. La experiencia deja huella.',
              },
            ].map((p) => (
              <div className="pillar-card reveal" key={p.title}>
                <div className="pillar-icon" style={{ background: p.bg }}>{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCIAS ── */}
      <section id="lo-que" className="lp-section alt">
        <div className="section-inner">
          <div className="exp-header reveal">
            <span className="section-tag">Lo que hacemos</span>
            <h2 className="section-title">Experiencias que conectan</h2>
            <p className="section-lead center">
              Cada portal es único. Adaptamos la tecnología a tu espacio y tu historia.
            </p>
          </div>
          <div className="exp-grid reveal">
            {[
              { n: '01', title: 'Conexión entre tiendas', desc: 'Une dos puntos de venta para que clientes e los lugares distintos compartan el mismo espacio experiencial.' },
              { n: '02', title: 'Turismo y patrimonio', desc: 'Conecta oficinas de turismo, museos o monumentos para ofrecer a los visitantes una experiencia única.' },
              { n: '03', title: 'Eventos y ferias', desc: 'Portales temporales para conectar stands, ciudades o participantes remotos con presencia real.' },
              { n: '04', title: 'Gastronomía y hostelería', desc: 'Crea una mesa compartida entre dos restaurantes o une la barra de un hotel con otro destino.' },
              { n: '05', title: 'Institucional y corporativo', desc: 'Conecta sedes de empresa, embajadas, organismos públicos o universidades de forma continua.' },
              { n: '06', title: 'Arte e instalaciones', desc: 'Obra de arte viva: portales como piezas conceptuales que exploran la distancia y la presencia.' },
            ].map((e) => (
              <div className="exp-card" key={e.n}>
                <span className="exp-num">{e.n}</span>
                <div>
                  <h3>{e.title}</h3>
                  <p>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLIENTES ── */}
      <section id="para-quien" className="lp-section">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="section-tag">Para quién</span>
            <h2 className="section-title">Proyectos con propósito</h2>
            <p className="section-lead center">Trabajamos con organizaciones que quieren crear experiencias que se recuerdan.</p>
          </div>
          <div className="clients-grid">
            {[
              { emoji: '🏛️', title: 'Instituciones públicas', desc: 'Ayuntamientos, museos, oficinas de turismo y organismos gubernamentales.' },
              { emoji: '🏬', title: 'Retail y comercio', desc: 'Cadenas de tiendas, centros comerciales y marcas con múltiples ubicaciones.' },
              { emoji: '🏢', title: 'Corporativo y empresas', desc: 'Sedes internacionales, oficinas distribuidas y hubs de innovación.' },
              { emoji: '🎪', title: 'Eventos y entretenimiento', desc: 'Festivales, ferias, exposiciones y espacios culturales de gran formato.' },
              { emoji: '🏔️', title: 'Turismo y hostelería', desc: 'Hoteles, resorts, destinos turísticos y agencias de experiencias.' },
              { emoji: '🌐', title: 'Internacional y global', desc: 'Proyectos que cruzan fronteras y requieren conexión intercultural.' },
            ].map((c) => (
              <div className="client-card reveal" key={c.title}>
                <div className="client-emoji">{c.emoji}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATOS ── */}
      <section id="formatos" className="lp-section alt">
        <div className="section-inner">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="section-tag">Formatos</span>
            <h2 className="section-title">Adaptado a tu espacio</h2>
            <p className="section-lead center">Cuatro geometrías. Infinitas posibilidades de integración.</p>
          </div>
          <div className="formats-grid">
            {[
              { symbol: '○', title: 'Circular', desc: 'Pantalla redonda de gran impacto. Ideal para vestíbulos y espacios diáfanos.' },
              { symbol: '□', title: 'Cuadrado', desc: 'Formato equilibrado y versátil. El más fácil de integrar en cualquier entorno.' },
              { symbol: '♡', title: 'Corazón', desc: 'Forma emocional para experiencias especiales, bodas, aniversarios y eventos únicos.' },
              { symbol: '◬', title: 'Personalizado', desc: 'Cualquier geometría, medida o acabado. Diseñamos desde cero contigo.' },
            ].map((f) => (
              <div className="format-card reveal" key={f.title}>
                <span className="format-symbol">{f.symbol}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANDORRA (primer proyecto) ── */}
      <section id="andorra" className="lp-section">
        <div className="section-inner">
          <div className="andorra-grid">
            <div className="andorra-img reveal">
              <span className="big-text">🏔️</span>
              <span className="place-name">Andorra la Vella</span>
            </div>
            <div className="reveal">
              <span className="gold-tag">⭐ Primer proyecto</span>
              <h2 className="section-title">El país que inspiró todo</h2>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: '1.75', marginBottom: '1rem' }}>
                Andorra es, por naturaleza, un puente entre España y Francia. De esa esencia fronteriza nació KonnectAND: la convicción de que la distancia es solo una oportunidad para crear conexión.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: '1.75' }}>
                Nuestro primer portal conecta Andorra la Vella con Barcelona en tiempo real. Una ventana permanente entre dos ciudades, dos culturas, dos mundos que ahora comparten espacio.
              </p>
              <div className="andorra-stats">
                <div>
                  <div className="andorra-stat-val">8M+</div>
                  <div className="andorra-stat-lbl">turistas/año en Andorra</div>
                </div>
                <div>
                  <div className="andorra-stat-val">7</div>
                  <div className="andorra-stat-lbl">parroquias conectadas</div>
                </div>
                <div>
                  <div className="andorra-stat-val">1º</div>
                  <div className="andorra-stat-lbl">portal en los Pirineos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILOSOFÍA ── */}
      <section className="lp-section alt">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="reveal">
            <span className="section-tag">Filosofía</span>
            <div className="philosophy-quote">
              <q>La tecnología es el medio.<br />Las personas son el fin.</q>
              <cite>— KonnectAND</cite>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="lp-section">
        <div className="section-inner">
          <div className="cta-card reveal">
            <h2>¿Hablamos de tu proyecto?</h2>
            <p>Cuéntanos tu espacio y tu historia. Te mostramos cómo un portal KonnectAND puede transformarlo.</p>
            <div className="cta-actions">
              <a href="mailto:hola@konnectand.ad" className="btn-primary">hola@konnectand.ad</a>
              <Link href="/login" className="btn-ghost">Acceder al panel</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <a href="#" className="footer-logo">Konect<span>AND</span></a>
          <span className="footer-tagline">La tecnología es el medio. Las personas son el fin.</span>
          <span className="footer-copy">&copy; {new Date().getFullYear()} KonnectAND · Andorra</span>
        </div>
      </footer>
    </>
  )
}
