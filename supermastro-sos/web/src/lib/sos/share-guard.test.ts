import assert from "node:assert/strict";
import test from "node:test";
import { signLead, verifyLead, withLeadTokens } from "@/lib/sos/lead-token";
import { normalizePhone, toE164 } from "@/lib/sos/share-copy";
import { osmRefOf } from "@/lib/sos/search-artisans";

process.env.SOS_SHARE_SECRET = "segreto-di-prova-lungo-abbastanza";

const claim = {
  fonte: "osm" as const,
  fonteId: "node/123456",
  nome: "Idraulica Rossi",
  telefono: "06 1234567",
  indirizzo: "Via Roma 1, Roma",
  lat: 41.9,
  lng: 12.5,
  mestiere: "Idraulico",
};

test("il gettone firmato torna uguale e non si può modificare", () => {
  const token = signLead(claim);
  assert.ok(token);
  assert.deepEqual(verifyLead(token), claim);

  const [body, mac] = token.split(".");
  const packed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  packed.p = "+393330000000";
  const forged = `${Buffer.from(JSON.stringify(packed)).toString("base64url")}.${mac}`;
  assert.equal(verifyLead(forged), null);
  assert.equal(verifyLead(`${body}.x${mac.slice(1)}`), null);
  assert.equal(verifyLead("niente"), null);
});

test("il gettone scade e richiede un id OSM", () => {
  const old = signLead(claim, Date.now() - 2 * 24 * 60 * 60 * 1000);
  assert.ok(old);
  assert.equal(verifyLead(old), null);
  assert.equal(signLead({ ...claim, fonteId: "123456" }), null);
  const listed = withLeadTokens(
    [{ osmRef: null, name: "Senza id", phone: null, address: "", lat: 1, lng: 1 }],
    "Idraulico",
  );
  assert.equal(listed[0]?.leadToken, null);
});

test("osmRefOf usa tipo e id OSM, non place_id", () => {
  assert.equal(osmRefOf({ osm_type: "node", osm_id: 42 }), "node/42");
  assert.equal(osmRefOf({ osm_type: "W", osm_id: "7" }), "way/7");
  assert.equal(osmRefOf({ osm_type: "", osm_id: 1 }), null);
});

test("numeri normalizzati: i fissi tengono lo 0", () => {
  assert.equal(toE164("333 123 4567"), "+393331234567");
  assert.equal(toE164("+39 333 1234567"), "+393331234567");
  assert.equal(toE164("0039 06 1234567"), "+39061234567");
  assert.equal(toE164("06 1234567"), "+39061234567");
  assert.equal(toE164("39 06 1234567"), "+39061234567");
  assert.equal(toE164("abc"), "");
  assert.equal(normalizePhone("06-1234567"), normalizePhone("+39 06 1234567"));
});

test("gettone della rete: id worker valido, niente telefono nel gettone", () => {
  const rete = {
    ...claim,
    fonte: "rete" as const,
    fonteId: "rete/3f2b8c1e-1d2a-4b5c-9e8f-0a1b2c3d4e5f",
    telefono: null,
  };
  const token = signLead(rete);
  assert.ok(token);
  const back = verifyLead(token!);
  assert.equal(back?.fonte, "rete");
  assert.equal(back?.telefono, null);
  assert.equal(signLead({ ...rete, fonteId: "rete/non-un-id" }), null);
  assert.equal(signLead({ ...rete, fonteId: "node/123" }), null);
});
