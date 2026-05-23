export default function Slide3Persona() {
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
              backgroundColor: "#D4EDD4",
              padding: "0.7vh 1.4vw",
              borderRadius: "2vw",
              fontSize: "0.95vw",
              fontWeight: 700,
              color: "#1A1A14",
              letterSpacing: "0.05vw",
              textTransform: "uppercase",
            }}
          >
            Persona
          </div>
        </div>

        {/* Content */}
        <div style={{ display: "flex", flex: 1, marginTop: "5vh", gap: "4vw", alignItems: "center" }}>
          {/* Left: avatar card */}
          <div style={{ flex: 0.85 }}>
            <div
              style={{
                backgroundColor: "#1A1A14",
                borderRadius: "2vw",
                padding: "4vh 3vw",
                color: "#FAFAF8",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative volt blob */}
              <div
                style={{
                  position: "absolute",
                  top: "-4vh",
                  right: "-3vw",
                  width: "14vw",
                  height: "14vw",
                  backgroundColor: "#CDFF00",
                  borderRadius: "50%",
                  opacity: 0.15,
                }}
              />
              {/* Avatar circle */}
              <div
                style={{
                  width: "7vw",
                  height: "7vw",
                  borderRadius: "50%",
                  backgroundColor: "#CDFF00",
                  marginBottom: "2.5vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "3vw",
                    fontWeight: 800,
                    color: "#1A1A14",
                    lineHeight: 1,
                  }}
                >
                  A
                </div>
              </div>
              <div style={{ fontSize: "2.8vw", fontWeight: 800, lineHeight: 1, marginBottom: "0.8vh", position: "relative", zIndex: 1 }}>
                Ana
              </div>
              <div style={{ fontSize: "1.5vw", color: "#CDFF00", fontWeight: 700, marginBottom: "2.5vh", position: "relative", zIndex: 1 }}>
                28 anos · São Paulo
              </div>
              <div style={{ fontSize: "1.3vw", color: "#B8B89A", lineHeight: 1.5, position: "relative", zIndex: 1, textWrap: "pretty" }}>
                Leitora ativa e ambiciosa. Lê no metrô, na fila, antes de dormir.
              </div>
            </div>
          </div>

          {/* Right: insight bullets */}
          <div style={{ flex: 1.15, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3vh" }}>
            <h2
              style={{
                fontSize: "3.2vw",
                fontWeight: 800,
                color: "#1A1A14",
                lineHeight: 1.15,
                margin: "0 0 1vh 0",
                letterSpacing: "-0.06vw",
                textWrap: "balance",
              }}
            >
              O Leio existe para a Ana.
            </h2>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "1.4vw",
                padding: "2.5vh 2.5vw",
                border: "0.15vw solid #E8E8DC",
              }}
            >
              <div style={{ fontSize: "1.1vw", textTransform: "uppercase", letterSpacing: "0.08vw", color: "#6B6B54", marginBottom: "1.5vh" }}>
                O que ela quer
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", backgroundColor: "#CDFF00", border: "0.15vw solid #3D6B00", flexShrink: 0 }} />
                  <span style={{ fontSize: "1.8vw", color: "#4A4A3A", lineHeight: 1.3 }}>Provar para si mesma que está evoluindo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", backgroundColor: "#CDFF00", border: "0.15vw solid #3D6B00", flexShrink: 0 }} />
                  <span style={{ fontSize: "1.8vw", color: "#4A4A3A", lineHeight: 1.3 }}>Sentir orgulho de cada livro — e mostrar isso</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", backgroundColor: "#CDFF00", border: "0.15vw solid #3D6B00", flexShrink: 0 }} />
                  <span style={{ fontSize: "1.8vw", color: "#4A4A3A", lineHeight: 1.3 }}>Um app que acompanhe a vida real de quem lê</span>
                </div>
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
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1A1A14" }}>03</div>
        </div>
      </div>
    </div>
  );
}
