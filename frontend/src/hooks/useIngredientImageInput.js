import { useEffect, useRef, useState } from "react";

const CAMERA_ERROR_MESSAGE = "No se pudo acceder a la cámara. Verifica los permisos o prueba con otro navegador.";

const stopStream = (mediaStream) => {
  mediaStream.getTracks().forEach((track) => track.stop());
};

export const useIngredientImageInput = ({ onCameraReady, onCameraError } = {}) => {
  const [imagen, setImagen] = useState(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [stream, setStream] = useState(null);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stopStream(stream);
      }
    };
  }, [stream]);

  useEffect(() => {
    if (mostrarCamara && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [mostrarCamara, stream]);

  useEffect(() => {
    if (!imagen || typeof imagen !== "object" || !imagen.name) {
      setImagenPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imagen);
    setImagenPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imagen]);

  const handleImagen = (e) => {
    const archivo = e.target.files?.[0] ?? null;
    // Resetear el valor permite volver a seleccionar el MISMO archivo:
    // sin esto, el input no dispara onChange la segunda vez.
    e.target.value = "";
    setImagen(archivo);
  };

  const cerrarCamara = () => {
    if (stream) {
      stopStream(stream);
      setStream(null);
    }
    setMostrarCamara(false);
  };

  const iniciarCamara = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      setStream(mediaStream);
      setMostrarCamara(true);
      onCameraReady?.();
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      onCameraError?.(CAMERA_ERROR_MESSAGE);
    }
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        const file = new File([blob], "foto-ingredientes.jpg", { type: "image/jpeg" });
        setImagen(file);
        cerrarCamara();
      }, "image/jpeg", 0.8);
    }
  };

  return {
    imagen,
    setImagen,
    mostrarCamara,
    setMostrarCamara,
    stream,
    setStream,
    imagenPreviewUrl,
    videoRef,
    canvasRef,
    handleImagen,
    iniciarCamara,
    capturarFoto,
    cerrarCamara,
  };
};
