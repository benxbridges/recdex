import "./portfolio.css";

/* ===== DATA ===== */

const releases = [
  {
    year: "2026",
    title: "Iguana Song (Gilligan Moss Remix)",
    detail: "Goose — Everything Must Go Remixed",
    type: "Remix",
  },
  {
    year: "2025",
    title: "A La Mode",
    detail: "6 tracks — Foreign Family Collective / Ninja Tune",
    type: "EP",
  },
  {
    year: "2024",
    title: "Speaking Across Time",
    detail: "12 tracks — Foreign Family Collective / Ninja Tune",
    type: "Album",
  },
  {
    year: "2023",
    title: "Love Song",
    detail: "Single",
    type: "Single",
  },
  {
    year: "2023",
    title: "Turn Back Time",
    detail: "Single",
    type: "Single",
  },
  {
    year: "2022",
    title: "The Destroyer",
    detail: "Single",
    type: "Single",
  },
  {
    year: "2021",
    title: "Gilligan Moss (Deluxe Edition)",
    detail: "21 tracks — Foreign Family Collective",
    type: "Album",
  },
  {
    year: "2021",
    title: "Gilligan Moss",
    detail: "13 tracks — Foreign Family Collective",
    type: "Album",
  },
  {
    year: "2020",
    title: "BMO's Mixtape (Gilligan Moss Mix)",
    detail: "Adventure Time: Distant Lands — HBO Max",
    type: "Soundtrack",
  },
  {
    year: "2020",
    title: "Ultraparadíso",
    detail: "Single",
    type: "Single",
  },
  {
    year: "2019",
    title: "What Could I Say?",
    detail: "Single",
    type: "Single",
  },
  {
    year: "2018",
    title: "What Happened? EP",
    detail: "5 tracks — AMF Records",
    type: "EP",
  },
  {
    year: "2015",
    title: "Ceremonial EP",
    detail: "4 tracks — AMF Records",
    type: "EP",
  },
  {
    year: "2014",
    title: "Choreograph",
    detail: "Debut single — #1 on Hype Machine",
    type: "Single",
  },
];

const remixesAndProduction = [
  { artist: "Goose", song: '"Iguana Song"', year: "2026" },
  { artist: "Glass Animals", song: '"Gooey"', year: "2015" },
  { artist: "Sia", song: '"Big Girls Cry"', year: "2015" },
  { artist: "Tegan and Sara", song: '"Boyfriend"', year: "2016" },
  { artist: "Sebastien Tellier", song: '"La Ritournelle"', year: "2016" },
  { artist: "Banks", song: "Remix", year: "2015" },
];

const press = [
  {
    outlet: "Variety",
    headline:
      "'Adventure Time' and Gilligan Moss Drop New Mixtape",
    url: "https://variety.com/2020/music/news/adventure-time-mixtape-gilligan-moss-1234775811/",
    date: "September 2020",
  },
  {
    outlet: "EDM Identity",
    headline:
      "Gilligan Moss' 'Speaking Across Time' is an Album of the Year Contender",
    url: "https://edmidentity.com/2024/08/23/gilligan-moss-speaking-across-time-review/",
    date: "August 2024",
  },
  {
    outlet: "EDM Identity",
    headline: "Gilligan Moss Lifts Spirits with Self-Titled Debut Album",
    url: "https://edmidentity.com/2021/04/09/gilligan-moss-lifts-spirits-with-self-titled-debut-album/",
    date: "April 2021",
  },
  {
    outlet: "EDM.com",
    headline:
      "Goose Goes Electro With 'Everything Must Go' Remix Album",
    url: "https://edm.com/music-releases/goose-everything-must-go-remixes-daily-bread-louis-the-child-lp-giobbi-more/",
    date: "February 2026",
  },
  {
    outlet: "thatDROP",
    headline:
      "In Conversation with Gilligan Moss: Studio Poetry and a Jet-Setting Tour",
    url: "https://thatdrop.com/gilligan-moss-interview-from-tour-to-studio/",
    date: "2024",
  },
  {
    outlet: "Clash Magazine",
    headline: "Track By Track: Gilligan Moss — 'Ceremonial' EP",
    url: "https://www.clashmusic.com/news/track-by-track-gilligan-moss-ceremonial-ep",
    date: "August 2015",
  },
  {
    outlet: "Grateful Web",
    headline:
      "Goose Step Into a New Sonic World with Everything Must Go Remixed",
    url: "https://www.gratefulweb.com/articles/goose-step-into-a-new-sonic-world-with-everything-must-go-remixed/",
    date: "February 2026",
  },
];

/* ===== PAGE ===== */

