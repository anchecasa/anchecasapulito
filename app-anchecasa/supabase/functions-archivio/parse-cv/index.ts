import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "npm:unpdf@0.11.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseJobPayload {
  jobId?: string;
  documentId?: string;
  candidateId?: string;
  filePath?: string;
  mimeType?: string;
}

interface ParsedCV {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  postalCode?: string | null;
  experiences?: Array<{ jobLabel: string; companyName?: string }>;
  skills?: string[];
  confidence: number;
  source?: string;
  profileHtml?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCvProfileHtml(parsed: ParsedCV, rawText?: string | null): string {
  const fullName = [parsed.firstName, parsed.lastName].filter(Boolean).join(" ").trim() || "Candidato";
  const experiences =
    parsed.experiences?.length
      ? `<ul class="cv-profile__list">${parsed.experiences
          .map((exp) => {
            const company = exp.companyName ? ` — ${escapeHtml(exp.companyName)}` : "";
            return `<li><strong>${escapeHtml(exp.jobLabel)}</strong>${company}</li>`;
          })
          .join("")}</ul>`
      : `<p class="cv-profile__muted">Nessuna esperienza estratta</p>`;
  const skills =
    parsed.skills?.length
      ? `<ul class="cv-profile__tags">${parsed.skills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
      : `<p class="cv-profile__muted">Nessuna competenza estratta</p>`;
  const rawSection =
    rawText && rawText.length > 40 && !rawText.startsWith("[image:")
      ? `<section class="cv-profile__section"><h3>Testo originale CV</h3><pre class="cv-profile__raw">${escapeHtml(rawText.slice(0, 8000))}</pre></section>`
      : "";
  const confidence =
    typeof parsed.confidence === "number"
      ? `<p class="cv-profile__meta">Affidabilità estrazione: ${Math.round(parsed.confidence * 100)}%</p>`
      : "";
  const field = (label: string, value?: string | null) =>
    value?.trim() ? `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value.trim())}</td></tr>` : "";

  return `<article class="cv-profile"><header class="cv-profile__header"><h2 class="cv-profile__name">${escapeHtml(fullName)}</h2>${confidence}</header><section class="cv-profile__section"><h3>Contatti</h3><table class="cv-profile__table"><tbody>${field("Email", parsed.email)}${field("Telefono", parsed.phone)}${field("Città", parsed.city)}${field("CAP", parsed.postalCode)}</tbody></table></section><section class="cv-profile__section"><h3>Esperienze</h3>${experiences}</section><section class="cv-profile__section"><h3>Competenze</h3>${skills}</section>${rawSection}</article>`;
}

function mapCandidateFallback(row?: Record<string, string | null>): Record<string, string | null> | undefined {
  if (!row) return undefined;
  return {
    firstName: row.first_name ?? row.firstName ?? null,
    lastName: row.last_name ?? row.lastName ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    city: row.city ?? null,
    postalCode: row.postal_code ?? row.postalCode ?? null,
  };
}

const CV_JSON_SCHEMA = {
  name: "parsed_cv",
  schema: {
    type: "object",
    properties: {
      firstName: { type: ["string", "null"] },
      lastName: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      phone: { type: ["string", "null"] },
      city: { type: ["string", "null"] },
      postalCode: { type: ["string", "null"] },
      experiences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            jobLabel: { type: "string" },
            companyName: { type: ["string", "null"] },
          },
          required: ["jobLabel"],
        },
      },
      skills: { type: "array", items: { type: "string" } },
      confidence: { type: "number" },
    },
    required: ["experiences", "skills", "confidence"],
  },
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isImageFile(mimeType?: string, filePath?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  const ext = filePath?.split(".").pop()?.toLowerCase();
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
}

function imageMimeForDataUrl(mimeType?: string, filePath?: string): string {
  if (mimeType?.startsWith("image/")) return mimeType;
  const ext = filePath?.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function downloadFileBuffer(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from("candidate-cvs").download(filePath);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function extractFileText(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  mimeType?: string,
): Promise<string> {
  const buffer = await downloadFileBuffer(supabase, filePath);
  const isPdf = mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
    if (joined.trim().length > 20) return joined;
  }

  if (isImageFile(mimeType, filePath)) {
    return "";
  }

  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  return decoded.slice(0, 12000);
}

async function parseViaWorker(
  workerUrl: string,
  payload: Record<string, unknown>,
): Promise<ParsedCV | null> {
  const workerResponse = await fetch(workerUrl.replace(/\/$/, ""), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!workerResponse.ok) return null;
  const workerResult = await workerResponse.json();
  return (workerResult?.parsedData as ParsedCV | undefined) ?? null;
}

async function parseImageWithOpenAI(
  buffer: Uint8Array,
  mimeType: string,
  apiKey: string,
  candidateFallback?: Record<string, string | null>,
): Promise<ParsedCV> {
  const b64 = bytesToBase64(buffer);
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_schema", json_schema: CV_JSON_SCHEMA },
      messages: [
        {
          role: "system",
          content:
            "Sei un parser CV per HR italiano. Leggi il documento (foto o scan del CV) e estrai dati strutturati. " +
            "city e postalCode devono essere validi per l'Italia. confidence 0-1.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Estrai i dati dal CV in immagine." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI vision error: ${response.status} ${await response.text()}`);
  }

  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  const parsed = JSON.parse(json.choices[0].message.content) as ParsedCV;
  return {
    ...parsed,
    firstName: parsed.firstName ?? candidateFallback?.firstName ?? null,
    lastName: parsed.lastName ?? candidateFallback?.lastName ?? null,
    email: parsed.email ?? candidateFallback?.email ?? null,
    source: "openai_vision_gpt4o_mini",
  };
}

