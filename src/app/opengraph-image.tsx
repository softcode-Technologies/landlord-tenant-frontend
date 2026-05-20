import { ImageResponse } from "next/og"
import { BRAND_NAME } from "@/lib/config/brand"

export const alt = `${BRAND_NAME} — Run your rentals like a business`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a1e33",
          backgroundImage:
            "linear-gradient(135deg, #0a1e33 0%, #0f2d48 55%, #1a3c5e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: "#1a3c5e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#f97316",
                display: "flex",
              }}
            />
          </div>
          <div style={{ display: "flex", marginLeft: 18, fontSize: 36, fontWeight: 700, color: "white" }}>
            {BRAND_NAME === "NaijaRental" ? (
              <>
                Naija<span style={{ color: "#f97316" }}>Rental</span>
              </>
            ) : (
              BRAND_NAME
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 78,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          <span>Run your rentals</span>
          <span style={{ color: "#fb923c" }}>like a business.</span>
        </div>

        <div style={{ display: "flex", marginTop: 32, fontSize: 30, color: "rgba(226,232,240,0.85)", maxWidth: 900 }}>
          The rental operating system for Nigeria — listings, payments, and tenancies in one place.
        </div>

        <div style={{ display: "flex", marginTop: 44, gap: 16 }}>
          {["KYC-verified", "Naira-native", "Free to start"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                fontSize: 24,
                color: "#fbbf24",
                border: "1px solid rgba(249,115,22,0.4)",
                backgroundColor: "rgba(249,115,22,0.12)",
                padding: "8px 22px",
                borderRadius: 999,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
