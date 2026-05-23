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
              backgroundColor: "#E8F5B0",
              padding: "0.7vh 1.4vw",
              borderRadius: "2vw",
              fontSize: "0.95vw",
              fontWeight: 700,
              color: "#3D6B00",
              letterSpacing: "0.05vw",
              textTransform: "uppercase",
            }}
          >
            O produto
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: "4vh" }}>
          <h2
            style={{
              fontSize: "3.2vw",
              fontWeight: 800,
              color: "#1A1A14",
              lineHeight: 1.1,
              margin: "0 0 1vh 0",
              letterSpacing: "-0.06vw",
            }}
          >
            Três pilares.
          </h2>
          <p style={{ fontSize: "1.8vw", color: "#6B6B54", margin: 0, lineHeight: 1.3 }}>
            Tudo o que um leitor sério precisa — em um app.
          </p>
        </div>

        {/* Three pillars */}
        <div style={{ display: "flex", gap: "2.5vw", flex: 1, marginTop: "4vh", paddingBottom: "1vh" }}>
          {/* Pillar 1 */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#1A1A14",
              borderRadius: "1.8vw",
              padding: "3.5vh 2.5vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "#FAFAF8",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "-3vh",
                right: "-2vw",
                width: "10vw",
                height: "10vw",
                backgroundColor: "#CDFF00",
                borderRadius: "50%",
                opacity: 0.12,
              }}
            />
            <div
              style={{
                width: "3.5vw",
                height: "3.5vw",
                backgroundColor: "#CDFF00",
                borderRadius: "0.8vw",
                marginBottom: "2.5vh",
              }}
            />
            <div>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#CDFF00", marginBottom: "1vh", fontWeight: 700 }}>
                01
              </div>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "1.5vh", lineHeight: 1.2 }}>
                Sessoes e Stats
              </div>
              <div style={{ fontSize: "1.5vw", color: "#B8B89A", lineHeight: 1.4 }}>
                Timer em tempo real, ritmo em pag/min e progresso por sessao
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#CDFF00",
              borderRadius: "1.8vw",
              padding: "3.5vh 2.5vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "#1A1A14",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "-3vh",
                right: "-2vw",
                width: "10vw",
                height: "10vw",
                backgroundColor: "#1A1A14",
                borderRadius: "50%",
                opacity: 0.08,
              }}
            />
            <div
              style={{
                width: "3.5vw",
                height: "3.5vw",
                backgroundColor: "#1A1A14",
                borderRadius: "0.8vw",
                marginBottom: "2.5vh",
                opacity: 0.15,
              }}
            />
            <div>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#3D6B00", marginBottom: "1vh", fontWeight: 700 }}>
                02
              </div>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "1.5vh", lineHeight: 1.2 }}>
                Cards Sociais
              </div>
              <div style={{ fontSize: "1.5vw", color: "#3D6B00", lineHeight: 1.4 }}>
                Cards editoriais prontos para Instagram Stories e Feed
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: "1.8vw",
              padding: "3.5vh 2.5vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "0.15vw solid #E8E8DC",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "-3vh",
                right: "-2vw",
                width: "10vw",
                height: "10vw",
                backgroundColor: "#D4EDD4",
                borderRadius: "50%",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                width: "3.5vw",
                height: "3.5vw",
                backgroundColor: "#D4EDD4",
                borderRadius: "0.8vw",
                marginBottom: "2.5vh",
              }}
            />
            <div>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#6B6B54", marginBottom: "1vh", fontWeight: 700 }}>
                03
              </div>
              <div style={{ fontSize: "2vw", fontWeight: 800, marginBottom: "1.5vh", lineHeight: 1.2, color: "#1A1A14" }}>
                Gamificacao
              </div>
              <div style={{ fontSize: "1.5vw", color: "#6B6B54", lineHeight: 1.4 }}>
                XP, badges literarios, streaks, missoes diarias e mascote Capi
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
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1A1A14" }}>04</div>
        </div>
      </div>
    </div>
  );
}
