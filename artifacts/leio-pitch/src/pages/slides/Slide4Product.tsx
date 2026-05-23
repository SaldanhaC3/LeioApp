export default function Slide4Product() {
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
      <div style={{ position: "absolute", top: "22vh", left: "56vw", width: "7vw", height: "20vw", backgroundColor: "#F4EDD0", borderRadius: "4vw", transform: "rotate(15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "22vh", right: "18vw", width: "11vw", height: "11vw", backgroundColor: "#CDFF00", borderRadius: "50% 50% 0 0", zIndex: 1, opacity: 0.6 }} />

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
            <div style={{ width: "2.8vw", height: "2.8vw", backgroundColor: "#CDFF00", borderRadius: "0.7vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", backgroundColor: "#1A1A14", borderRadius: "50%" }} />
            </div>
            <div style={{ fontSize: "1.4vw", fontWeight: 800, letterSpacing: "-0.03vw" }}>Leio</div>
          </div>
          <div style={{ backgroundColor: "#E8F5B0", padding: "0.7vh 1.4vw", borderRadius: "2vw", fontSize: "0.95vw", fontWeight: 700, color: "#3D6B00", letterSpacing: "0.05vw", textTransform: "uppercase" }}>
            O produto
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: "3vh" }}>
          <h2 style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1A1A14", lineHeight: 1.1, margin: "0 0 0.5vh 0", letterSpacing: "-0.06vw" }}>
            Tres pilares.
          </h2>
          <p style={{ fontSize: "1.6vw", color: "#6B6B54", margin: 0, lineHeight: 1.3 }}>
            Tudo o que um leitor sério precisa — em um app.
          </p>
        </div>

        {/* Three pillars */}
        <div style={{ display: "flex", gap: "2vw", flex: 1, marginTop: "3vh", paddingBottom: "1vh" }}>

          {/* Pillar 1: Sessões & Stats */}
          <div style={{ flex: 1, backgroundColor: "#1A1A14", borderRadius: "1.8vw", padding: "2.5vh 2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#FAFAF8", position: "relative", overflow: "hidden" }}>
            <div>
              <div style={{ fontSize: "0.85vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#CDFF00", marginBottom: "0.5vh", fontWeight: 700 }}>01</div>
              <div style={{ fontSize: "1.7vw", fontWeight: 800, marginBottom: "0.8vh", lineHeight: 1.2 }}>Sessoes e Stats</div>
              <div style={{ fontSize: "1.2vw", color: "#B8B89A", lineHeight: 1.4, marginBottom: "2vh" }}>Timer em tempo real e ritmo em pag/min</div>
            </div>
            {/* Mini UI: sessão ativa */}
            <div style={{ backgroundColor: "#232318", borderRadius: "1vw", padding: "1.5vh 1.2vw", border: "0.08vw solid #2E2E24" }}>
              <div style={{ fontSize: "0.75vw", color: "#6B6B54", textTransform: "uppercase", letterSpacing: "0.08vw", marginBottom: "0.8vh" }}>Sessao ativa</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 900, color: "#CDFF00", letterSpacing: "-0.1vw", lineHeight: 1 }}>24:31</div>
              <div style={{ display: "flex", gap: "1vw", marginTop: "1.2vh" }}>
                <div style={{ flex: 1, backgroundColor: "#141410", borderRadius: "0.5vw", padding: "0.6vh 0.5vw" }}>
                  <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>1.2</div>
                  <div style={{ fontSize: "0.6vw", color: "#6B6B54" }}>pag/min</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#141410", borderRadius: "0.5vw", padding: "0.6vh 0.5vw" }}>
                  <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>+18</div>
                  <div style={{ fontSize: "0.6vw", color: "#6B6B54" }}>paginas</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#141410", borderRadius: "0.5vw", padding: "0.6vh 0.5vw" }}>
                  <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#CDFF00", lineHeight: 1 }}>43</div>
                  <div style={{ fontSize: "0.6vw", color: "#6B6B54" }}>XP hoje</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 2: Cards Sociais */}
          <div style={{ flex: 1, backgroundColor: "#CDFF00", borderRadius: "1.8vw", padding: "2.5vh 2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", color: "#1A1A14", position: "relative", overflow: "hidden" }}>
            <div>
              <div style={{ fontSize: "0.85vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#3D6B00", marginBottom: "0.5vh", fontWeight: 700 }}>02</div>
              <div style={{ fontSize: "1.7vw", fontWeight: 800, marginBottom: "0.8vh", lineHeight: 1.2 }}>Cards Sociais</div>
              <div style={{ fontSize: "1.2vw", color: "#3D6B00", lineHeight: 1.4, marginBottom: "2vh" }}>Prontos para Stories e Feed</div>
            </div>
            {/* Mini card preview */}
            <div style={{ backgroundColor: "#1A1A14", borderRadius: "1vw", padding: "1.5vh 1.2vw", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "3vw", height: "3vw", backgroundColor: "#CDFF00", borderRadius: "0 0 0 2vw", opacity: 0.15 }} />
              <div style={{ fontSize: "0.65vw", color: "#CDFF00", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06vw", marginBottom: "0.6vh" }}>Acabei de ler</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1.1, marginBottom: "0.3vh" }}>Dom Casmurro</div>
              <div style={{ fontSize: "0.8vw", color: "rgba(255,255,255,0.55)" }}>Machado de Assis</div>
              <div style={{ display: "flex", gap: "0.5vw", marginTop: "1vh", alignItems: "center" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", backgroundColor: "#CDFF00", borderRadius: "0.2vw" }} />
                <div style={{ fontSize: "0.65vw", color: "#CDFF00", fontWeight: 700 }}>leio.app</div>
              </div>
            </div>
          </div>

          {/* Pillar 3: Gamificação */}
          <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.8vw", padding: "2.5vh 2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "0.15vw solid #E8E8DC", position: "relative", overflow: "hidden" }}>
            <div>
              <div style={{ fontSize: "0.85vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#6B6B54", marginBottom: "0.5vh", fontWeight: 700 }}>03</div>
              <div style={{ fontSize: "1.7vw", fontWeight: 800, marginBottom: "0.8vh", lineHeight: 1.2, color: "#1A1A14" }}>Gamificacao</div>
              <div style={{ fontSize: "1.2vw", color: "#6B6B54", lineHeight: 1.4, marginBottom: "2vh" }}>XP, badges e missoes diarias com Capi</div>
            </div>
            {/* Mini badges UI */}
            <div style={{ backgroundColor: "#FAFAF8", borderRadius: "1vw", padding: "1.2vh 1vw", border: "0.08vw solid #E8E8DC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1vh" }}>
                <div style={{ fontSize: "0.75vw", fontWeight: 800, color: "#1A1A14" }}>Paginator</div>
                <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#CDFF00", backgroundColor: "#1A1A14", padding: "0.2vh 0.5vw", borderRadius: "0.4vw" }}>320 XP</div>
              </div>
              <div style={{ height: "0.4vh", backgroundColor: "#E8E8DC", borderRadius: "0.3vw", overflow: "hidden", marginBottom: "1.2vh" }}>
                <div style={{ height: "100%", width: "62%", backgroundColor: "#CDFF00", borderRadius: "0.3vw" }} />
              </div>
              <div style={{ display: "flex", gap: "0.6vw" }}>
                <div style={{ flex: 1, backgroundColor: "#1A1A14", borderRadius: "0.5vw", padding: "0.6vh 0.4vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vh" }}>
                  <div style={{ fontSize: "0.9vw" }}>🏆</div>
                  <div style={{ fontSize: "0.5vw", color: "#CDFF00", fontWeight: 700, textAlign: "center" }}>1a sessao</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#1A1A14", borderRadius: "0.5vw", padding: "0.6vh 0.4vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vh" }}>
                  <div style={{ fontSize: "0.9vw" }}>🔥</div>
                  <div style={{ fontSize: "0.5vw", color: "#CDFF00", fontWeight: 700, textAlign: "center" }}>Streak 7</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#E8E8DC", borderRadius: "0.5vw", padding: "0.6vh 0.4vw", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vh" }}>
                  <div style={{ fontSize: "0.9vw", opacity: 0.3 }}>⚡</div>
                  <div style={{ fontSize: "0.5vw", color: "#6B6B54", fontWeight: 700, textAlign: "center" }}>Bloqueado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2.5vh", borderTop: "0.15vw solid rgba(26,26,20,0.1)" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#6B6B54" }}>leio.app</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1A1A14" }}>04</div>
        </div>
      </div>
    </div>
  );
}
