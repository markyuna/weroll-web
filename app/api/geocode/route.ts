// Archivo: app/api/geocode/route.ts
// Proxy server-side a Nominatim para geocoding inverso.
//
// Nominatim exige identificar la aplicación vía el header User-Agent, pero
// los navegadores prohíben a JavaScript establecer ese header en fetch/XHR
// (es un "forbidden header name" del estándar Fetch). Por eso esta llamada
// se hace desde el servidor, donde sí podemos fijarlo, y el cliente solo
// pega a esta ruta same-origin.
import { NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "WeRoll/1.0 (proyecto de patinaje comunitario)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat y lon son obligatorios" }, { status: 400 });
  }

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("lat", lat);
  nominatimUrl.searchParams.set("lon", lon);

  const response = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      "Accept-Language": "es",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "No se pudo geocodificar" }, { status: 502 });
  }

  const data = await response.json();
  const address = data.address ?? {};

  return NextResponse.json({
    city: address.city ?? address.town ?? address.village ?? address.municipality ?? null,
    country: address.country ?? null,
  });
}
