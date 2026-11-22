import React, { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";
import { MenuOutlined } from "@ant-design/icons";
import { useThemeColor } from "helpers/theme";
import "./simple.css";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
};

export const toggleMobileNav = () => {
  const root = document.documentElement;
  document.getElementById("bodyClick")?.remove();
  if (root.classList.contains("nav-open")) {
    root.classList.remove("nav-open");
    return;
  }
  root.classList.add("nav-open");
  const node = document.createElement("div");
  node.id = "bodyClick";
  node.style.cssText = "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
  node.onclick = () => {
    node.remove();
    root.classList.remove("nav-open");
  };
  document.body.appendChild(node);
};

export const TONES = {
  green: ["#16a34a", "#dcfce7"],
  red: ["#dc2626", "#fee2e2"],
  orange: ["#d97706", "#fef3c7"],
  blue: ["#2563eb", "#dbeafe"],
  purple: ["#7c3aed", "#ede9fe"],
  gray: ["#57534e", "#f5f5f4"],
};

export const toneStyle = (tone, primary) => {
  const [color, bg] = TONES[tone] || [primary, `${primary}1f`];
  return { "--sp-tone": color, "--sp-tone-bg": bg };
};

export const Icon = ({ tone, children, size }) => {
  const { primary } = useThemeColor();
  return (
    <span className="sp-icon" style={{ ...toneStyle(tone, primary), ...(size ? { width: size, height: size } : null) }}>
      {children}
    </span>
  );
};

export const StatCard = ({ icon, tone, label, value, hint, onClick, active }) => {
  const { primary } = useThemeColor();
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`sp-stat${active ? " is-active" : ""}`}
      style={toneStyle(tone, primary)}
      onClick={onClick}
    >
      {icon && <span className="sp-icon">{icon}</span>}
      <span className="sp-stat-label">{label}</span>
      <span className="sp-stat-value">{value}</span>
      {hint && <span className="sp-stat-hint">{hint}</span>}
    </Tag>
  );
};

export const Chips = ({ value, onChange, options }) => (
  <div className="sp-chips" role="tablist">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={opt.value === value}
        className={`sp-chip${opt.value === value ? " is-active" : ""}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
        {opt.count !== undefined && <span className="sp-chip-count">{opt.count}</span>}
      </button>
    ))}
  </div>
);

export const EmptyState = ({ icon, title, text, action }) => (
  <div className="sp-empty">
    {icon && <div className="sp-empty-icon">{icon}</div>}
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {action}
  </div>
);

export const Section = ({ icon, title, subtitle, extra, children, style }) => (
  <div className="sp-card" style={style}>
    {(title || extra) && (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          {title && (
            <h3 className="sp-card-title">
              {icon}
              {title}
            </h3>
          )}
          {subtitle ? <p className="sp-card-sub">{subtitle}</p> : <div style={{ height: 12 }} />}
        </div>
        {extra}
      </div>
    )}
    {children}
  </div>
);

export default function SimplePage({ title, subtitle, actions, mobileActions, children }) {
  const { primary, darker, theme } = useThemeColor();
  const isMobile = useIsMobile();
  const vars = { "--sp-primary": primary, "--sp-primary-dark": darker, "--qui-primary": primary };

  // Modais são renderizados fora da página e também precisam da cor da empresa.
  useEffect(() => {
    document.documentElement.style.setProperty("--sp-primary", primary);
    document.documentElement.style.setProperty("--sp-primary-dark", darker);
  }, [primary, darker]);

  const pageTheme = { ...theme, token: { ...theme.token, borderRadius: 10 } };

  if (isMobile) {
    return (
      <ConfigProvider locale={ptBR} theme={pageTheme}>
        <div className="sp-mobile" style={vars}>
          <div className="sp-mobile-head">
            <button type="button" className="sp-round" aria-label="Abrir menu" onClick={toggleMobileNav}>
              <MenuOutlined />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {mobileActions}
          </div>
          <div className="sp-mobile-body">{children}</div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={ptBR} theme={pageTheme}>
      <div className="sp-desktop" style={vars}>
        <div className="sp-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="sp-head-actions">{actions}</div>}
        </div>
        {children}
      </div>
    </ConfigProvider>
  );
}
