import { useCompany } from "context/CompanyContext";

export const DEFAULT_THEME_COLOR = "#667eea";

export function adjustColor(hex, percent) {
  if (!hex || !hex.startsWith("#") || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function useThemeColor() {
  const { sidebarColor } = useCompany();
  const primary = sidebarColor || DEFAULT_THEME_COLOR;
  return {
    primary,
    darker: adjustColor(primary, -30),
    theme: {
      token: {
        colorPrimary: primary,
        borderRadius: 8,
        colorText: "#1c1917",
        colorBorder: "#e7e5e4",
      },
    },
    pageStyle: { "--qui-primary": primary },
  };
}

export function quietMobileStyles(primary) {
  return {
    container: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
      maxWidth: "100vw",
      overflow: "hidden",
      background: primary,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      zIndex: 100,
    },
    header: {
      background: "transparent",
      padding: "16px",
      flexShrink: 0,
    },
    headerTitle: {
      color: "#fff",
      fontSize: "18px",
      fontWeight: "600",
      letterSpacing: "-0.03em",
      margin: 0,
    },
    headerSubtitle: {
      color: "rgba(255,255,255,0.72)",
      fontSize: "12px",
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "8px",
      marginTop: "12px",
    },
    summaryCard: {
      background: "rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "10px 12px",
      border: "1px solid rgba(255,255,255,0.14)",
    },
    summaryValue: {
      color: "#fff",
      fontSize: "16px",
      fontWeight: "600",
      display: "block",
      letterSpacing: "-0.03em",
    },
    summaryLabel: {
      color: "rgba(255,255,255,0.7)",
      fontSize: "11px",
    },
    totalCard: {
      background: "rgba(255,255,255,0.16)",
      borderRadius: "10px",
      padding: "12px 14px",
      marginTop: "8px",
      textAlign: "center",
      border: "1px solid rgba(255,255,255,0.14)",
    },
    totalValue: {
      color: "#fff",
      fontSize: "22px",
      fontWeight: "600",
      display: "block",
      letterSpacing: "-0.03em",
    },
    totalLabel: {
      color: "rgba(255,255,255,0.75)",
      fontSize: "11px",
    },
    content: {
      flex: 1,
      background: "#fafaf9",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      padding: "16px",
      paddingBottom: "20px",
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      maxWidth: "100vw",
      boxSizing: "border-box",
      minHeight: 0,
    },
    saleCard: {
      background: "#fff",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "10px",
      border: "1px solid #e7e5e4",
      boxShadow: "none",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    saleHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px",
    },
    saleId: {
      fontSize: "12px",
      color: "#78716c",
    },
    saleTime: {
      fontSize: "11px",
      color: "#a8a29e",
    },
    saleTotal: {
      fontSize: "16px",
      fontWeight: "600",
      color: primary,
    },
    saleActions: {
      display: "flex",
      gap: "6px",
      marginTop: "8px",
    },
    despesaCard: {
      background: "#fff",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "10px",
      border: "1px solid #e7e5e4",
      boxShadow: "none",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    despesaHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px",
    },
    despesaName: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#1c1917",
      flex: 1,
      marginRight: "8px",
    },
    despesaValue: {
      fontSize: "16px",
      fontWeight: "600",
      color: primary,
    },
    despesaActions: {
      display: "flex",
      gap: "6px",
      marginTop: "8px",
    },
    searchContainer: {
      marginBottom: "12px",
      display: "flex",
      gap: "8px",
      flexShrink: 0,
    },
    sectionCard: {
      background: "#fff",
      borderRadius: "12px",
      padding: "14px",
      marginBottom: "12px",
      border: "1px solid #e7e5e4",
      boxShadow: "none",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "12px",
      color: "#1c1917",
    },
    productItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #f5f5f4",
    },
    productName: {
      fontSize: "12px",
      color: "#44403c",
      flex: 1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginRight: "8px",
    },
    productValue: {
      fontSize: "12px",
      fontWeight: "600",
      color: primary,
    },
  };
}
