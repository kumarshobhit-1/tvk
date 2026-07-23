import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Victory Key — IBPS SO IT Officer 2026 Course",
  description: "Four full subjects, deep notes, a solved question bank, a timed mock series and live guidance — one focused programme engineered for the IBPS SO (IT Officer, Scale I) exam.",
};

export default function CourseOverviewPage() {
  return (
    <div className="wrap">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root{
              --ink:#0c1230;            /* deep navy ground */
              --ink-2:#131b41;          /* raised surface */
              --ink-3:#1b2452;          /* card hover / lines */
              --line:#28305f;
              --gold:#e7b24a;           /* victory gold accent */
              --gold-soft:#f2cd7e;
              --paper:#f5f7ff;          /* near-white text */
              --muted:#aab2d6;          /* muted cool grey-blue */
              --faint:#7f88b4;
              --good:#5ed2a0;
              --serif:Georgia,"Times New Roman","Iowan Old Style",serif;
              --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
              --sp:clamp(18px,4vw,40px);
            }
            .wrap * { box-sizing: border-box; margin: 0; padding: 0; }
            .wrap {
              font-family:var(--sans); color:var(--paper);
              background:
                radial-gradient(1100px 620px at 78% -8%, rgba(231,178,74,.13), transparent 60%),
                radial-gradient(900px 520px at 8% 4%, rgba(60,80,190,.20), transparent 62%),
                var(--ink);
              line-height:1.58; -webkit-font-smoothing:antialiased;
              overflow-x:hidden;
              min-height: 100vh;
            }
            .wrap .inner{max-width:1080px; margin:0 auto; padding:0 var(--sp)}
            .wrap a{color:var(--gold-soft); text-decoration:none}

            .wrap .eyebrow{
              display: inline-block;
              font-size:12px; letter-spacing:.24em; text-transform:uppercase;
              color:var(--gold); font-weight:700;
            }

            /* ---------- hero ---------- */
            .wrap header.hero{padding:clamp(30px,6vw,64px) 0 clamp(24px,4vw,44px)}
            .wrap .brand{display:flex; align-items:center; gap:11px; margin-bottom:clamp(26px,5vw,48px)}
            .wrap .brand .key{
              width:34px; height:34px; border-radius:9px; flex:none;
              background:linear-gradient(150deg,var(--gold),#c98a26);
              display:grid; place-items:center; color:#1a1204; font-size:19px;
              box-shadow:0 3px 14px rgba(231,178,74,.35);
            }
            .wrap .brand b{font-size:16px; letter-spacing:.02em; line-height: 1.2;}
            .wrap .brand span{color:var(--muted); font-size:13px}
            .wrap .live{
              margin-left:auto; font-size:11.5px; font-weight:700; letter-spacing:.08em;
              color:#ffdca0; background:rgba(231,178,74,.12); border:1px solid rgba(231,178,74,.4);
              padding:6px 12px; border-radius:999px; display:inline-flex; align-items:center; gap:7px;
            }
            .wrap .live .pulse{width:8px;height:8px;border-radius:50%;background:#ff6b6b;box-shadow:0 0 0 0 rgba(255,107,107,.6);animation:p 2s infinite}
            @keyframes p{0%{box-shadow:0 0 0 0 rgba(255,107,107,.55)}70%{box-shadow:0 0 0 8px rgba(255,107,107,0)}100%{box-shadow:0 0 0 0 rgba(255,107,107,0)}}
            @media(prefers-reduced-motion:reduce){.wrap .live .pulse{animation:none}}

            .wrap .hero h1{
              font-family:var(--serif); font-weight:700;
              font-size:clamp(34px,6.4vw,66px); line-height:1.05; letter-spacing:-.01em;
              margin:.28em 0 .1em; text-wrap:balance;
            }
            .wrap .hero h1 em{font-style:italic; color:var(--gold)}
            .wrap .hero .lede{font-size:clamp(16px,2.3vw,20px); color:var(--muted); max-width:60ch; margin:.5em 0 0}

            .wrap .kpis{
              display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
              gap:14px; margin-top:clamp(28px,5vw,44px);
            }
            .wrap .kpi{
              background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.01));
              border:1px solid var(--line); border-radius:14px; padding:18px 18px;
            }
            .wrap .kpi .n{font-family:var(--serif); font-size:clamp(28px,4vw,38px); color:var(--gold-soft); line-height:1; font-variant-numeric:tabular-nums}
            .wrap .kpi .l{font-size:13px; color:var(--muted); margin-top:9px}

            /* ---------- section scaffold ---------- */
            .wrap section{padding:clamp(34px,6vw,60px) 0; border-top:1px solid var(--line)}
            .wrap .sec-title{font-family:var(--serif); font-size:clamp(24px,3.6vw,34px); font-weight:700; margin:.35em 0 .1em; letter-spacing:-.01em; text-wrap:balance}
            .wrap .sec-sub{color:var(--muted); max-width:65ch; margin:.4em 0 0}

            /* ---------- strategy band ---------- */
            .wrap .band{
              background:linear-gradient(135deg,rgba(231,178,74,.14),rgba(231,178,74,.03));
              border:1px solid rgba(231,178,74,.32); border-radius:18px;
              padding:clamp(22px,4vw,34px); display:grid; grid-template-columns:auto 1fr; gap:clamp(18px,3vw,28px); align-items:center;
            }
            @media(max-width:620px){.wrap .band{grid-template-columns:1fr}}
            .wrap .band .mark{font-family:var(--serif); font-size:clamp(42px,7vw,66px); color:var(--gold); line-height:.9}
            .wrap .band p{margin:0; font-size:clamp(16px,2.2vw,20px)}
            .wrap .band p b{color:var(--gold-soft)}

            /* ---------- offering cards ---------- */
            .wrap .grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:16px; margin-top:26px}
            .wrap .card{
              background:var(--ink-2); border:1px solid var(--line); border-radius:15px;
              padding:22px 20px; transition:border-color .2s, transform .2s;
            }
            .wrap .card:hover{border-color:rgba(231,178,74,.45); transform:translateY(-3px)}
            .wrap .card .ic{
              width:42px;height:42px;border-radius:11px;display:grid;place-items:center;font-size:20px;margin-bottom:14px;
              background:rgba(231,178,74,.12); border:1px solid rgba(231,178,74,.28);
            }
            .wrap .card h3{margin:0 0 6px; font-size:17px; letter-spacing:.01em}
            .wrap .card p{margin:0; color:var(--muted); font-size:14px}
            .wrap .card .tag{display:inline-block; margin-top:12px; font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--gold); background:rgba(231,178,74,.1); border-radius:999px; padding:3px 10px}

            /* ---------- subject rows ---------- */
            .wrap .subjects{display:flex; flex-direction:column; gap:12px; margin-top:24px}
            .wrap .subj{
              display:grid; grid-template-columns:52px 1fr auto; gap:16px; align-items:center;
              background:var(--ink-2); border:1px solid var(--line); border-radius:13px; padding:16px 18px;
            }
            .wrap .subj .num{font-family:var(--serif); font-size:26px; color:var(--gold); text-align:center; font-variant-numeric:tabular-nums}
            .wrap .subj h4{margin:0 0 3px; font-size:16px}
            .wrap .subj p{margin:0; color:var(--muted); font-size:13.5px}
            .wrap .subj .badge{font-size:12px; color:var(--faint); white-space:nowrap; font-weight:600}
            @media(max-width:560px){.wrap .subj{grid-template-columns:40px 1fr} .wrap .subj .badge{display:none}}

            /* ---------- pattern table ---------- */
            .wrap .tw{overflow-x:auto; margin-top:22px; border:1px solid var(--line); border-radius:14px}
            .wrap table{width:100%; border-collapse:collapse; font-size:14.5px; min-width:520px}
            .wrap th,.wrap td{padding:13px 16px; text-align:left; border-bottom:1px solid var(--line)}
            .wrap thead th{background:var(--ink-2); color:var(--gold); font-size:12px; letter-spacing:.08em; text-transform:uppercase; font-weight:700}
            .wrap tbody tr:last-child td{border-bottom:none}
            .wrap td .hi{color:var(--gold-soft); font-weight:700}
            .wrap td small{color:var(--faint)}
            .wrap .note{margin-top:14px; font-size:13.5px; color:var(--muted)}
            .wrap .note b{color:var(--paper)}

            /* ---------- how it works ---------- */
            .wrap .steps{display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:16px; margin-top:26px}
            .wrap .step{border-left:2px solid var(--gold); padding:4px 0 4px 18px}
            .wrap .step .k{font-family:var(--serif); color:var(--gold); font-size:15px; letter-spacing:.1em}
            .wrap .step h4{margin:6px 0 4px; font-size:16px}
            .wrap .step p{margin:0; color:var(--muted); font-size:13.5px}

            /* ---------- CTA ---------- */
            .wrap .cta{
              text-align:center; padding:clamp(38px,6vw,60px) var(--sp);
              background:linear-gradient(180deg,rgba(231,178,74,.10),transparent);
              border-top:1px solid var(--line);
            }
            .wrap .cta h2{font-family:var(--serif); font-size:clamp(26px,4vw,40px); margin:0 0 10px; text-wrap:balance}
            .wrap .cta p{color:var(--muted); margin:0 auto 22px; max-width:52ch}
            .wrap .btn{
              display:inline-block; font-weight:700; font-size:16px; letter-spacing:.01em;
              background:linear-gradient(150deg,var(--gold),#cf9430); color:#1a1204;
              padding:14px 30px; border-radius:12px; box-shadow:0 6px 22px rgba(231,178,74,.32);
              cursor: pointer;
            }
            .wrap .foot{padding:26px var(--sp) 40px; text-align:center; color:var(--faint); font-size:12.5px}

            .wrap ul.tick{list-style:none; margin:16px 0 0; padding:0; display:grid; gap:9px}
            .wrap ul.tick li{display:flex; gap:10px; font-size:14.5px; color:var(--muted)}
            .wrap ul.tick li::before{content:"✓"; color:var(--good); font-weight:800}
          `,
        }}
      />

      <div className="inner">
        <header className="hero">
          <div className="brand">
            <span className="key">🔑</span>
            <div>
              <b>The Victory Key</b><br /><span>TVK · IT Officer Exam Prep</span>
            </div>
            <span className="live"><span className="pulse"></span>LIVE AMA · Tonight 8 PM</span>
          </div>

          <span className="eyebrow">IBPS SO IT Officer · 2026 Cycle</span>
          <h1>The complete course to crack <em>IT Officer</em> — built around what actually decides your rank.</h1>
          <p className="lede">Four full subjects, deep notes, a solved question bank, a timed mock series and live guidance — one focused programme engineered for the IBPS SO (IT Officer, Scale I) exam.</p>

          <div className="kpis">
            <div className="kpi"><div className="n">4</div><div className="l">Full subjects, 30 days each</div></div>
            <div className="kpi"><div className="n">120</div><div className="l">Daily lessons + practice</div></div>
            <div className="kpi"><div className="n">1,000+</div><div className="l">Practice questions, all explained</div></div>
            <div className="kpi"><div className="n">487</div><div className="l">Solved previous-year IT questions</div></div>
            <div className="kpi"><div className="n">20</div><div className="l">Sectional & full-length mocks</div></div>
            <div className="kpi"><div className="n">Live</div><div className="l">Weekly sessions & doubt clinics</div></div>
          </div>
        </header>
      </div>

      {/* STRATEGY */}
      <section>
        <div className="inner">
          <div className="band">
            <div className="mark">“</div>
            <p>Your final merit is decided by <b>one thing — the Professional Knowledge (IT) paper.</b> Every other section only needs to clear its cut-off. This course puts your effort exactly where the marks are: master PK, clear the rest with confidence.</p>
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section>
        <div className="inner">
          <span className="eyebrow">Everything you get</span>
          <h2 className="sec-title">What's inside the course</h2>
          <p className="sec-sub">A complete preparation stack — from first concept to final dress-rehearsal mock — so you never have to stitch together material from five different places.</p>

          <div className="grid">
            <div className="card">
              <div className="ic">📘</div>
              <h3>4 × 30-Day Courses</h3>
              <p>Professional Knowledge, Quantitative Aptitude, Reasoning and English — each a structured 30-day path of concept, exam traps and daily practice.</p>
              <span className="tag">Core</span>
            </div>
            <div className="card">
              <div className="ic">📗</div>
              <h3>Deep Subject Notes</h3>
              <p>In-depth notes across the entire IT syllabus — databases, networks, OS, data structures, security, and more — written for real exam questions.</p>
              <span className="tag">Reference</span>
            </div>
            <div className="card">
              <div className="ic">⚡</div>
              <h3>Rapid-Revision Sheets</h3>
              <p>17 one-page power sheets — formulas, shortcuts, must-know facts and the traps examiners love — for fast last-mile revision.</p>
              <span className="tag">Revision</span>
            </div>
            <div className="card">
              <div className="ic">🗂️</div>
              <h3>Solved PYQ Bank</h3>
              <p>487 previous-year Professional Knowledge questions, fully solved and organised by topic and by year, so you learn the exact pattern.</p>
              <span className="tag">Practice</span>
            </div>
            <div className="card">
              <div className="ic">📝</div>
              <h3>Mock Test Series</h3>
              <p>Sectional and full-length Prelim-pattern mocks — properly timed, with negative marking and full solutions — to build exam temperament.</p>
              <span className="tag">Tests</span>
            </div>
            <div className="card">
              <div className="ic">🎥</div>
              <h3>Live Guidance</h3>
              <p>Weekly free strategy sessions plus dedicated doubt-solving clinics for subscribers — learn, ask, and course-correct in real time.</p>
              <span className="tag">Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS */}
      <section>
        <div className="inner">
          <span className="eyebrow">The four subjects</span>
          <h2 className="sec-title">A full 30-day path for each</h2>
          <div className="subjects">
            <div className="subj">
              <div className="num">01</div>
              <div><h4>Professional Knowledge (IT)</h4><p>The rank-deciding subject — DBMS, computer networks, operating systems, data structures & algorithms, programming, security, software engineering, emerging tech & governance.</p></div>
              <div className="badge">Merit-critical</div>
            </div>
            <div className="subj">
              <div className="num">02</div>
              <div><h4>Quantitative Aptitude</h4><p>Data interpretation as the centrepiece, plus number series, approximation, quadratics and the full arithmetic toolkit — with speed shortcuts.</p></div>
              <div className="badge">Qualifying</div>
            </div>
            <div className="subj">
              <div className="num">03</div>
              <div><h4>Reasoning Ability</h4><p>Puzzles and seating arrangements front-loaded, plus inequalities, syllogisms, coding-decoding, blood relations and more.</p></div>
              <div className="badge">Qualifying</div>
            </div>
            <div className="subj">
              <div className="num">04</div>
              <div><h4>English Language</h4><p>Reading comprehension, grammar and error-spotting, cloze, para-jumbles — and the Descriptive paper (essay, letter, précis).</p></div>
              <div className="badge">Qualifying + Descriptive</div>
            </div>
          </div>
        </div>
      </section>

      {/* EXAM PATTERN */}
      <section>
        <div className="inner">
          <span className="eyebrow">Know the battlefield</span>
          <h2 className="sec-title">The exam pattern, at a glance</h2>
          <p className="sec-sub">The course is engineered around this structure — every lesson and mock mirrors the real pattern and timing.</p>
          <div className="tw">
            <table>
              <thead><tr><th>Stage</th><th>What it contains</th><th>The key idea</th></tr></thead>
              <tbody>
                <tr>
                  <td className="hi">Prelim</td>
                  <td>English · Reasoning · Quantitative Aptitude · <span className="hi">Professional Knowledge</span><br /><small>Objective · section-timed</small></td>
                  <td>A screening gate — clear each section's cut-off to move ahead.</td>
                </tr>
                <tr>
                  <td className="hi">Main</td>
                  <td>Objective paper incl. <span className="hi">Professional Knowledge</span> + a Descriptive English paper</td>
                  <td>Professional Knowledge here <b>decides your final merit.</b></td>
                </tr>
                <tr>
                  <td className="hi">Interview</td>
                  <td>Personal interview</td>
                  <td>Combined with the Main score for the final selection.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="note"><b>The takeaway:</b> qualifying sections open the door; Professional Knowledge wins the seat. Refer to the official IBPS notification for exact dates, marks and eligibility.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <div className="inner">
          <span className="eyebrow">How you'll study</span>
          <h2 className="sec-title">Simple, steady, exam-ready</h2>
          <div className="steps">
            <div className="step"><div className="k">Step 1</div><h4>Start free</h4><p>Begin with free sample days for every subject — full-quality lessons, no strings.</p></div>
            <div className="step"><div className="k">Step 2</div><h4>Go self-paced</h4><p>Follow one lesson a day from the day you join — nobody is ever "behind."</p></div>
            <div className="step"><div className="k">Step 3</div><h4>Test & revise</h4><p>Sit timed mocks, then use the power sheets and PYQ bank to close every gap.</p></div>
            <div className="step"><div className="k">Step 4</div><h4>Show up live</h4><p>Bring your doubts to the weekly sessions and doubt clinics — and walk in exam-ready.</p></div>
          </div>

          <ul className="tick">
            <li>Every practice question comes with a clear, worked explanation.</li>
            <li>Content weighted to what the exam actually asks most.</li>
            <li>Self-paced and evergreen — start any time, learn at your speed.</li>
            <li>One place for notes, questions, tests and live help.</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="cta">
        <h2>Ask me anything — live, tonight at 8 PM</h2>
        <p>IBPS SO IT strategy, section priority, the course, and your career questions. Drop your question in the live chat and let's map your path to the officer's chair.</p>
        <a className="btn" href="https://youtube.com/live/HX8VKZEL1pQ?feature=share" target="_blank" rel="noopener noreferrer">▶ Join the Live AMA</a>
      </div>

      <div className="foot">The Victory Key (TVK) · IBPS SO IT Officer 2026 preparation · Exam details as per the official IBPS notification.</div>

    </div>
  );
}
