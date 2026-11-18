import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import SplitText from '../components/SplitText.jsx';
import ProductCard, { PRODUCT_GRID } from '../components/ProductCard.jsx';
import Explorer from '../components/home/Explorer.jsx';
import Assembly from '../components/home/Assembly.jsx';
import Lessons from '../components/home/Lessons.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { initHeroScene } from '../js/three-scene.js';
import { PRODUCTS } from '../js/data.js';
import { save } from '../js/storage.js';
import { gsap, reduced, revealHeadline } from '../js/animations.js';

function Hero({ titleRef, stageRef }) {
  return (
    <section className="hero" id="top" data-nav-section="home">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__stage" aria-hidden="true" ref={stageRef} />
      <div className="hero__content">
        <p className="hero__eyebrow" data-hero-fade>
          GAJJU ROBOTICS
        </p>
        <SplitText as="h1" className="hero__title" text={'INTELLIGENCE\nIN MOTION.'} reveal="manual" ref={titleRef} />
        <div className="hero__copy" data-hero-fade>
          <p className="hero__sub">Robotics engineered with purpose.</p>
          <p className="hero__lead">
            Explore advanced robotic platforms and modular kits designed for engineering, experimentation and
            real-world innovation.
          </p>
        </div>
        <div className="hero__ctas" data-hero-fade>
          <Link className="btn btn--primary btn--lg" to="/product/GAJJU">
            Discover GAJJU
            <Icon name="arrow-right" />
          </Link>
          <Link className="btn btn--ghost btn--lg" to="/product/GAJJU-kit">
            Explore Robotics Kits
            <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
      <a className="scroll-cue" href="#intro" data-hero-fade aria-label="Scroll to next section">
        <span className="scroll-cue__track">
          <span />
        </span>
        Scroll
      </a>
    </section>
  );
}

