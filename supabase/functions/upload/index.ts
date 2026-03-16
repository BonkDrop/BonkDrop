import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  "https://nyvwcggocbplisszqaju.supabase.co",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req: Request) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return new Response("No file uploaded", { status: 400 })
  }

  const uploadForm = new FormData()
  uploadForm.append("file", file, file.name)

  const response = await fetch(
    "https://upload.zerostorage.net/api/upload/universal",
    {
      method: "POST",
      body: uploadForm
    }
  )

  if (!response.ok) {
    console.error("ZeroStorage HTTP error:", response.status)
    return new Response("ZeroStorage upload failed", { status: 500 })
  }

  const data = await response.json()

  console.log("ZeroStorage response:", data)

  const fileUrl =
    data?.files?.[0]?.url ||
    data?.files?.[0]?.link ||
    data?.url ||
    data?.file ||
    data?.link

  if (!fileUrl) {
    console.error("No file URL returned")
    return new Response("Upload failed", { status: 500 })
  }

  const id = crypto.randomUUID().slice(0, 6)

  const { data: inserted, error } = await supabase
    .from("files")
    .insert({ id, url: fileUrl })

  console.log("Inserted:", inserted)

  if (error) {
    console.error("Supabase error:", error)
    return new Response("Database insert failed", { status: 500 })
  }

  return new Response(JSON.stringify({
    url: `https://bonkdrop.fr/f/${id}`
  }), {
    headers: { "Content-Type": "application/json" }
  })

})