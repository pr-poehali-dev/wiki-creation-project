import { useState } from "react";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const WATERMARK_URL = "https://cdn.poehali.dev/files/вод знак.png";

const WatermarkedImage = ({ src, alt, className = "", onError }: WatermarkedImageProps) => {
  const [imageError, setImageError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ position: "relative" }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full"
        onError={handleError}
        style={{ display: "block" }}
      />
      {!imageError && (
        <img
          src={WATERMARK_URL}
          alt="Watermark"
          className="absolute"
          style={{
            bottom: "8px",
            right: "8px",
            width: "80px",
            height: "auto",
            opacity: 0.7,
            pointerEvents: "none",
            zIndex: 10
          }}
        />
      )}
    </div>
  );
};

export default WatermarkedImage;
