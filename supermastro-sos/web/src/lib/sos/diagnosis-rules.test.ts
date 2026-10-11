import assert from "node:assert/strict";
import test from "node:test";
import { applyRules, dangerOf, SAMPLE_CASES, type ModelDraft } from "@/lib/sos/diagnosis-rules";
import { parseDiagnosis } from "@/lib/sos/parse-diagnosis";

test("i cinque video di prova danno gli esiti previsti", () => {
  assert.equal(applyRules(SAMPLE_CASES.sifone).esito, "fai_da_te");
  assert.equal(applyRules(SAMPLE_CASES.scintille).esito, "pericolo");
  assert.equal(applyRules(SAMPLE_CASES.gas).esito, "pericolo");
  assert.equal(applyRules(SAMPLE_CASES.buio).esito, "da_verificare");
  assert.equal(applyRules(SAMPLE_CASES.auto).esito, "fuori_tema");
});

test("il pericolo non ha passi e la guida del sifone ne ha almeno tre", () => {
  const pericolo = applyRules(SAMPLE_CASES.scintille);
  assert.equal(pericolo.payload.fai_da_te, null);
  assert.ok((pericolo.payload.azioni.length ?? 0) >= 3);
  const guida = applyRules(SAMPLE_CASES.sifone);
  assert.ok((guida.payload.fai_da_te?.passi.length ?? 0) >= 3);
  assert.equal(applyRules(SAMPLE_CASES.buio).payload.fai_da_te, null);
  assert.equal(applyRules(SAMPLE_CASES.auto).payload.fai_da_te, null);
});

// Prima questo test diceva "il gas incerto diventa da_verificare".
// Decisione di prodotto: prima la sicurezza. Con segnali di gas, anche se il
// modello è poco sicuro, si mostra il pericolo con le azioni immediate.
test("il gas incerto resta pericolo: prima la sicurezza", () => {
  const incerto = applyRules({ ...SAMPLE_CASES.gas, confidence: 0.4 });
  assert.equal(incerto.esito, "pericolo");
  assert.equal(incerto.payload.fai_da_te, null);
  assert.equal(incerto.payload.pericolo, "gas");
  assert.ok(incerto.payload.azioni.length >= 3);
});

test("caldaia e tetto vanno al professionista", () => {
  const caldaia = applyRules({
    ...SAMPLE_CASES.sifone,
    skillSlug: "idraulico",
    titolo: "Caldaia spenta",
    vistoSentito: "La caldaia non parte.",
    summary: "La caldaia non parte.",
    passi: ["Premi il tasto.", "Aspetta.", "Riprova."],
    difficolta: "facile",
  });
  assert.equal(caldaia.esito, "professionista");
  assert.ok(caldaia.payload.motivo_professionista.length > 0);
  const tetto = applyRules({
    ...SAMPLE_CASES.sifone,
    skillSlug: "lattoniere",
    skillLabel: "Lattoniere",
    titolo: "Grondaia",
    vistoSentito: "La grondaia sul tetto è piena.",
    summary: "La grondaia sul tetto è piena.",
    passi: [],
    difficolta: null,
  });
  assert.equal(tetto.esito, "professionista");
});

function caso(over: Partial<ModelDraft>): ModelDraft {
  return {
    ...SAMPLE_CASES.sifone,
    titolo: "",
    vistoSentito: "",
    summary: "",
    primaCosa: "",
    motivoProfessionista: "",
    passi: [],
    attrezzi: [],
    difficolta: null,
    esitoModello: null,
    diyPossibile: null,
    ...over,
  };
}

const TRE_PASSI = ["Chiudi la valvola.", "Stringi il raccordo con la chiave.", "Riapri piano."];

test("raccordo del gas allentato: mai fai da te", () => {
  const senzaOdore = applyRules(
    caso({
      titolo: "Raccordo del gas allentato",
      vistoSentito: "Vedo il raccordo del gas dietro il piano cottura un po' allentato.",
      summary: "Raccordo del gas allentato.",
      passi: TRE_PASSI,
      difficolta: "facile",
      esitoModello: "fai_da_te",
      diyPossibile: true,
    }),
  );
  assert.notEqual(senzaOdore.esito, "fai_da_te");
  assert.equal(senzaOdore.esito, "professionista");
  assert.equal(senzaOdore.payload.fai_da_te, null);

  const conOdore = applyRules(
    caso({
      titolo: "Raccordo del gas allentato",
      vistoSentito: "Il raccordo del gas è allentato. Sento odore e un sibilo.",
      summary: "Raccordo del gas allentato.",
      passi: TRE_PASSI,
      difficolta: "facile",
      esitoModello: "fai_da_te",
      diyPossibile: true,
    }),
  );
  assert.equal(conOdore.esito, "pericolo");
  assert.equal(conOdore.payload.pericolo, "gas");
  assert.equal(conOdore.payload.fai_da_te, null);
});

