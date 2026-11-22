import React, { useContext, useEffect, useState } from "react";
import { Button, Upload, message, notification } from "antd";
import { BgColorsOutlined, CheckOutlined, PictureOutlined, UndoOutlined, UploadOutlined } from "@ant-design/icons";
import { UserContext } from "context/UserContext";
import { useCompany } from "context/CompanyContext";
import { adjustColor } from "helpers/theme";
import { getCompanySetup, updateSetup, uploadCompanyLogo } from "helpers/api-integrator";
import defaultLogo from "assets/img/logo.png";
import "components/simple/simple.css";

const CORES = [
  ["#667eea", "Lilás"],
  ["#7c3aed", "Roxo"],
  ["#c026d3", "Magenta"],
  ["#db2777", "Rosa"],
  ["#dc2626", "Vermelho"],
  ["#ea580c", "Laranja"],
  ["#ca8a04", "Mostarda"],
  ["#16a34a", "Verde"],
  ["#0d9488", "Verde-água"],
  ["#2563eb", "Azul"],
  ["#1e3a8a", "Azul-marinho"],
  ["#374151", "Grafite"],
];

const sameColor = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

const Preview = ({ color, logo, name }) => (
  <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", border: "1px solid #e7e5e4", height: 230, background: "#f6f5f4" }}>
    <div
      style={{
        width: "38%",
        minWidth: 110,
        background: `linear-gradient(160deg, ${color}, ${adjustColor(color, -40)})`,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <img
        src={logo || defaultLogo}
        alt="Logo"
        onError={(e) => (e.target.src = defaultLogo)}
        style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 10, background: "#fff", padding: 4, marginBottom: 6 }}
      />
      {["Caixa", "Faturamento", "Despesas", "Produtos"].map((item, i) => (
        <div
          key={item}
          style={{
            width: "100%",
            padding: "5px 8px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            color: "#fff",
            background: i === 1 ? "rgba(255,255,255,0.25)" : "transparent",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {item}
        </div>
      ))}
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ background: color, color: "#fff", padding: "10px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {name || "Minha loja"} › Faturamento
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})`, color: "#fff", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, opacity: 0.85 }}>Vendido hoje</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>R$ 523,09</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 8, height: 26, border: "1px solid #e7e5e4" }} />
        <div style={{ alignSelf: "flex-start", background: color, color: "#fff", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600 }}>
          Botão principal
        </div>
      </div>
    </div>
  </div>
);

export default function IdentidadeVisual() {
  const { user } = useContext(UserContext);
  const { companySetup, updateCompanySetup, refreshSetup } = useCompany();
  const companyId = companySetup?.companyId || user?.user?.companyId;
  const savedColor = companySetup?.sidebarColor || "#667eea";
  const [color, setColor] = useState(savedColor);
  const [logo, setLogo] = useState(companySetup?.logoUrl || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setColor(savedColor), [savedColor]);
  useEffect(() => setLogo(companySetup?.logoUrl || null), [companySetup?.logoUrl]);

  const dirty = !sameColor(color, savedColor);

  const saveColor = async () => {
    setSaving(true);
    try {
      const latest = (await getCompanySetup(companyId))?.data?.[0] || companySetup;
      const result = await updateSetup({ ...latest, companyId: latest.companyId || companyId, sidebarColor: color });
      if (!result?.success) throw new Error("setup");
      updateCompanySetup({ sidebarColor: color });
      notification.success({ message: "Cor salva!", description: "O sistema já está com a nova cor." });
    } catch (error) {
      notification.error({ message: "Não foi possível salvar a cor", description: "Tente de novo em instantes." });
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Escolha um arquivo de imagem (foto ou PNG).");
      return false;
    }
    if (file.size / 1024 / 1024 >= 2) {
      message.error("A imagem é muito grande. Use uma com menos de 2 MB.");
      return false;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      setLogo(e.target.result);
      setUploading(true);
      try {
        const result = await uploadCompanyLogo(companyId, e.target.result);
        if (!result.success) throw new Error(result.message);
        setLogo(result.data.logoUrl);
        updateCompanySetup({ logoUrl: result.data.logoUrl });
        refreshSetup();
        notification.success({ message: "Logo atualizada!", description: "Ela já aparece no menu do sistema." });
      } catch (error) {
        setLogo(companySetup?.logoUrl || null);
        notification.error({ message: "Não foi possível enviar a logo", description: error.message || "Tente outra imagem." });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div style={{ "--sp-primary": color }}>
      <div className="sp-grid-2" style={{ alignItems: "start" }}>
        <div className="sp-stack">
          <div className="sp-card">
            <h3 className="sp-card-title">
              <PictureOutlined /> Logo da loja
            </h3>
            <p className="sp-card-sub">Aparece no topo do menu do sistema. Pode ser uma foto ou o desenho da sua marca.</p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 16,
                  border: "2px dashed #d6d3d1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "#fafaf9",
                  flexShrink: 0,
                }}
              >
                <img src={logo || defaultLogo} alt="Logo" onError={(e) => (e.target.src = defaultLogo)} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <Upload beforeUpload={uploadLogo} showUploadList={false} accept="image/*">
                  <Button type="primary" size="large" icon={<UploadOutlined />} loading={uploading}>
                    {logo ? "Trocar logo" : "Enviar logo"}
                  </Button>
                </Upload>
                <div style={{ fontSize: 12, color: "#78716c", marginTop: 8 }}>
                  Salva na hora. Funciona melhor com imagem quadrada, até 2 MB.
                </div>
              </div>
            </div>
          </div>

          <div className="sp-card">
            <h3 className="sp-card-title">
              <BgColorsOutlined /> Cor do sistema
            </h3>
            <p className="sp-card-sub">Toque numa cor para ver como fica. Ela pinta o menu, os botões e o topo das telas.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 10 }}>
              {CORES.map(([hex, nome]) => {
                const active = sameColor(hex, color);
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    aria-pressed={active}
                    style={{ border: 0, background: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: hex,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        boxShadow: active ? `0 0 0 3px #fff, 0 0 0 5px ${hex}` : "none",
                      }}
                    >
                      {active && <CheckOutlined />}
                    </span>
                    <span style={{ fontSize: 11, color: active ? "#1c1917" : "#78716c", fontWeight: active ? 600 : 400 }}>{nome}</span>
                  </button>
                );
              })}
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "conic-gradient(#ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)",
                    position: "relative",
                    boxShadow: CORES.some(([hex]) => sameColor(hex, color)) ? "none" : `0 0 0 3px #fff, 0 0 0 5px ${color}`,
                  }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                  />
                </span>
                <span style={{ fontSize: 11, color: "#78716c" }}>Outra cor</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sp-card" style={{ position: "sticky", top: 16 }}>
          <h3 className="sp-card-title">Como vai ficar</h3>
          <p className="sp-card-sub">{dirty ? "Esta é só uma prévia. Toque em “Salvar cor” para aplicar." : "Esta é a aparência atual do seu sistema."}</p>
          <Preview color={color} logo={logo} name={companySetup?.companyName} />
          {dirty && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <Button type="primary" size="large" icon={<CheckOutlined />} loading={saving} onClick={saveColor} style={{ flex: "1 1 160px" }}>
                Salvar cor
              </Button>
              <Button size="large" icon={<UndoOutlined />} onClick={() => setColor(savedColor)} style={{ flex: "1 1 120px" }}>
                Voltar à atual
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
