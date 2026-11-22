import React, { forwardRef } from "react";

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

export const MODELOS = [
  { key: "simples", nome: "Simples", cor: "#1677ff", desc: "Nome em destaque e foto ao lado" },
  { key: "basico", nome: "Básico", cor: "#16a34a", desc: "Tudo centralizado, faixas coloridas" },
  { key: "tradicional", nome: "Tradicional", cor: "#d97706", desc: "Sóbrio, para empresas mais formais" },
];

const filled = (list, key) => (list || []).filter((item) => item && String(item[key] || "").trim());

const page = {
  width: A4_WIDTH,
  minHeight: A4_HEIGHT,
  padding: "48px 52px",
  background: "#fff",
  color: "#1f2937",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  boxSizing: "border-box",
};

function Heading({ modelo, children }) {
  if (modelo.key === "basico")
    return (
      <div style={{ background: modelo.cor, color: "#fff", fontWeight: 700, padding: "5px 10px", margin: "22px 0 10px", letterSpacing: 0.5 }}>
        {children}
      </div>
    );
  if (modelo.key === "tradicional")
    return (
      <div style={{ borderBottom: `2px solid ${modelo.cor}`, fontWeight: 700, fontSize: 15, padding: "0 0 6px", margin: "22px 0 10px", letterSpacing: 0.5 }}>
        {children}
      </div>
    );
  return (
    <div style={{ color: modelo.cor, fontWeight: 700, fontSize: 16, margin: "22px 0 8px", letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

function Contato({ cv, center }) {
  const items = [cv.endereco, cv.telefone, cv.email].filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", justifyContent: center ? "center" : "flex-start", color: "#374151" }}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function Corpo({ cv, modelo }) {
  const experiencias = cv.semExperiencia ? [] : (cv.experiencias || []).filter((e) => e && (e.cargo || e.empresa));
  const cursos = filled(cv.cursos, "nome");
  return (
    <>
      {cv.objetivo && (
        <>
          <Heading modelo={modelo}>OBJETIVO</Heading>
          <div style={{ whiteSpace: "pre-line" }}>{cv.objetivo}</div>
        </>
      )}

      {cv.escolaridade && (
        <>
          <Heading modelo={modelo}>FORMAÇÃO</Heading>
          <div>
            <b>{cv.escolaridade}</b>
            {cv.instituicaoEnsino && <div>{cv.instituicaoEnsino}</div>}
            {cv.anoConclusao && <div>Conclusão: {cv.anoConclusao}</div>}
          </div>
        </>
      )}

      <Heading modelo={modelo}>EXPERIÊNCIA PROFISSIONAL</Heading>
      {experiencias.length ? (
        experiencias.map((exp, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <b>{exp.cargo || exp.empresa}</b>
            {(exp.cargo && exp.empresa) || exp.periodo ? (
              <div style={{ color: "#374151" }}>
                {exp.cargo ? exp.empresa : ""}
                {exp.periodo ? `${exp.cargo && exp.empresa ? " · " : ""}${exp.periodo}` : ""}
              </div>
            ) : null}
            {exp.descricao && <div style={{ whiteSpace: "pre-line" }}>{exp.descricao}</div>}
          </div>
        ))
      ) : (
        <div>Em busca do primeiro emprego, com muita vontade de aprender e crescer.</div>
      )}

      {cursos.length > 0 && (
        <>
          <Heading modelo={modelo}>CURSOS</Heading>
          {cursos.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <b>{c.nome}</b>
              {(c.instituicao || c.ano) && (
                <span style={{ color: "#374151" }}>
                  {" "}
                  — {[c.instituicao, c.ano].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {cv.habilidades?.length > 0 && (
        <>
          <Heading modelo={modelo}>HABILIDADES</Heading>
          {modelo.key === "tradicional" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px" }}>
              {cv.habilidades.map((h) => (
                <div key={h} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: modelo.cor, flexShrink: 0 }} />
                  {h}
                </div>
              ))}
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {cv.habilidades.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {cv.informacoesAdicionais && (
        <>
          <Heading modelo={modelo}>INFORMAÇÕES ADICIONAIS</Heading>
          <div style={{ whiteSpace: "pre-line" }}>{cv.informacoesAdicionais}</div>
        </>
      )}
    </>
  );
}

const CurriculoDocumento = forwardRef(function CurriculoDocumento({ cv }, ref) {
  const modelo = MODELOS.find((m) => m.key === cv.modelo) || MODELOS[0];

  if (modelo.key === "basico") {
    return (
      <div ref={ref} style={page}>
        <div style={{ textAlign: "center" }}>
          {cv.foto && (
            <img
              src={cv.foto}
              alt=""
              style={{ width: 110, height: 110, objectFit: "cover", borderRadius: "50%", border: `3px solid ${modelo.cor}`, marginBottom: 10 }}
            />
          )}
          <div style={{ fontSize: 28, fontWeight: 700, color: modelo.cor, lineHeight: 1.2 }}>{cv.nome}</div>
          {cv.profissao && <div style={{ fontSize: 17, margin: "4px 0 12px" }}>{cv.profissao}</div>}
          <Contato cv={cv} center />
        </div>
        <Corpo cv={cv} modelo={modelo} />
      </div>
    );
  }

  if (modelo.key === "tradicional") {
    return (
      <div ref={ref} style={page}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{cv.nome}</div>
            {cv.profissao && <div style={{ fontSize: 16, margin: "4px 0 14px", color: "#374151" }}>{cv.profissao}</div>}
            <Contato cv={cv} />
          </div>
          {cv.foto && <img src={cv.foto} alt="" style={{ width: 100, height: 130, objectFit: "cover", border: "1px solid #d1d5db", flexShrink: 0 }} />}
        </div>
        <Corpo cv={cv} modelo={modelo} />
      </div>
    );
  }

  return (
    <div ref={ref} style={page}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, borderBottom: `2px solid ${modelo.cor}`, paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: modelo.cor, lineHeight: 1.2 }}>{String(cv.nome || "").toUpperCase()}</div>
          {cv.profissao && <div style={{ fontSize: 17, margin: "4px 0 12px" }}>{cv.profissao}</div>}
          <Contato cv={cv} />
        </div>
        {cv.foto && (
          <img src={cv.foto} alt="" style={{ width: 115, height: 115, objectFit: "cover", borderRadius: 6, border: `2px solid ${modelo.cor}`, flexShrink: 0 }} />
        )}
      </div>
      <Corpo cv={cv} modelo={modelo} />
    </div>
  );
});

export default CurriculoDocumento;
