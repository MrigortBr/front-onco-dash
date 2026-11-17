export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/** Localização do navegador — obrigatória para entrar (decisão de 13/11/2026). */
export function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Este navegador não oferece localização. Use outro navegador para entrar."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "É necessário permitir o compartilhamento de localização no navegador para entrar."
              : "Não foi possível obter sua localização. Tente de novo.",
          ),
        ),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
