import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, notification, Input, Typography, Spin } from "antd";
import { CameraOutlined, CloseOutlined, BarcodeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Html5Qrcode } from "html5-qrcode";

const { Text } = Typography;
const { Search } = Input;

const BarcodeScanner = ({ onDetect, onClose, visible }) => {
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanMode, setScanMode] = useState("normal");
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = useRef(`scanner-${Date.now()}`).current;

  // Parar o scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        // Ignorar erros ao parar
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Iniciar o scanner
  const startScanner = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await stopScanner();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const container = document.getElementById(scannerContainerId);
      if (!container) {
        throw new Error("Container não encontrado");
      }

      html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);

      const qrboxSize = scanMode === "wide" 
        ? { width: 320, height: 100 } 
        : { width: 250, height: 120 };

      const config = {
        fps: 10,
        qrbox: qrboxSize,
      };

      console.log("🎥 Iniciando scanner...");
      
      const onSuccess = (decodedText) => {
        console.log("✅ CÓDIGO DETECTADO:", decodedText);
        notification.success({
          message: "Código detectado!",
          description: decodedText,
          duration: 2,
        });
        stopScanner();
        onDetect(decodedText);
      };

      const onError = () => {};

      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          onError
        );
      } catch (cameraErr) {
        console.log("⚠️ Tentando câmera alternativa...");
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          await html5QrCodeRef.current.start(
            cameras[0].id,
            config,
            onSuccess,
            onError
          );
        } else {
          throw new Error("Nenhuma câmera disponível");
        }
      }
      
      console.log("✅ Scanner iniciado!");
      setIsScanning(true);
    } catch (err) {
      console.error("❌ Erro:", err);
      let errorMsg = "Não foi possível iniciar o scanner.";
      if (err.name === "NotAllowedError") {
        errorMsg = "Permissão para câmera negada.";
      } else if (err.name === "NotFoundError") {
        errorMsg = "Nenhuma câmera encontrada.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [onDetect, stopScanner, scanMode, scannerContainerId]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [visible, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    setManualCode("");
    setError(null);
    onClose();
  };

  const handleManualSubmit = async (value) => {
    const code = (value || manualCode).trim();
    if (code) {
      await stopScanner();
      onDetect(code);
      setManualCode("");
    } else {
      notification.warning({
        message: "Código inválido",
        description: "Digite um código de barras válido.",
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    startScanner();
  };

  const toggleScanMode = async () => {
    const newMode = scanMode === "normal" ? "wide" : "normal";
    setScanMode(newMode);
    await stopScanner();
    setTimeout(() => startScanner(), 200);
  };

  return (
    <Modal
      title="Scanner de Código de Barras"
      open={visible}
      onCancel={handleClose}
      footer={
        <Button onClick={handleClose} icon={<CloseOutlined />}>
          Fechar
        </Button>
      }
      width={500}
      centered
      destroyOnClose
    >
      <div style={{ textAlign: "center" }}>
        {/* Scanner Container */}
        <div
          style={{
            width: "100%",
            maxWidth: "450px",
            margin: "0 auto",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #d9d9d9",
            backgroundColor: "#000",
            minHeight: "280px",
            position: "relative",
          }}
        >
          {isLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.8)",
                zIndex: 10,
              }}
            >
              <Spin size="large" />
              <Text style={{ color: "#fff", marginTop: "12px" }}>
                Iniciando câmera...
              </Text>
            </div>
          )}

          {error ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "280px",
                padding: "20px",
                backgroundColor: "#f5f5f5",
              }}
            >
              <CameraOutlined style={{ fontSize: "48px", color: "#999", marginBottom: "12px" }} />
              <Text type="danger" style={{ marginBottom: "12px", textAlign: "center" }}>
                {error}
              </Text>
              <Button icon={<ReloadOutlined />} onClick={handleRetry}>
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div
              id={scannerContainerId}
              style={{ width: "100%", minHeight: "280px" }}
            />
          )}
        </div>

        {isScanning && !error && (
          <div style={{ marginTop: "10px" }}>
            <Button size="small" onClick={toggleScanMode}>
              {scanMode === "normal" ? "📐 Área ampla" : "📐 Área normal"}
            </Button>
            <Text type="secondary" style={{ display: "block", marginTop: "6px", fontSize: "12px" }}>
              Posicione o código de barras dentro da área destacada
            </Text>
          </div>
        )}

        {/* Input manual */}
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            background: "#fafafa",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
          }}
        >
          <Text strong style={{ display: "block", marginBottom: "8px" }}>
            <BarcodeOutlined style={{ marginRight: "6px" }} />
            Ou digite o código manualmente:
          </Text>
          <Search
            placeholder="Código de barras ou ID"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onSearch={handleManualSubmit}
            enterButton="Buscar"
            size="large"
          />
        </div>

        {/* Dicas */}
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#e6f7ff",
            borderRadius: "6px",
            textAlign: "left",
            fontSize: "11px",
            color: "#0050b3",
          }}
        >
          💡 <strong>Dica:</strong> Mantenha o código bem iluminado e centralizado.
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScanner;
