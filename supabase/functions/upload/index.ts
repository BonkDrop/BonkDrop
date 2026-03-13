import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, apikey, Content-Type",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

serve(async (req: Request) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return jsonResponse({ error: "Invalid form data" }, 400)
  }

  const file = formData.get("file") as File | null

  if (!file) {
    return jsonResponse({ error: "No file uploaded" }, 400)
  }

  const uploadForm = new FormData()
  uploadForm.append("file", file, file.name)

  // upload vers ZeroStorage avec timeout de 15s
  let zeroResponse: Response
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    zeroResponse = await fetch(
      "https://upload.zerostorage.net/api/upload/universal",
      {
        method: "POST",
        body: uploadForm,
        signal: controller.signal,
      }
    )
    clearTimeout(timer)
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError"
    return jsonResponse(
      { error: isTimeout ? "ZeroStorage timeout" : "ZeroStorage unreachable" },
      504
    )
  }

  if (!zeroResponse.ok) {
    return jsonResponse(
      { error: `ZeroStorage error: ${zeroResponse.status}` },
      502
    )
  }

  let data: { file?: string }
  try {
    data = await zeroResponse.json()
  } catch {
    return jsonResponse({ error: "Invalid response from ZeroStorage" }, 502)
  }

  if (!data.file) {
    return jsonResponse({ error: "ZeroStorage returned no file URL" }, 502)
  }

  // génération ID court
  const id = crypto.randomUUID().slice(0, 6)

  // sauvegarde dans la DB
  const { error: dbError } = await supabase
    .from("files")
    .insert({ id, url: data.file })

  if (dbError) {
    return jsonResponse({ error: `Database error: ${dbError.message}` }, 500)
  }

  // lien BonkDrop
  return jsonResponse({ url: `https://bonkdrop.com/f/${id}` })

})