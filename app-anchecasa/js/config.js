/* Configurazione dell'app AncheCasa.
   Sono chiavi PUBBLICHE (fatte per stare nel telefono e nel browser), protette da:
   - Supabase: permessi del database (RLS) sulle tabelle app_ e sulle funzioni;
   - Google Maps: limitazione ai domini nella console Google (aggiungere il dominio dell'app).
   Niente chiavi segrete qui: quella dell'analisi video sta solo nei segreti di Supabase. */
export const CONFIG = {
  supabaseUrl: "https://edsvmnxojsmknjuhobqa.supabase.co",
  supabaseKey: "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87",
  googleMapsKey: "AIzaSyCoAlGcA8AUR9BFpC5mp7olNCjY7UeiII0",
  googleMapId: "DEMO_MAP_ID",
  funzioneAnalisi: "supermastro-analisi",
  areaPrivata: "https://areaprivata.anchecasa.it",
  privacyUrl: "",            // indirizzo dell'informativa privacy (da mettere prima di andare online)
  premioSegnalazione: "",    // testo del premio per chi segnala (vuoto finché Nando non lo decide)
  passaggio: { interventi: 20, media: 4.5 }, // requisiti per passare da artigiano a Impresa (li decide Nando)
  versione: "1.0.0 · 09.10.2026",
};