test("odore di bruciato dalla presa: pericolo", () => {
  const ruled = applyRules(
    caso({
      skillSlug: "elettricista",
      titolo: "Presa che scalda",
      vistoSentito: "Sento odore di bruciato dalla presa della cucina.",
      summary: "Odore di bruciato dalla presa.",
      passi: TRE_PASSI,
      difficolta: "facile",
    }),
  );
  assert.equal(ruled.esito, "pericolo");
  assert.equal(ruled.payload.pericolo, "elettrico");
  assert.equal(ruled.payload.fai_da_te, null);
});

test("salvavita che salta: professionista", () => {
  const ruled = applyRules(
    caso({
      skillSlug: "elettricista",
      titolo: "Salvavita che salta",
      vistoSentito: "Il salvavita salta quando accendo il forno.",
      summary: "Il salvavita salta.",
      passi: ["Spegni tutto.", "Riarma il salvavita.", "Riaccendi una cosa alla volta."],
      difficolta: "facile",
      esitoModello: "fai_da_te",
      diyPossibile: true,
    }),
  );
  assert.equal(ruled.esito, "professionista");
});

test("pulire la grondaia con la scala: professionista", () => {
  const ruled = applyRules(
    caso({
      skillSlug: "lattoniere",
      titolo: "Grondaia piena di foglie",
      vistoSentito: "La grondaia è piena di foglie.",
      summary: "Pulire la grondaia con la scala.",
      passi: ["Appoggia la scala al muro.", "Togli le foglie.", "Sciacqua con acqua."],
      difficolta: "facile",
      esitoModello: "fai_da_te",
      diyPossibile: true,
    }),
  );
  assert.equal(ruled.esito, "professionista");
});

test("acqua vicino al sifone non è un pericolo", () => {
  const ruled = applyRules(
    caso({
      titolo: "Acqua vicino al sifone",
      vistoSentito: "Vedo acqua vicino al sifone sotto il lavandino.",
      summary: "Acqua vicino al sifone.",
    }),
  );
  assert.notEqual(ruled.esito, "pericolo");
  assert.equal(dangerOf("Acqua vicino al sifone."), null);
  assert.equal(dangerOf("Acqua vicino alla presa del bagno."), "elettrico");
  assert.equal(dangerOf("Ho cambiato la lampadina bruciata."), null);
});

test("scintille con confidenza 0,5: pericolo", () => {
  const ruled = applyRules({ ...SAMPLE_CASES.scintille, confidence: 0.5 });
  assert.equal(ruled.esito, "pericolo");
  assert.ok(ruled.payload.azioni.length >= 3);
});

test("se il modello dice pericolo, resta pericolo", () => {
  const ruled = applyRules(
    caso({
      titolo: "Tubo che perde",
      vistoSentito: "Un tubo perde sotto il lavandino.",
      summary: "Tubo che perde.",
      passi: TRE_PASSI,
      difficolta: "facile",
      esitoModello: "pericolo",
      confidence: 0.3,
    }),
  );
  assert.equal(ruled.esito, "pericolo");
  assert.equal(ruled.payload.fai_da_te, null);

  const parsed = parseDiagnosis(
    {
      in_scope: true,
      skill_slug: "idraulico",
      confidence: 0.9,
      summary: "Tubo che perde.",
      esito: "pericolo",
      titolo: "Tubo che perde",
      visto_sentito: "Un tubo perde.",
      prima_cosa: "Chiudi l'acqua generale.",
      motivo_professionista: "",
      fai_da_te: { possibile: true, tempo_minuti: 10, difficolta: "facile", attrezzi: [], passi: TRE_PASSI },
    },
    "prova",
  );
  assert.equal(parsed.esitoModello, "pericolo");
  assert.equal(parsed.diyPossibile, true);
  assert.equal(applyRules(parsed).esito, "pericolo");
});

test("professionista o possibile=false non diventano mai fai da te", () => {
  const prof = applyRules(
    caso({
      titolo: "Rubinetto che gocciola",
      vistoSentito: "Il rubinetto gocciola.",
      summary: "Rubinetto che gocciola.",
      passi: TRE_PASSI,
      difficolta: "facile",
      esitoModello: "professionista",
    }),
  );
  assert.equal(prof.esito, "professionista");
  const noDiy = applyRules(
    caso({
      titolo: "Perde il sifone",
      vistoSentito: "Perde il sifone sotto il lavandino.",
      summary: "Perde il sifone.",
      passi: TRE_PASSI,
      difficolta: "facile",
      esitoModello: "fai_da_te",
      diyPossibile: false,
    }),
  );
  assert.equal(noDiy.esito, "professionista");
});
