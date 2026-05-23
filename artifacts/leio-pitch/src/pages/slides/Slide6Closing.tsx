function PhoneSessaoAtiva() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0C1A10",
        borderRadius: "3.5vw",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
      }}
    >
      {/* Background gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(12,26,16,0.6) 0%, rgba(12,26,16,0.95) 60%)", zIndex: 1 }} />
      {/* Greenish bg texture */}
      <div style={{ position: "absolute", top: "-4vw", right: "-2vw", width: "10vw", height: "10vw", backgroundColor: "#1A5C2A", borderRadius: "50%", filter: "blur(2vw)", opacity: 0.8 }} />
      <div style={{ position: "absolute", bottom: "8vh", left: "-2vw", width: "8vw", height: "8vw", backgroundColor: "#0D3318", borderRadius: "50%", filter: "blur(1.5vw)" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%", padding: "3vh 1.6vw", boxSizing: "border-box" }}>
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5vh" }}>
          <div style={{ fontSize: "0.7vw", fontWeight: 700, color: "#FAFAF8" }}>9:41</div>
          <div style={{ fontSize: "0.7vw", fontWeight: 700, color: "#FAFAF8" }}>●●●</div>
        </div>

        {/* Book title */}
        <div style={{ marginTop: "1vh", marginBottom: "0.3vh" }}>
          <div style={{ fontSize: "0.65vw", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08vw" }}>Lendo agora</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02vw", lineHeight: 1.2 }}>Dom Casmurro</div>
          <div style={{ fontSize: "0.65vw", color: "rgba(255,255,255,0.5)" }}>Machado de Assis</div>
        </div>

        {/* Big timer */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ fontSize: "0.7vw", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1vw" }}>Sessao ativa</div>
          <div style={{ fontSize: "4.5vw", fontWeight: 900, color: "#CDFF00", letterSpacing: "-0.15vw", lineHeight: 1 }}>24:31</div>
          <div style={{ fontSize: "0.7vw", color: "rgba(255,255,255,0.4)" }}>pag. 120 → atual</div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "0.8vw", width: "100%", marginTop: "0.5vh" }}>
            <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "0.8vh 0.5vw", textAlign: "center", border: "0.06vw solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "1.2vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>1.2</div>
              <div style={{ fontSize: "0.55vw", color: "rgba(255,255,255,0.4)", marginTop: "0.2vh" }}>pag/min</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "0.8vh 0.5vw", textAlign: "center", border: "0.06vw solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "1.2vw", fontWeight: 900, color: "#FAFAF8", lineHeight: 1 }}>+18</div>
              <div style={{ fontSize: "0.55vw", color: "rgba(255,255,255,0.4)", marginTop: "0.2vh" }}>paginas</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "rgba(205,255,0,0.12)", borderRadius: "0.6vw", padding: "0.8vh 0.5vw", textAlign: "center", border: "0.06vw solid rgba(205,255,0,0.25)" }}>
              <div style={{ fontSize: "1.2vw", fontWeight: 900, color: "#CDFF00", lineHeight: 1 }}>+43</div>
              <div style={{ fontSize: "0.55vw", color: "rgba(205,255,0,0.6)", marginTop: "0.2vh" }}>XP</div>
            </div>
          </div>
        </div>

        {/* Pause / stop buttons */}
        <div style={{ display: "flex", gap: "0.8vw" }}>
          <div style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.7vw", padding: "1.2vh 0", display: "flex", alignItems: "center", justifyContent: "center", border: "0.06vw solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FAFAF8" }}>Pausar</div>
          </div>
          <div style={{ flex: 2, backgroundColor: "#CDFF00", borderRadius: "0.7vw", padding: "1.2vh 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "0.75vw", fontWeight: 800, color: "#1A1A14" }}>Encerrar sessao</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Slide6Closing() {
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
      <div style={{ position: "absolute", top: "22vh", left: "54vw", width: "6vw", height: "18vw", backgroundColor: "#F4EDD0", borderRadius: "3vw", transform: "rotate(15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "20vh", right: "7vw", width: "10vw", height: "10vw", backgroundColor: "#CDFF00", borderRadius: "50% 50% 0 0", zIndex: 1, opacity: 0.7 }} />
      <div style={{ position: "absolute", top: "38vh", right: "8vw", width: "3.5vw", height: "3.5vw", backgroundColor: "#D4EDD4", borderRadius: "50%", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "14vh", left: "46vw", width: "9vw", height: "1.8vw", background: "radial-gradient(circle, #1A1A14 0.4vw, transparent 0.5vw)", backgroundSize: "1.8vw 1.8vw", zIndex: 1 }} />

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
          <div style={{ backgroundColor: "#CDFF00", padding: "0.7vh 1.4vw", borderRadius: "2vw", fontSize: "0.95vw", fontWeight: 700, color: "#1A1A14", letterSpacing: "0.05vw", textTransform: "uppercase" }}>
            Proximos passos
          </div>
        </div>

        {/* Content: text left + phone right */}
        <div style={{ display: "flex", flex: 1, marginTop: "3vh", gap: "4vw", alignItems: "center" }}>
          {/* Left: text */}
          <div style={{ flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "inline-block", padding: "0.6vh 1.6vw", backgroundColor: "#1A1A14", borderRadius: "2vw", fontSize: "1.1vw", fontWeight: 700, color: "#CDFF00", marginBottom: "3vh", textTransform: "uppercase", letterSpacing: "0.1vw", width: "fit-content" }}>
              iOS e Android
            </div>
            <h2 style={{ fontSize: "5vw", fontWeight: 800, color: "#1A1A14", lineHeight: 1.05, margin: "0 0 2.5vh 0", letterSpacing: "-0.13vw" }}>
              Registre cada pagina.
            </h2>
            <p style={{ fontSize: "1.7vw", color: "#4A4A3A", lineHeight: 1.4, margin: "0 0 4vh 0" }}>
              Collins editorial meets Nike performance. O primeiro app de leitura com performance para o Brasil.
            </p>
            <div style={{ display: "flex", gap: "1.5vw" }}>
              <div style={{ backgroundColor: "#1A1A14", color: "#FAFAF8", fontSize: "1.4vw", fontWeight: 700, padding: "1.8vh 3vw", borderRadius: "3vw" }}>
                Demo disponivel
              </div>
              <div style={{ backgroundColor: "transparent", color: "#1A1A14", fontSize: "1.4vw", fontWeight: 700, padding: "1.8vh 3vw", borderRadius: "3vw", border: "0.2vw solid #1A1A14" }}>
                leio.app
              </div>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div style={{ flex: 0.7, display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <div
              style={{
                width: "14vw",
                height: "26vw",
                backgroundColor: "#0A0A08",
                borderRadius: "2.2vw",
                padding: "0.5vw",
                boxSizing: "border-box",
                boxShadow: "0 2vw 5vw rgba(0,0,0,0.3), 0 0 0 0.12vw rgba(255,255,255,0.08)",
                position: "relative",
              }}
            >
              {/* Notch */}
              <div style={{ position: "absolute", top: "0.5vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.5vw", backgroundColor: "#0A0A08", borderRadius: "0 0 0.5vw 0.5vw", zIndex: 20 }} />
              {/* Screen */}
              <div style={{ width: "100%", height: "100%", borderRadius: "1.8vw", overflow: "hidden" }}>
                <PhoneSessaoAtiva />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2.5vh", borderTop: "0.15vw solid rgba(26,26,20,0.1)" }}>
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
