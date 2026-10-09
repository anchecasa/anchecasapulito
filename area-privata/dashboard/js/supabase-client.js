(function () {
  // Copia autonoma (dashboard/ non usa js/ della root): stesso progetto Supabase di
  // anchecasa.it, schema dedicato "marketplace" — vedi infra/anchecasa/supabase-config.json.
  var URL = "https://edsvmnxojsmknjuhobqa.supabase.co";
  var ANON_KEY = "sb_publishable_QbYv61SkMkjA9_GGb1hhOA_6v6GEw87";

  window.acDb = supabase.createClient(URL, ANON_KEY, {
    db: { schema: "marketplace" }
  });
})();