export default function PortfolioPage() {
  return (
    <div className="portfolio-container">
      {/* ── HERO ── */}
      <section className="hero">
        <h1 className="hero-name heading-display">Benjamin Cronin</h1>
        <p className="hero-tagline">
          Songwriter, producer, artist, and composer — one half of{" "}
          <strong style={{ color: "#E8E4E0" }}>Gilligan Moss</strong>.
          <br />
          Released on Foreign Family Collective&nbsp;/&nbsp;Ninja Tune.
        </p>
      </section>

      {/* ── BIO ── */}
      <section className="section" id="bio">
        <p className="heading-section section-label">About</p>
        <div className="bio-text">
          <p>
            <strong>Benjamin Cronin</strong> is a songwriter, producer, and
            multi-instrumentalist based in Brooklyn, NY. As one half of the
            electronic duo <strong>Gilligan Moss</strong> — alongside childhood
            friend Evan Dorfman — he has built a catalog spanning nu-disco,
            house, and genre-defying electronic music that critics have called
            &ldquo;garden-disco.&rdquo;
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            Since the project&rsquo;s debut single &ldquo;Choreograph&rdquo; hit
            #1 on Hype Machine in 2014, Cronin has released two studio albums
            and multiple EPs on <strong>ODESZA&rsquo;s Foreign Family
            Collective</strong> in partnership with <strong>Ninja Tune</strong>.
            His production and remix work includes collaborations with{" "}
            <strong>Glass Animals</strong>, <strong>Sia</strong>,{" "}
            <strong>Goose</strong>, <strong>Tegan and Sara</strong>, and{" "}
            <strong>Sebastien Tellier</strong>.
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            In 2020, he composed and produced the official{" "}
            <strong>BMO&rsquo;s Mixtape</strong> for HBO Max&rsquo;s{" "}
            <em>Adventure Time: Distant Lands</em>, featured in Variety. He has
            performed at <strong>Coachella</strong>,{" "}
            <strong>Pitchfork Paris</strong>, and{" "}
            <strong>Electric Forest</strong>, and toured alongside Glass Animals,
            Toro Y Moi, Tourist, and ODESZA.
          </p>
        </div>
        <div className="bio-highlights">
          <span className="bio-tag">Coachella</span>
          <span className="bio-tag">Pitchfork Paris</span>
          <span className="bio-tag">Electric Forest</span>
          <span className="bio-tag">Foreign Family Collective</span>
          <span className="bio-tag">Ninja Tune</span>
          <span className="bio-tag">HBO Max</span>
          <span className="bio-tag">Adventure Time</span>
        </div>
      </section>

      {/* ── DISCOGRAPHY ── */}
      <section className="section" id="discography">
        <p className="heading-section section-label">Discography</p>
        <div className="release-grid">
          {releases.map((r, i) => (
            <div className="release-item" key={i}>
              <span className="release-year">{r.year}</span>
              <div>
                <div className="release-title">{r.title}</div>
                <div className="release-detail">{r.detail}</div>
              </div>
              <span className="release-type">{r.type}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── REMIXES & PRODUCTION ── */}
      <section className="section" id="remixes">
        <p className="heading-section section-label">
          Remixes &amp; Production Credits
        </p>
        <div className="credit-list">
          {remixesAndProduction.map((c, i) => (
            <div className="credit-item" key={i}>
              <span>
                <span className="credit-artist">{c.artist}</span>
                <span className="credit-song"> — {c.song}</span>
              </span>
              <span className="credit-year">{c.year}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRESS ── */}
      <section className="section" id="press">
        <p className="heading-section section-label">Press</p>
        <div className="press-list">
          {press.map((p, i) => (
            <a
              className="press-item"
              key={i}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="press-outlet">{p.outlet}</div>
              <div className="press-headline">{p.headline}</div>
              <div className="press-date">{p.date}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="contact-section" id="contact">
        <h2 className="contact-heading heading-display">Get in touch</h2>
        <a className="contact-email" href="mailto:hello@gilliganmoss.com">
          hello@gilliganmoss.com
        </a>
        <div className="streaming-links">
          <a
            className="streaming-link"
            href="https://open.spotify.com/artist/2fo0F81pRzdXjmWP6MkQqB"
            target="_blank"
            rel="noopener noreferrer"
          >
            Spotify
          </a>
          <a
            className="streaming-link"
            href="https://music.apple.com/us/artist/gilligan-moss/876303610"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Music
          </a>
          <a
            className="streaming-link"
            href="https://soundcloud.com/gilligan-moss"
            target="_blank"
            rel="noopener noreferrer"
          >
            SoundCloud
          </a>
          <a
            className="streaming-link"
            href="https://gilliganmoss.bandcamp.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bandcamp
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="portfolio-footer">
        &copy; {new Date().getFullYear()} Benjamin Cronin
      </footer>
    </div>
  );
}
