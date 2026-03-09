"use client";

import { useEffect, useCallback, useState } from "react";
import { useLenis } from "lenis/react";
import styles from "./MapModal.module.css";

interface MapLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapModal({ isOpen, onClose }: MapModalProps) {
  const lenis = useLenis();
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  const lockScroll = useCallback(() => {
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
  }, [lenis]);

  const unlockScroll = useCallback(() => {
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }, [lenis]);

  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen, lockScroll, unlockScroll]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Fetch locations from Payload
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/map-locations?where[isActive][equals]=true&limit=50")
      .then((r) => r.json())
      .then((data) => {
        const locs: MapLocation[] = (data.docs || []).map(
          (d: Record<string, unknown>) => ({
            name: d.name as string,
            address: d.address as string,
            latitude: d.latitude as number,
            longitude: d.longitude as number,
          })
        );
        setLocations(locs);

        if (locs.length > 0) {
          // Build Yandex Maps embed URL with placemarks
          const centerLat = locs.reduce((s, l) => s + l.latitude, 0) / locs.length;
          const centerLon = locs.reduce((s, l) => s + l.longitude, 0) / locs.length;

          const pts = locs.map((l) => `${l.longitude},${l.latitude},pm2rdm`).join("~");
          const url = `https://yandex.ru/map-widget/v1/?ll=${centerLon},${centerLat}&z=13&pt=${pts}`;
          setMapUrl(url);
        }
      })
      .catch(() => {
        // Fallback: default Sochi location
        setMapUrl(
          "https://yandex.ru/map-widget/v1/?ll=39.723098,43.585472&z=13&pt=39.723098,43.585472,pm2rdm"
        );
      });
  }, [isOpen]);

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
      aria-hidden={!isOpen}
    >
      <div className={styles.header}>
        <span className={styles.title}>Где попробовать наш кофе</span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg className={styles.closeSvg} viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.mapContainer}>
        {isOpen && mapUrl && (
          <iframe
            className={styles.mapFrame}
            src={mapUrl}
            title="Карта точек продаж 10coffee"
            allowFullScreen
          />
        )}

        {isOpen && locations.length > 0 && (
          <div className={styles.locationsList}>
            {locations.map((loc) => (
              <div key={`${loc.latitude}-${loc.longitude}`} className={styles.locationCard}>
                <strong>{loc.name}</strong>
                <span>{loc.address}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
