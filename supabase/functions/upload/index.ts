import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "METHOD_NOT_ALLOWED", message: "Method not allowed" }, 405)
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
      return jsonResponse({ error: "SERVER_MISCONFIGURED", message: "Server misconfigured" }, 500)
    }

    const supabase = createClient(
      "https://nyvwcggocbplisszqaju.supabase.co",
      serviceRoleKey
    )

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return jsonResponse({ error: "NO_FILE", message: "No file uploaded" }, 400)
    }

    const uploadForm = new FormData()
    uploadForm.append("file", file, file.name)

    const response = await fetch(
      "https://zerostorage.net/api/upload/universal",
      {
        method: "POST",
        body: uploadForm
      }
    )

    if (!response.ok) {
      const responseText = await response.text()
      console.error("ZeroStorage HTTP error:", response.status, responseText)
      return jsonResponse({
        error: "ZEROSTORAGE_UPLOAD_FAILED",
        message: "ZeroStorage upload failed",
        details: responseText
      }, 500)
    }

    const data = await response.json()
    console.log("ZeroStorage response:", data)

    const fileUrl =
      data?.files?.[0]?.url ||
      data?.files?.[0]?.link ||
      data?.viewUrl ||
      data?.url ||
      data?.file ||
      data?.link

    if (!fileUrl) {
      console.error("No file URL returned")
      return jsonResponse({
        error: "NO_FILE_URL",
        message: "Upload failed",
        details: "No file URL returned by ZeroStorage"
      }, 500)
    }

    const id = crypto.randomUUID().slice(0, 6)

    const { data: inserted, error } = await supabase
      .from("files")
      .insert({ id, url: fileUrl })

    console.log("Inserted:", inserted)

    if (error) {
      console.error("Supabase error:", error)
      return jsonResponse({
        error: "DATABASE_INSERT_FAILED",
        message: "Database insert failed",
        details: error.message
      }, 500)
    }

    return jsonResponse({
      url: `https://bonkdrop.fr/f/${id}`
    })
  } catch (error) {
    console.error("Unhandled upload function error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return jsonResponse({
      error: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      details: message
    }, 500)
  }

})