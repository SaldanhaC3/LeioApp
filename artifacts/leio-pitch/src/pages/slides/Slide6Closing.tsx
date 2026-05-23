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
          bottom: "20vh",
          right: "16vw",
          width: "14vw",
          height: "14vw",
          backgroundColor: "#CDFF00",
          borderRadius: "50% 50% 0 0",
          zIndex: 1,
          opacity: 0.75,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "38vh",
          right: "8vw",
          width: "4vw",
          height: "4vw",
          backgroundColor: "#D4EDD4",
          borderRadius: "50%",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "14vh",
          left: "46vw",
          width: "9vw",
          height: "1.8vw",
          background: "radial-gradient(circle, #1A1A14 0.4vw, transparent 0.5vw)",
          backgroundSize: "1.8vw 1.8vw",
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
              backgroundColor: "#CDFF00",
              padding: "0.7vh 1.4vw",
              borderRadius: "2vw",
              fontSize: "0.95vw",
              fontWeight: 700,
              color: "#1A1A14",
              letterSpacing: "0.05vw",
              textTransform: "uppercase",
            }}
          >
            Proximos passos
          </div>
        </div>

        {/* Central content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "0.6vh 1.6vw",
              backgroundColor: "#1A1A14",
              borderRadius: "2vw",
              fontSize: "1.1vw",
              fontWeight: 700,
              color: "#CDFF00",
              marginBottom: "3.5vh",
              textTransform: "uppercase",
              letterSpacing: "0.1vw",
            }}
          >
            iOS e Android
          </div>
          <h2
            style={{
              fontSize: "5.8vw",
              fontWeight: 800,
              color: "#1A1A14",
              lineHeight: 1.05,
              margin: "0 0 2.5vh 0",
              letterSpacing: "-0.13vw",
              maxWidth: "62vw",
              textWrap: "balance",
            }}
          >
            Registre cada pagina.
          </h2>
          <p
            style={{
              fontSize: "1.9vw",
              color: "#4A4A3A",
              lineHeight: 1.4,
              margin: "0 0 5vh 0",
              maxWidth: "48vw",
              textWrap: "pretty",
            }}
          >
            Collins editorial meets Nike performance. O primeiro app de leitura com performance para o Brasil.
          </p>

          {/* Two info pills */}
          <div style={{ display: "flex", gap: "2vw" }}>
            <div
              style={{
                backgroundColor: "#1A1A14",
                color: "#FAFAF8",
                fontSize: "1.5vw",
                fontWeight: 700,
                padding: "2vh 3.5vw",
                borderRadius: "3vw",
              }}
            >
              Demo disponivel
            </div>
            <div
              style={{
                backgroundColor: "transparent",
                color: "#1A1A14",
                fontSize: "1.5vw",
                fontWeight: 700,
                padding: "2vh 3.5vw",
                borderRadius: "3vw",
                border: "0.2vw solid #1A1A14",
              }}
            >
              leio.app
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