async function parseWithOpenAI(rawText: string, apiKey: string): Promise<ParsedCV> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_schema", json_schema: CV_JSON_SCHEMA },
      messages: [
        {
          role: "system",
          content:
            "Sei un parser CV per HR italiano. Estrai dati strutturati. " +
            "city e postalCode devono essere validi per l'Italia. confidence 0-1.",
        },
        { role: "user", content: rawText.slice(0, 12000) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);
  }

  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  const parsed = JSON.parse(json.choices[0].message.content) as ParsedCV;
  return { ...parsed, source: "openai_gpt4o_mini" };
}

function heuristicParse(rawText: string, candidateFallback?: Record<string, string | null>): ParsedCV {
  const emailMatch = rawText.match(/[\w.+-]+@[\w.-]+\.\w+/);
  const phoneMatch = rawText.match(/(?:\+39\s?)?(?:3\d{2}|\d{2,4})[\s.-]?\d{5,8}/);
  const capMatch = rawText.match(/\b(\d{5})\b/);
  const jobMatch = rawText.match(/operaio|muratore|elettricist[aio]|idraulic[oao]|carpentiere|magazziniere/i);

  return {
    firstName: candidateFallback?.firstName ?? null,
    lastName: candidateFallback?.lastName ?? null,
    email: emailMatch?.[0] ?? candidateFallback?.email ?? null,
    phone: phoneMatch?.[0] ?? candidateFallback?.phone ?? null,
    city: candidateFallback?.city ?? null,
    postalCode: capMatch?.[1] ?? candidateFallback?.postalCode ?? null,
    experiences: jobMatch
      ? [{ jobLabel: jobMatch[0].charAt(0).toUpperCase() + jobMatch[0].slice(1).toLowerCase(), companyName: "CV" }]
      : [{ jobLabel: "Operaio Edile", companyName: "CV" }],
    skills: ["teamwork", "puntualita"],
    confidence: rawText.length > 100 ? 0.55 : 0.35,
    source: "heuristic_text",
  };
}

