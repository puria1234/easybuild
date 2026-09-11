import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Static WOFF, not WOFF2: satori/next-og can't parse WOFF2, and Archivo's
// only Google-hosted TTF is a variable font satori also can't parse.
const ARCHIVO_BOLD_WOFF_URL = "https://cdn.jsdelivr.net/npm/@fontsource/archivo@5.3.0/files/archivo-latin-700-normal.woff";

export default async function Icon() {
  const archivo = await fetch(ARCHIVO_BOLD_WOFF_URL).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0F12",
          borderRadius: 14,
        }}
      >
        <span style={{ fontFamily: "Archivo", fontWeight: 700, fontSize: 40, color: "#C6743E", lineHeight: 1 }}>E</span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: archivo, weight: 700, style: "normal" }],
    },
  );
}
