const express = require("express")
const axios = require("axios")

const app = express()

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI

app.get("/", (req, res) => {
  res.send("Auth Discord funcionando.")
})

app.get("/auth/discord", (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(500).send(
      `Configuração faltando.\nCLIENT_ID: ${CLIENT_ID ? "OK" : "MISSING"}\nCLIENT_SECRET: ${CLIENT_SECRET ? "OK" : "MISSING"}\nREDIRECT_URI: ${REDIRECT_URI ? "OK" : "MISSING"}`
    )
  }

  const url =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20email`

  res.redirect(url)
})

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code

  if (!code) {
    return res.status(400).send("Código não enviado.")
  }

  try {
    const params = new URLSearchParams()
    params.append("client_id", CLIENT_ID)
    params.append("client_secret", CLIENT_SECRET)
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", REDIRECT_URI)

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )

    const accessToken = tokenResponse.data.access_token

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const user = userResponse.data

    return res.send(`Verificação concluída com sucesso: ${user.username} (${user.id})`)
  } catch (err) {
    const details = err.response?.data || err.message || "Erro desconhecido"
    console.log("ERRO OAUTH:", details)
    return res.status(500).send(`Erro na verificação: ${JSON.stringify(details)}`)
  }
})

const PORT = process.env.PORT || 10000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor auth rodando na porta ${PORT}`)
})
