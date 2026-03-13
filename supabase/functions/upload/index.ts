// @ts-ignore: Resolved by Deno runtime and Deno language server.
import { serve } from "@std/http"

serve(async (req: Request) => {

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!file) {
    return new Response("No file uploaded", { status: 400 })
  }

  const uploadForm = new FormData()
  uploadForm.append("file", file)

  const response = await fetch("https://upload.zerostorage.net/api/upload/universal", {
    method: "POST",
    body: uploadForm
  })

  const data = await response.json()

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  })

})
