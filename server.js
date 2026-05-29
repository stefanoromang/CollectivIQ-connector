const token = "ciq_live_gpmadb2w9Sy8dymaQkTlUQzRufiYTvH0E7emhFrSR8RA";

async function askCIQ(question) {
  const form = new URLSearchParams();
  form.append("prompt", question);
  form.append("generate_combined", "true");

  const res = await fetch("https://api.prod.collectiviq.ai/process_message", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form
  });

  const data = await res.text();
  return data || "No response from Collective IQ";
}

export default { askCIQ };
