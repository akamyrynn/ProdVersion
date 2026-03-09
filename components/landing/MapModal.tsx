"use client";

import { useEffect, useCallback, useState } from "react";
import { useLenis } from "lenis/react";
import styles from "./MapModal.module.css";

interface MapLocation {
  name: string;
  address: string;
  yandexMapsUrl: string;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapModal({ isOpen, onClose }: MapModalProps) {
  const lenis = useLenis();
  const [locations, setLocations] = useState<MapLocation[]>([]);

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
            yandexMapsUrl: d.yandex_maps_url as string,
          })
        );
        setLocations(locs);
      })
      .catch(() => {
        // silent
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

      <div className={styles.content}>
        {isOpen && locations.length === 0 && (
          <p className={styles.empty}>Точки пока не добавлены</p>
        )}

        {isOpen && locations.length > 0 && (
          <div className={styles.locationsList}>
            {locations.map((loc, i) => (
              <a
                key={i}
                href={loc.yandexMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.locationCard}
              >
                <strong>{loc.name}</strong>
                <span>{loc.address}</span>
                <span className={styles.mapLink}>Открыть на карте &rarr;</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
