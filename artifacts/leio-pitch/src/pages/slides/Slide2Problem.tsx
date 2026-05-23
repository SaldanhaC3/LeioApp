export default function Slide2Problem() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#FAFAF8",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        color: "#1A1A14",
        display: "flex",
      }}
    >
      {/* Background shapes */}
      <div
        style={{
          position: "absolute",
          top: "-18vh",
          right: "-6vw",
          width: "44vw",
          height: "44vw",
          backgroundColor: "#E8F5B0",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-12vh",
          left: "-8vw",
          width: "34vw",
          height: "34vw",
          backgroundColor: "#D4EDD4",
          borderRadius: "50%",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "22vh",
          left: "56vw",
          width: "7vw",
          height: "20vw",
          backgroundColor: "#F4EDD0",
          borderRadius: "4vw",
          transform: "rotate(15deg)",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "22vh",
          right: "18vw",
          width: "11vw",
          height: "11vw",
          backgroundColor: "#CDFF00",
          borderRadius: "50% 50% 0 0",
          zIndex: 1,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "42vh",
          right: "9vw",
          width: "3.5vw",
          height: "3.5vw",
          backgroundColor: "#D4EDD4",
          borderRadius: "50%",
          zIndex: 1,
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          margin: "7vh 7vw",
          width: "calc(100vw - 14vw)",
          height: "calc(100vh - 14vh)",
          backgroundColor: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(1vw)",
          WebkitBackdropFilter: "blur(1vw)",
          borderRadius: "2vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
          padding: "4vh 4vw",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
            <div
              style={{
                width: "2.8vw",
                height: "2.8vw",
                backgroundColor: "#CDFF00",
                borderRadius: "0.7vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "1.2vw", height: "1.2vw", backgroundColor: "#1A1A14", borderRadius: "50%" }} />
            </div>
            <div style={{ fontSize: "1.4vw", fontWeight: 800, letterSpacing: "-0.03vw" }}>Leio</div>
          </div>
          <div
            style={{
              backgroundColor: "#F4EDD0",
              padding: "0.7vh 1.4vw",
              borderRadius: "2vw",
              fontSize: "0.95vw",
              fontWeight: 700,
              color: "#1A1A14",
              letterSpacing: "0.05vw",
              textTransform: "uppercase",
            }}
          >
            O problema
          </div>
        </div>

        {/* Content: left text + right stat cards */}
        <div style={{ display: "flex", flex: 1, marginTop: "5vh", gap: "4vw", alignItems: "center" }}>
          {/* Left */}
          <div style={{ flex: 1.1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2
              style={{
                fontSize: "3.8vw",
                fontWeight: 800,
                color: "#1A1A14",
                lineHeight: 1.1,
                margin: "0 0 3vh 0",
                letterSpacing: "-0.08vw",
                textWrap: "balance",
              }}
            >
              Leitura é invisível.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div
                  style={{
                    width: "0.5vw",
                    height: "0.5vw",
                    borderRadius: "50%",
                    backgroundColor: "#CDFF00",
                    marginTop: "1.1vh",
                    flexShrink: 0,
                    border: "0.15vw solid #3D6B00",
                  }}
                />
                <p style={{ fontSize: "2vw", color: "#4A4A3A", lineHeight: 1.4, margin: 0, textWrap: "pretty" }}>
                  Brasileiros compram livros — e raramente terminam.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div
                  style={{
                    width: "0.5vw",
                    height: "0.5vw",
                    borderRadius: "50%",
                    backgroundColor: "#CDFF00",
                    marginTop: "1.1vh",
                    flexShrink: 0,
                    border: "0.15vw solid #3D6B00",
                  }}
                />
                <p style={{ fontSize: "2vw", color: "#4A4A3A", lineHeight: 1.4, margin: 0, textWrap: "pretty" }}>
                  Sem registro, leitura não vira hábito.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div
                  style={{
                    width: "0.5vw",
                    height: "0.5vw",
                    borderRadius: "50%",
                    backgroundColor: "#CDFF00",
                    marginTop: "1.1vh",
                    flexShrink: 0,
                    border: "0.15vw solid #3D6B00",
                  }}
                />
                <p style={{ fontSize: "2vw", color: "#4A4A3A", lineHeight: 1.4, margin: 0, textWrap: "pretty" }}>
                  O esforço some: ninguém sabe que você leu Dostoiévski no metrô.
                </p>
              </div>
            </div>
          </div>

          {/* Right: two insight cards */}
          <div style={{ flex: 0.9, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div
              style={{
                backgroundColor: "#1A1A14",
                borderRadius: "1.5vw",
                padding: "3vh 2.5vw",
                color: "#FAFAF8",
              }}
            >
              <div style={{ fontSize: "1.1vw", textTransform: "uppercase", letterSpacing: "0.08vw", opacity: 0.6, marginBottom: "1.2vh" }}>
                Mercado editorial BR
              </div>
              <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1, color: "#CDFF00" }}>
                R$ 4,2bi
              </div>
              <div style={{ fontSize: "1.4vw", color: "#D4EDD4", marginTop: "1vh" }}>
                faturamento em 2024 (CBL/SNEL)
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "1.5vw",
                padding: "3vh 2.5vw",
                border: "0.15vw solid #E8E8DC",
              }}
            >
              <div style={{ fontSize: "1.1vw", textTransform: "uppercase", letterSpacing: "0.08vw", color: "#6B6B54", marginBottom: "1.2vh" }}>
                Conteúdo digital
              </div>
              <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1, color: "#1A1A14" }}>
                +21,6%
              </div>
              <div style={{ fontSize: "1.4vw", color: "#6B6B54", marginTop: "1vh" }}>
                crescimento em 2024 — dobrou desde 2019
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "2.5vh",
            borderTop: "0.15vw solid rgba(26,26,20,0.1)",
          }}
        >
          <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#6B6B54" }}>leio.app</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1A1A14" }}>02</div>
        </div>
      </div>
    </div>
  );
}
