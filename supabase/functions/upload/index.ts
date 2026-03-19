import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  })
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

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
      url: `https://bonkdrop.github.io/BonkDrop/download.html?id=${id}`
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

<script>
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    fetch("https://nyvwcggocbplisszqaju.supabase.co/rest/v1/files?id=eq." + id, {
      headers: {
        "apikey": "TON_ANON_KEY",
        "Authorization": "Bearer TON_ANON_KEY"
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const fileUrl = data[0].url;

        document.getElementById("status").textContent = "File ready";

        const btn = document.getElementById("downloadBtn");

        // 👉 important
        btn.href = fileUrl;
        btn.setAttribute("download", ""); // force téléchargement
        btn.target = "_blank"; // évite de quitter la page

        btn.style.display = "block";

      } else {
        window.location.replace("/BonkDrop/liencasse.html");
      }
    })
    .catch(() => {
      window.location.replace("/BonkDrop/liencasse.html");
    });

  } else {
    window.location.replace("/BonkDrop/liencasse.html");
  }
</script>