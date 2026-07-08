var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
var SETTINGS_PATH = import_path.default.join(process.cwd(), "app-settings.json");
var LOGO_DIR = import_path.default.join(process.cwd(), "logo");
var LOGO2_DIR = import_path.default.join(process.cwd(), "logo2");
var ALARMES_DIR = import_path.default.join(process.cwd(), "alarmes");
if (!import_fs.default.existsSync(LOGO_DIR)) {
  import_fs.default.mkdirSync(LOGO_DIR, { recursive: true });
}
if (!import_fs.default.existsSync(LOGO2_DIR)) {
  import_fs.default.mkdirSync(LOGO2_DIR, { recursive: true });
}
if (!import_fs.default.existsSync(ALARMES_DIR)) {
  import_fs.default.mkdirSync(ALARMES_DIR, { recursive: true });
}
var defaultSettings = {
  appName: "TeamGorilas BJJ",
  accentColor: "amber",
  usingCustomLogo: false
};
function readSettings() {
  try {
    if (import_fs.default.existsSync(SETTINGS_PATH)) {
      const data = import_fs.default.readFileSync(SETTINGS_PATH, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Erro ao ler configura\xE7\xF5es:", error);
  }
  return defaultSettings;
}
function writeSettings(settings) {
  try {
    import_fs.default.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
  } catch (error) {
    console.error("Erro ao escrever configura\xE7\xF5es:", error);
  }
}
app.use("/logo", import_express.default.static(LOGO_DIR));
app.use("/logo2", import_express.default.static(LOGO2_DIR));
app.use("/alarmes", import_express.default.static(ALARMES_DIR));
app.post("/api/send-email", async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Campos obrigat\xF3rios ausentes: to, subject, body" });
  }
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || apiKey === "MY_SENDGRID_API_KEY" || apiKey.trim() === "" || !fromEmail || fromEmail.trim() === "") {
    console.log(`[SIMULA\xC7\xC3O SENDGRID] Nenhuma chave configurada ou e-mail remetente ausente. Simulando envio para: ${to}`);
    return res.json({
      success: true,
      simulated: true,
      message: "Envio de e-mail simulado com sucesso (sem chaves configuradas)!"
    });
  }
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to.trim() }],
            subject
          }
        ],
        from: {
          email: fromEmail.trim(),
          name: "Dojo TeamGorilas \u{1F94B}"
        },
        content: [
          {
            type: "text/html",
            value: body
          }
        ]
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro na resposta da API do SendGrid:", errText);
      let detailedMessage = response.statusText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.errors?.[0]?.message) {
          detailedMessage = parsed.errors[0].message;
        }
      } catch (e) {
      }
      return res.status(response.status).json({ error: `Erro no SendGrid: ${detailedMessage}` });
    }
    console.log(`[SENDGRID SUCESSO] E-mail enviado com sucesso via API para: ${to.trim()}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("Erro ao enviar e-mail via SendGrid:", err);
    return res.status(500).json({ error: err.message || "Erro interno ao enviar e-mail" });
  }
});
app.post("/api/send-push", async (req, res) => {
  const { usernames, title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Campos obrigat\xF3rios ausentes: title, body" });
  }
  const appId = process.env.VITE_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !restApiKey || restApiKey.trim() === "" || restApiKey === "MY_ONESIGNAL_REST_API_KEY") {
    console.log(`[SIMULA\xC7\xC3O ONESIGNAL] Nenhuma chave configurada. Simulando envio para: ${usernames ? usernames.join(", ") : "Todos"}`);
    return res.json({
      success: true,
      simulated: true,
      message: "Envio de notifica\xE7\xE3o push simulado com sucesso (sem chaves configuradas)!"
    });
  }
  try {
    const payload = {
      app_id: appId,
      headings: { en: title, pt: title },
      contents: { en: body, pt: body }
    };
    if (usernames && Array.isArray(usernames) && usernames.length > 0 && !usernames.includes("all")) {
      payload.include_external_user_ids = usernames;
    } else {
      payload.included_segments = ["Subscribed Users"];
    }
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${restApiKey.trim()}`,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Erro na resposta da API do OneSignal:", errText);
      return res.status(response.status).json({ error: `Erro no OneSignal: ${errText}` });
    }
    const data = await response.json();
    console.log("[ONESIGNAL SUCESSO] Notifica\xE7\xE3o enviada:", data);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Erro ao enviar push via OneSignal:", err);
    return res.status(500).json({ error: err.message || "Erro interno ao enviar push" });
  }
});
app.get("/api/app-settings", (req, res) => {
  const settings = readSettings();
  const customLogoExists = import_fs.default.existsSync(import_path.default.join(LOGO2_DIR, "logo.png"));
  res.json({
    ...settings,
    usingCustomLogo: customLogoExists
  });
});
app.post("/api/app-settings", (req, res) => {
  const { appName, accentColor } = req.body;
  const current = readSettings();
  if (appName !== void 0) current.appName = appName;
  if (accentColor !== void 0) current.accentColor = accentColor;
  writeSettings(current);
  res.json({ success: true, settings: current });
});
app.post("/api/upload-logo", (req, res) => {
  try {
    const { logoBase64 } = req.body;
    if (!logoBase64) {
      return res.status(400).json({ error: "Nenhum logo fornecido." });
    }
    const matches = logoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(logoBase64, "base64");
    }
    const logoPath = import_path.default.join(LOGO2_DIR, "logo.png");
    import_fs.default.writeFileSync(logoPath, buffer);
    const current = readSettings();
    current.usingCustomLogo = true;
    writeSettings(current);
    res.json({ success: true, settings: current });
  } catch (error) {
    console.error("Erro no upload de logo:", error);
    res.status(500).json({ error: "Falha ao salvar imagem do logo." });
  }
});
app.post("/api/restore-logo", (req, res) => {
  try {
    const logoPath = import_path.default.join(LOGO2_DIR, "logo.png");
    if (import_fs.default.existsSync(logoPath)) {
      import_fs.default.unlinkSync(logoPath);
    }
    const current = readSettings();
    current.usingCustomLogo = false;
    writeSettings(current);
    res.json({ success: true, settings: current });
  } catch (error) {
    console.error("Erro ao restaurar logo padr\xE3o:", error);
    res.status(500).json({ error: "Falha ao restaurar logo padr\xE3o." });
  }
});
app.get("/api/app-logo", (req, res) => {
  try {
    const customLogoPath = import_path.default.join(LOGO2_DIR, "logo.png");
    const defaultLogoPath = import_path.default.join(LOGO_DIR, "logo.png");
    if (import_fs.default.existsSync(customLogoPath)) {
      return res.sendFile(customLogoPath);
    } else if (import_fs.default.existsSync(defaultLogoPath)) {
      return res.sendFile(defaultLogoPath);
    } else {
      return res.status(404).send("Logo n\xE3o encontrado");
    }
  } catch (error) {
    console.error("Erro ao servir logo:", error);
    res.status(500).send("Erro interno ao servir logo");
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
