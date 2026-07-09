"use client";

export function MeritPath() {
  return (
    <section className="merit-section" aria-labelledby="merit-title">
      <div className="container mx-auto px-4">
        <div className="merit" role="img" aria-label="Merit path: clear Prelims, then Main where only Professional Knowledge builds rank, then Interview; final merit is Main to Interview at 80 to 20.">
          <h3 id="merit-title">How your rank is actually built</h3>
          <div className="flow">
            <div className="step">
              <div className="st">Stage 1 · gate</div>
              <div className="sn">Prelims</div>
              <p className="sd">Clear all 4 sectional cut-offs. Marks not counted.</p>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="step decides">
              <div className="st">Stage 2 · decides rank</div>
              <div className="sn">Main — PK score</div>
              <p className="sd">Only Professional Knowledge builds merit; other sections qualify.</p>
            </div>
            <div className="arrow" aria-hidden="true">→</div>
            <div className="step">
              <div className="st">Stage 3 · 100 marks</div>
              <div className="sn">Interview</div>
              <p className="sd">Qualify at 40% (35% for SC/ST/OBC/PwBD).</p>
            </div>
          </div>
          <div className="weightbar" aria-hidden="true">
            <div className="w main">Main exam — 80%</div>
            <div className="w intv">Interview 20%</div>
          </div>
          <p className="note">Scores are normalised across shifts using the equi-percentile method (up to two decimals). Bottom line: deep Professional Knowledge is where the rank is won.</p>
        </div>
      </div>

      <style jsx>{`
        .merit-section {
          padding: 0 0 70px;
        }

        .merit {
          background: #14213d;
          color: #e9edf5;
          border-radius: 18px;
          padding: 34px 28px;
          position: relative;
          overflow: hidden;
        }

        .merit:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(201, 162, 75, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 162, 75, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(70% 90% at 50% 0, #000, transparent 80%);
        }

        .merit h3 {
          position: relative;
          color: #fff;
          font-size: 1.28rem;
          line-height: 1.12;
          margin: 0 0 0.5em;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .flow {
          position: relative;
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: stretch;
          gap: 0;
          margin: 22px 0 8px;
        }

        .step {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(201, 162, 75, 0.28);
          border-radius: 12px;
          padding: 16px;
          position: relative;
        }

        .step .st {
          font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9faac0;
        }

        .step .sn {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 700;
          color: #fff;
          font-size: 1.14rem;
          margin: 4px 0 6px;
        }

        .step .sd {
          font-size: 0.86rem;
          color: #c4cdde;
          margin: 0;
        }

        .step.decides {
          border-color: #c9a24b;
          background: rgba(201, 162, 75, 0.12);
        }

        .step.decides .sn {
          color: #c9a24b;
        }

        .arrow {
          display: grid;
          place-items: center;
          color: #c9a24b;
          font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 1.3rem;
          padding: 0 10px;
        }

        .weightbar {
          position: relative;
          display: flex;
          height: 38px;
          border-radius: 9px;
          overflow: hidden;
          margin-top: 20px;
          border: 1px solid rgba(201, 162, 75, 0.3);
        }

        .weightbar .w {
          display: grid;
          place-items: center;
          font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 0.82rem;
          font-weight: 600;
          color: #fff;
        }

        .weightbar .w.main {
          flex: 0 0 80%;
          background: linear-gradient(90deg, #26406a, #31517f);
        }

        .weightbar .w.intv {
          flex: 0 0 20%;
          background: #c9a24b;
          color: #221a06;
        }

        .note {
          position: relative;
          font-size: 0.86rem;
          color: #c4cdde;
          margin: 14px 0 0;
        }

        @media (max-width: 760px) {
          .flow {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .arrow {
            transform: rotate(90deg);
            padding: 2px 0;
          }
        }
      `}</style>
    </section>
  );
}