"use client";

import { useEffect, useCallback, useState } from "react";
import { useLenis } from "lenis/react";
import styles from "./MapModal.module.css";

interface MapLocation {
  name: string;
  address: string;
  phone?: string;
  yandexMapsUrl: string;
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
            phone: (d.phone as string) || undefined,
            yandexMapsUrl: d.yandex_maps_url as string,
            latitude: d.latitude as number,
            longitude: d.longitude as number,
          })
        );
        setLocations(locs);

        if (locs.length > 0) {
          const centerLat =
            locs.reduce((s, l) => s + l.latitude, 0) / locs.length;
          const centerLon =
            locs.reduce((s, l) => s + l.longitude, 0) / locs.length;
          const pts = locs
            .map((l) => `${l.longitude},${l.latitude},pm2rdm`)
            .join("~");
          setMapUrl(
            `https://yandex.ru/map-widget/v1/?ll=${centerLon},${centerLat}&z=12&pt=${pts}`
          );
        }
      })
      .catch(() => {
        setMapUrl(
          "https://yandex.ru/map-widget/v1/?ll=39.723098,43.585472&z=13"
        );
      });
  }, [isOpen]);

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
      aria-hidden={!isOpen}
    >
      {/* Header */}
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

      {/* Body: sidebar + map */}
      <div className={styles.body}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {locations.length === 0 && isOpen && (
            <p className={styles.empty}>Точки пока не добавлены</p>
          )}
          {locations.map((loc, i) => (
            <a
              key={i}
              href={loc.yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
            >
              <strong className={styles.cardName}>{loc.name}</strong>
              <span className={styles.cardAddress}>{loc.address}</span>
              {loc.phone && (
                <span className={styles.cardPhone}>{loc.phone}</span>
              )}
              <span className={styles.cardLink}>
                Открыть на карте &rarr;
              </span>
            </a>
          ))}
        </div>

        {/* Map */}
        <div className={styles.mapWrap}>
          {isOpen && mapUrl && (
            <iframe
              className={styles.mapFrame}
              src={mapUrl}
              title="Карта точек продаж 10coffee"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