function Intro() {
  return (
    <section className="intro" id="intro" data-nav-section="home">
      <div className="techgrid" aria-hidden="true" />
      <div className="intro__inner">
        <div className="intro__body">
          {/* Empty slot: the live 3D GAJJU stands here (positioned by three-scene.js). */}
          <div className="robot-slot" data-robot-slot aria-hidden="true" />
          <div className="intro__text">
            <SplitText className="display display--md intro__title" text="ENGINEERED TO EXPLORE." />
            <p className="lede" data-reveal>
              Robots shouldn’t live only in research labs and factory cages. We build machines you can unbox on a
              kitchen table, take apart with one hex driver, and reprogram the same evening.
            </p>
            <p data-reveal>
              Every Gajju product runs on the same open platform: the same sensors, the same SDK, the same lessons.
              GAJJU arrives as 104 parts you assemble yourself, then walks, looks around and picks things up with its
              trunk. Either way, nothing is sealed and nothing is secret.
            </p>
            <ul className="facts" data-reveal>
              <li>
                <strong>Open SDK</strong>
                <span>Python, Arduino and ROS 2</span>
              </li>
              <li>
                <strong>Repairable</strong>
                <span>Every part sold separately</span>
              </li>
              <li>
                <strong>Taught</strong>
                <span>Free lessons for every build</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const CAPS = [
  {
    title: 'Intelligent engineering',
    text: 'On-device vision and mapping, so robots react in milliseconds and keep working without a connection.',
    visual: (
      <div className="cap__visual cap__visual--circuit" aria-hidden="true">
        <svg viewBox="0 0 300 200" fill="none">
          <g className="circuit-base">
            <path d="M20 100h60l20-40h60l20 40h100" />
            <path d="M80 100l20 40h60l20-40" />
            <path d="M160 60V20M160 140v40M40 40h40v60M240 160h-40v-60" />
          </g>
          <g className="circuit-pulse">
            <path d="M20 100h60l20-40h60l20 40h100" />
            <path d="M80 100l20 40h60l20-40" />
            <path d="M160 60V20M160 140v40" />
          </g>
          <g className="circuit-nodes">
            <circle cx="80" cy="100" r="5" />
            <circle cx="160" cy="60" r="5" />
            <circle cx="160" cy="140" r="5" />
            <circle cx="180" cy="100" r="5" />
            <rect x="138" y="88" width="44" height="24" rx="4" />
          </g>
        </svg>
      </div>
    ),
  },
  {
    title: 'Modular architecture',
    text: 'Sensors, arms and batteries share one mounting grid and one connector. Swap a module without rewriting your code.',
    visual: (
      <div className="cap__visual cap__visual--modules" aria-hidden="true">
        <div className="cube-stack">
          {['c1', 'c2', 'c3', 'c4'].map((c) => (
            <div key={c} className={`cube ${c}`}>
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Hands-on innovation',
    text: 'Nothing is glued shut. Open the panel, see the wiring, change it, and learn exactly why it works.',
    visual: (
      <div className="cap__visual cap__visual--gears" aria-hidden="true">
        <svg viewBox="0 0 300 200" fill="none">
          <g className="gear gear--a">
            <path
              d="M150 52l6-18h12l6 18 16 7 17-9 9 9-9 17 7 16 18 6v12l-18 6-7 16 9 17-9 9-17-9-16 7-6 18h-12l-6-18-16-7-17 9-9-9 9-17-7-16-18-6v-12l18-6 7-16-9-17 9-9 17 9z"
              transform="translate(-50 10) scale(.9)"
            />
            <circle cx="112" cy="104" r="18" />
          </g>
          <g className="gear gear--b">
            <circle cx="214" cy="80" r="30" />
            <circle cx="214" cy="80" r="9" />
            <path d="M214 42v-8M214 118v8M176 80h-8M252 80h8M187 53l-6-6M241 107l6 6M241 53l6-6M187 107l-6 6" />
          </g>
        </svg>
      </div>
    ),
  },
];

function Capabilities() {
  const [active, setActive] = useState(0);
  return (
    <section className="caps" id="capabilities" data-nav-section="home">
      <SplitText className="display display--md" text="ROBOTICS WITHOUT LIMITS." />
      <div className="caps__row">
        {CAPS.map((c, i) => (
          <article
            key={c.title}
            className={`cap${active === i ? ' is-active' : ''}`}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            {c.visual}
            <div className="cap__text">
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="showcase" id="products" data-nav-section="products">
      <div className="wrap">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SplitText className="display display--md" text="SHOP GAJJU." />
          <Link
            className="inline-flex items-center gap-[0.3rem] text-[0.92rem] text-muted hover:text-accent [&_svg]:size-4"
            to="/shop"
          >
            View all products
            <Icon name="chevron-right" />
          </Link>
        </header>
        <div className={PRODUCT_GRID}>
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} headingTag="h3" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [msg, setMsg] = useState(null); // { text, ok }
  const submit = (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const data = Object.fromEntries(new FormData(f));
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const message = String(data.message || '').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length <= 5) {
      setMsg({ text: 'Add your name, a valid email and a short message so we can reply.', ok: false });
      return;
    }
    save('contact', { name: data.name, email: data.email, message: data.message, at: Date.now() });
    setMsg({
      text: `Thanks, ${name.split(' ')[0]}. Message sent. An engineer will reply to ${email} within one working day.`,
      ok: true,
    });
    f.reset();
  };
  return (
    <form className="form contact__form" noValidate onSubmit={submit}>
      <div className="form-row">
        <label className="field">
          <span>Name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
      </div>
      <label className="field">
        <span>What are you building?</span>
        <textarea name="message" rows={4} required />
      </label>
      <p className={`form-msg${msg ? (msg.ok ? ' is-ok' : ' is-error') : ''}`}>{msg?.text}</p>
      <button className="btn btn--primary" type="submit">
        <Icon name="mail" />
        Send message
      </button>
    </form>
  );
}

const ABOUT = [
  ['Vision', 'A world where anyone curious enough to ask how a robot works can open one up and find out.'],
  ['Mission', 'Make capable, honest robotics hardware at a price a school, a hobbyist or a small lab can say yes to.'],
  [
    'Philosophy',
    'Open by default. Every schematic is published, every part is replaceable, and every robot can be reprogrammed by its owner.',
  ],
  [
    'Engineering',
    'Every GAJJU part is checked against the CAD assembly before it ships, and every kit tray is drop-tested from a metre, because robots get dropped.',
  ],
];

function About() {
  return (
    <section className="about" id="about" data-nav-section="about">
      <SplitText className="display about__title" text="THE FUTURE IS BUILT, NOT WAITED FOR." />
      <div className="about__grid">
        {ABOUT.map(([title, text]) => (
          <div key={title} className="about__block" data-reveal>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="contact" id="contact" data-reveal>
        <div className="contact__copy">
          <h3>Talk to an engineer</h3>
          <p>
            Questions about classrooms, bulk orders or a project you’re planning? A real engineer answers within one
            working day.
          </p>
          <p className="muted">
            <Icon name="mail" /> hello@Gajju.example
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentTitle('Gajju · Intelligence in motion');
  const { loaded } = useSite();
  const mainRef = useRef(null);
  const heroStageRef = useRef(null);
  const heroTitleRef = useRef(null);
  const hero = useRef(null);
  const ctx = useRef(null);
  useReveals(mainRef);

  // Hero 3D scene (also drives the robot's walk into "Engineered to explore" and the caps cards).
  useEffect(() => {
    hero.current = initHeroScene(heroStageRef.current, null);
    return () => {
      hero.current?.destroy();
      hero.current = null;
    };
  }, []);

  // Page-level scroll effects; hero copy is hidden until the loader finishes.
  useLayoutEffect(() => {
    ctx.current = gsap.context(() => {
      if (reduced) return;
      gsap.set('[data-hero-fade]', { opacity: 0, y: 24 });
      // Hero title parallax: the type drifts slower than the robot as you scroll.
      gsap.to('.hero__content', {
        y: -80,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '30% top', end: '80% top', scrub: true },
      });
      gsap.to('.techgrid', {
        backgroundPosition: '0px 240px',
        ease: 'none',
        scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }, mainRef);
    return () => ctx.current.revert();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    ctx.current.add(() => {
      revealHeadline(heroTitleRef.current, { immediate: true, stagger: 0.12, duration: 1.3 });
      if (!reduced)
        gsap.to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
    });
    hero.current?.playIntro();
  }, [loaded]);

  return (
    <main id="main" ref={mainRef}>
      <Hero titleRef={heroTitleRef} stageRef={heroStageRef} />
      <Intro />
      <Capabilities />
      <Showcase />
      <Explorer />
      <Assembly />
      <Lessons />
      <About />
    </main>
  );
}
