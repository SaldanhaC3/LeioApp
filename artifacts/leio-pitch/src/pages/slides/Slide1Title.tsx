function PhoneHomeScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#141410",
        borderRadius: "3.5vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "3vh 1.6vw",
        boxSizing: "border-box",
        gap: "1.4vh",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4vh" }}>
        <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FAFAF8" }}>9:41</div>
        <div style={{ display: "flex", gap: "0.3vw", alignItems: "center" }}>
          <div style={{ width: "0.8vw", height: "0.5vw", backgroundColor: "#FAFAF8", borderRadius: "0.1vw", opacity: 0.8 }} />
          <div style={{ width: "0.8vw", height: "0.5vw", backgroundColor: "#FAFAF8", borderRadius: "0.1vw", opacity: 0.5 }} />
        </div>
      </div>

      {/* Header: greeting + level */}
      <div>
        <div style={{ fontSize: "0.75vw", color: "#6B6B54", fontWeight: 500 }}>Bom dia. Café preto e Machado?</div>
        <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#CDFF00", letterSpacing: "-0.03vw" }}>Iniciante Literário</div>
      </div>

      {/* Fôlego card */}
      <div
        style={{
          backgroundColor: "#232318",
          borderRadius: "0.8vw",
          padding: "0.9vh 1vw",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "0.08vw solid #2A2A20",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
          <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", backgroundColor: "#CDFF0022", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "0.6vw", height: "0.8vw", backgroundColor: "#CDFF00", borderRadius: "0.15vw 0.15vw 0 0", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
          </div>
          <div>
            <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>3 dias</div>
            <div style={{ fontSize: "0.6vw", color: "#6B6B54" }}>de fôlego</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.3vw" }}>
          <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", backgroundColor: "#CDFF00" }} />
          <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", backgroundColor: "#CDFF00" }} />
          <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", backgroundColor: "#2A2A20" }} />
        </div>
      </div>

      {/* Current book card */}
      <div style={{ fontSize: "0.65vw", color: "#6B6B54", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05vw" }}>Lendo agora</div>
      <div
        style={{
          backgroundColor: "#1A5C2A",
          borderRadius: "0.8vw",
          padding: "1.2vh 1vw",
          display: "flex",
          gap: "0.8vw",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.02vw" }}>Dom Casmurro</div>
          <div style={{ fontSize: "0.65vw", color: "rgba(255,255,255,0.65)", marginTop: "0.3vh" }}>Machado de Assis</div>
          <div style={{ marginTop: "0.8vh" }}>
            <div style={{ fontSize: "0.5vw", color: "rgba(255,255,255,0.5)", letterSpacing: "0.06vw", textTransform: "uppercase" }}>FALTAM</div>
            <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#CDFF00", lineHeight: 1.1 }}>2H 14MIN</div>
            <div style={{ fontSize: "0.5vw", color: "rgba(255,255,255,0.5)" }}>no seu ritmo</div>
          </div>
        </div>
        <div style={{ width: "2.5vw", height: "3.5vw", borderRadius: "0.4vw", backgroundColor: "rgba(0,0,0,0.3)" }} />
      </div>

      {/* Start session btn */}
      <div
        style={{
          backgroundColor: "#CDFF00",
          borderRadius: "0.6vw",
          padding: "0.8vh 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4vw",
        }}
      >
        <div style={{ width: "0", height: "0", borderTop: "0.35vw solid transparent", borderBottom: "0.35vw solid transparent", borderLeft: "0.6vw solid #1A1A14" }} />
        <div style={{ fontSize: "0.75vw", fontWeight: 800, color: "#1A1A14" }}>Iniciar sessão</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5vw" }}>
        <div style={{ flex: "1 1 40%", backgroundColor: "#232318", borderRadius: "0.6vw", padding: "0.6vh 0.8vw", border: "0.08vw solid #2A2A20" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>247</div>
          <div style={{ fontSize: "0.5vw", color: "#6B6B54", marginTop: "0.2vh" }}>Páginas lidas</div>
        </div>
        <div style={{ flex: "1 1 40%", backgroundColor: "#232318", borderRadius: "0.6vw", padding: "0.6vh 0.8vw", border: "0.08vw solid #2A2A20" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>3</div>
          <div style={{ fontSize: "0.5vw", color: "#6B6B54", marginTop: "0.2vh" }}>Livros lidos</div>
        </div>
        <div style={{ flex: "1 1 40%", backgroundColor: "#232318", borderRadius: "0.6vw", padding: "0.6vh 0.8vw", border: "0.08vw solid #2A2A20" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>1.2 p/min</div>
          <div style={{ fontSize: "0.5vw", color: "#6B6B54", marginTop: "0.2vh" }}>Pace médio</div>
        </div>
        <div style={{ flex: "1 1 40%", backgroundColor: "#232318", borderRadius: "0.6vw", padding: "0.6vh 0.8vw", border: "0.08vw solid #2A2A20" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>12</div>
          <div style={{ fontSize: "0.5vw", color: "#6B6B54", marginTop: "0.2vh" }}>Sessões</div>
        </div>
      </div>
    </div>
  );
}

export default function Slide1Title() {
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
      <div style={{ position: "absolute", top: "-18vh", right: "-6vw", width: "44vw", height: "44vw", backgroundColor: "#E8F5B0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-12vh", left: "-8vw", width: "34vw", height: "34vw", backgroundColor: "#D4EDD4", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "55vh", left: "48vw", width: "6vw", height: "18vw", backgroundColor: "#F4EDD0", borderRadius: "3vw", transform: "rotate(15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "18vh", right: "8vw", width: "9vw", height: "9vw", backgroundColor: "#CDFF00", borderRadius: "50% 50% 0 0", zIndex: 1, opacity: 0.7 }} />

      {/* Main card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          margin: "7vh 7vw",
          width: "calc(100vw - 14vw)",
          height: "calc(100vh - 14vh)",
          backgroundColor: "rgba(255, 255, 255, 0.45)",
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
            <div style={{ width: "2.8vw", height: "2.8vw", backgroundColor: "#CDFF00", borderRadius: "0.7vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", backgroundColor: "#1A1A14", borderRadius: "50%" }} />
            </div>
            <div style={{ fontSize: "1.4vw", fontWeight: 800, letterSpacing: "-0.03vw" }}>Leio</div>
          </div>
          <div style={{ backgroundColor: "#CDFF00", padding: "0.7vh 1.4vw", borderRadius: "2vw", fontSize: "0.95vw", fontWeight: 700, color: "#1A1A14", letterSpacing: "0.05vw", textTransform: "uppercase" }}>
            Pitch 2025
          </div>
        </div>

        {/* Content: two-column */}
        <div style={{ display: "flex", flex: 1, marginTop: "3vh", gap: "4vw", alignItems: "center" }}>
          {/* Left: text */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "inline-block", padding: "0.5vh 1vw", backgroundColor: "#E8F5B0", borderRadius: "0.6vw", fontSize: "1vw", fontWeight: 700, color: "#3D6B00", marginBottom: "2.5vh", textTransform: "uppercase", letterSpacing: "0.1vw", width: "fit-content" }}>
              Performance de Leitura
            </div>
            <h1 style={{ fontSize: "5.5vw", fontWeight: 800, lineHeight: 1.05, margin: "0 0 2.5vh 0", color: "#1A1A14", letterSpacing: "-0.15vw" }}>
              Registre cada página.
            </h1>
            <p style={{ fontSize: "1.7vw", fontWeight: 400, color: "#6B6B54", lineHeight: 1.4, margin: 0 }}>
              O app que transforma leitura em performance — sessoes, stats e cards editoriais para compartilhar.
            </p>
          </div>

          {/* Right: phone mockup */}
          <div style={{ flex: 0.65, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            {/* Phone frame */}
            <div
              style={{
                width: "14vw",
                height: "26vw",
                backgroundColor: "#0A0A08",
                borderRadius: "2.2vw",
                padding: "0.5vw",
                boxSizing: "border-box",
                boxShadow: "0 2vw 5vw rgba(0,0,0,0.25), 0 0 0 0.12vw rgba(255,255,255,0.08)",
                position: "relative",
              }}
            >
              {/* Notch */}
              <div style={{ position: "absolute", top: "0.5vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.5vw", backgroundColor: "#0A0A08", borderRadius: "0 0 0.5vw 0.5vw", zIndex: 20 }} />
              {/* Screen */}
              <div style={{ width: "100%", height: "100%", borderRadius: "1.8vw", overflow: "hidden" }}>
                <PhoneHomeScreen />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh", borderTop: "0.15vw solid rgba(26,26,20,0.1)" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#6B6B54" }}>leio.app</div>
          <div style={{ display: "flex", gap: "0.8vw" }}>
            <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#CDFF00" }} />
            <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#D4EDD4" }} />
            <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#F4EDD0" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