async function markProcessing(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  documentId: string,
  candidateId: string,
) {
  const { data: jobRow } = await supabase.from("cv_parse_jobs").select("attempts").eq("id", jobId).single();
  const attempts = ((jobRow as { attempts?: number } | null)?.attempts ?? 0) + 1;

  await supabase.from("cv_parse_jobs").update({
    status: "processing",
    started_at: new Date().toISOString(),
    attempts,
  }).eq("id", jobId);
  await supabase.from("candidate_documents").update({ parse_status: "processing" }).eq("id", documentId);
  await supabase.from("candidates").update({ ingestion_status: "parsing" }).eq("id", candidateId);
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  documentId: string,
  candidateId: string,
  message: string,
) {
  await supabase.from("cv_parse_jobs").update({
    status: "failed",
    error_message: message,
    completed_at: new Date().toISOString(),
  }).eq("id", jobId);
  await supabase.from("candidate_documents").update({ parse_status: "failed" }).eq("id", documentId);
  await supabase.from("candidates").update({ ingestion_status: "parse_failed" }).eq("id", candidateId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = (await req.json()) as ParseJobPayload;
    let jobId = body.jobId;
    let documentId = body.documentId;
    let candidateId = body.candidateId;
    let filePath = body.filePath;
    let mimeType = body.mimeType;

    if (!jobId && documentId) {
      const { data, error } = await supabase.rpc("enqueue_cv_parse", { p_document_id: documentId });
      if (error) throw error;
      jobId = (data as { job_id: string }).job_id;
      candidateId = (data as { candidate_id: string }).candidate_id;
    }

    if (!jobId) throw new Error("jobId or documentId required");

    if (!documentId || !candidateId || !filePath) {
      const { data: job } = await supabase
        .from("cv_parse_jobs")
        .select("document_id, candidate_id")
        .eq("id", jobId)
        .single();

      if (job) {
        const row = job as { document_id: string; candidate_id: string };
        documentId = documentId ?? row.document_id;
        candidateId = candidateId ?? row.candidate_id;

        const { data: doc } = await supabase
          .from("candidate_documents")
          .select("file_path, mime_type")
          .eq("id", row.document_id)
          .single();

        if (doc) {
          const d = doc as { file_path: string; mime_type: string };
          filePath = filePath ?? d.file_path;
          mimeType = mimeType ?? d.mime_type;
        }
      }
    }

    if (!documentId || !candidateId || !filePath) {
      throw new Error("Missing document/candidate/file metadata for parse job");
    }

    await markProcessing(supabase, jobId, documentId, candidateId);

    let rawText = "";
    let parsedData: ParsedCV | null = null;
    let parserSource = "local_mvp";

    const { data: candidate, error: candidateErr } = await supabase
      .from("candidates")
      .select("first_name, last_name, email, phone, city, postal_code")
      .eq("id", candidateId)
      .single();
    if (candidateErr) {
      console.warn("Candidate fetch for parse fallback:", candidateErr.message);
    }
    const candidateFallback = mapCandidateFallback(candidate as Record<string, string | null> | undefined);

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const workerUrl = Deno.env.get("CV_PARSER_WORKER_URL");

    if (filePath && isImageFile(mimeType, filePath)) {
      try {
        const buffer = await downloadFileBuffer(supabase, filePath);
        const imageMime = imageMimeForDataUrl(mimeType, filePath);
        rawText = `[image:${imageMime}]`;
        const b64 = bytesToBase64(buffer);
        const dataUrl = `data:${imageMime};base64,${b64}`;

        if (workerUrl) {
          parsedData = await parseViaWorker(workerUrl, {
            jobId,
            documentId,
            candidateId,
            filePath,
            mimeType,
            rawText,
            imageBase64: dataUrl,
            candidateFallback,
          });
          if (parsedData) parserSource = parsedData.source ?? "cloudflare_worker_vision";
        }

        if (!parsedData && openAiKey) {
          parsedData = await parseImageWithOpenAI(
            buffer,
            imageMime,
            openAiKey,
            candidateFallback,
          );
          parserSource = "openai_vision";
        }

        if (!parsedData) {
          parsedData = {
            ...heuristicParse("", candidateFallback),
            confidence: 0.4,
            source: "image_no_vision_key",
          };
          parserSource = "image_fallback";
        }
      } catch (imageErr) {
        console.warn("Image parse failed:", imageErr);
      }
    }

    if (filePath && !parsedData) {
      try {
        rawText = await extractFileText(supabase, filePath, mimeType);
      } catch (extractErr) {
        console.warn("Text extraction failed:", extractErr);
        rawText = "";
      }
    }

    if (!parsedData && workerUrl && rawText.length > 10) {
      parsedData = await parseViaWorker(workerUrl, {
        jobId,
        documentId,
        candidateId,
        filePath,
        mimeType,
        rawText,
        candidateFallback,
      });
      if (parsedData) parserSource = parsedData.source ?? "cloudflare_worker";
    }

    if (!parsedData && openAiKey && rawText.length > 20) {
      parsedData = await parseWithOpenAI(rawText, openAiKey);
      parserSource = "openai_edge";
    }

    if (!parsedData && rawText.length > 0) {
      parsedData = heuristicParse(rawText, candidateFallback);
      parserSource = "heuristic_edge";
    }

    if (parsedData) {
      parsedData.profileHtml = renderCvProfileHtml(parsedData, rawText);
      const { data, error } = await supabase.rpc("apply_cv_parse_result", {
        p_job_id: jobId,
        p_parsed: parsedData,
        p_raw_text: rawText.slice(0, 50000),
        p_parser_source: parserSource,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, jobId, parserSource, result: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: DB local MVP parser
    const { data, error } = await supabase.rpc("execute_cv_parse", { p_job_id: jobId });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, jobId, parserSource: "local_mvp", result: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
