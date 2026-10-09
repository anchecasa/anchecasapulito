(function () {
  // Stesso progetto Supabase di anchecasa.it (edsvmnxojsmknjuhobqa), isolato nello
  // schema "marketplace" — vedi infra/anchecasa/supabase-config.json e NOTE-SCHEMA.md.
  // anonKey pubblica, sicura da esporre lato client.
  var URL = "https://edsvmnxojsmknjuhobqa.supabase.co";
  var ANON_KEY = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";

  window.acDb = supabase.createClient(URL, ANON_KEY, {
    db: { schema: "marketplace" }
  });
})();
