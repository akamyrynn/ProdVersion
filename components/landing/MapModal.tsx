"use client";

import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useLenis } from "lenis/react";
import styles from "./MapModal.module.css";

const TAG_LABELS: Record<string, string> = {
  sells_bags: "Продают в пачках",
  filter_coffee: "Есть фильтр-кофе",
  decaf: "Есть декаф",
  has_food: "Есть еда",
  dog_friendly: "Дог френдли",
  wifi: "Есть Wi-Fi",
  alt_milk: "Есть альт. молоко",
  desserts: "Есть десерты",
};

interface MapLocation {
  name: string;
  address: string;
  phone?: string;
  imageUrl?: string;
  workingHours?: string;
  tags: string[];
  city: string;
  yandexMapsUrl: string;
  latitude: number;
  longitude: number;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

let scriptLoaded = false;

function waitForYmaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }
    const t = setInterval(() => {
      if (window.ymaps) {
        clearInterval(t);
        resolve();
      }
    }, 50);
    setTimeout(() => {
      clearInterval(t);
      reject(new Error("ymaps timeout"));
    }, 15000);
  });
}

function loadYmapsScript(): Promise<void> {
  if (scriptLoaded && window.ymaps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="api-maps.yandex.ru"]')) {
      waitForYmaps()
        .then(() => {
          scriptLoaded = true;
          resolve();
        })
        .catch(reject);
      return;
    }

    const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || "";
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${key}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      waitForYmaps()
        .then(() => {
          scriptLoaded = true;
          resolve();
        })
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps"));
    document.head.appendChild(script);
  });
}

export default function MapModal({ isOpen, onClose }: MapModalProps) {
  const lenis = useLenis();
  const [allLocations, setAllLocations] = useState<MapLocation[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Сочи");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRefs = useRef<any[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Derive cities from data
  const cities = useMemo(() => {
    const set = new Set(allLocations.map((l) => l.city));
    return Array.from(set).sort();
  }, [allLocations]);

  // Filter locations
  const locations = useMemo(() => {
    return allLocations.filter((loc) => {
      if (loc.city !== selectedCity) return false;
      if (activeTags.size > 0) {
        return Array.from(activeTags).every((t) => loc.tags.includes(t));
      }
      return true;
    });
  }, [allLocations, selectedCity, activeTags]);

  // Count per tag (in current city)
  const tagCounts = useMemo(() => {
    const cityLocs = allLocations.filter((l) => l.city === selectedCity);
    const counts: Record<string, number> = {};
    for (const key of Object.keys(TAG_LABELS)) {
      counts[key] = cityLocs.filter((l) => l.tags.includes(key)).length;
    }
    return counts;
  }, [allLocations, selectedCity]);

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

  // Fetch locations
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/map-locations?where[isActive][equals]=true&limit=100&depth=1")
      .then((r) => r.json())
      .then((data) => {
        const locs: MapLocation[] = (data.docs || []).map(
          (d: Record<string, any>) => {
            let imageUrl: string | undefined;
            if (d.image && typeof d.image === "object" && d.image.url) {
              imageUrl = d.image.url;
            }
            return {
              name: d.name as string,
              address: d.address as string,
              phone: (d.phone as string) || undefined,
              imageUrl,
              workingHours: (d.workingHours as string) || undefined,
              tags: Array.isArray(d.tags) ? d.tags : [],
              city: (d.city as string) || "Сочи",
              yandexMapsUrl: (d.yandexMapsUrl as string) || "",
              latitude: d.latitude as number,
              longitude: d.longitude as number,
            };
          }
        );
        setAllLocations(locs);
      })
      .catch(() => {
        setAllLocations([]);
      });
  }, [isOpen]);

  // Initialize / update map when filtered locations change
  useEffect(() => {
    if (!isOpen || locations.length === 0 || !mapContainerRef.current) return;

    let destroyed = false;

    async function initMap() {
      try {
        await loadYmapsScript();
        if (destroyed || !mapContainerRef.current) return;

        window.ymaps.ready(() => {
          if (destroyed || !mapContainerRef.current) return;

          if (mapInstanceRef.current) {
            mapInstanceRef.current.destroy();
            mapInstanceRef.current = null;
          }

          const centerLat =
            locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
          const centerLon =
            locations.reduce((s, l) => s + l.longitude, 0) / locations.length;

          const map = new window.ymaps.Map(mapContainerRef.current, {
            center: [centerLat, centerLon],
            zoom: 12,
            controls: ["zoomControl"],
          });

          const placemarks: any[] = [];

          locations.forEach((loc, idx) => {
            const imgHtml = loc.imageUrl
              ? `<div style="margin-bottom:8px"><img src="${loc.imageUrl}" style="width:100%;height:150px;object-fit:cover;border-radius:8px"/></div>`
              : "";
            const hoursHtml = loc.workingHours
              ? `<div style="color:#2e7d32;font-size:13px;font-weight:500;margin-bottom:4px">${loc.workingHours}</div>`
              : "";
            const phoneLine = loc.phone
              ? `<div style="color:#333;font-size:13px;margin-top:4px">${loc.phone}</div>`
              : "";
            const tagsHtml =
              loc.tags.length > 0
                ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${loc.tags.map((t) => `<span style="padding:2px 8px;background:#f0f0f0;border-radius:12px;font-size:11px;color:#555">${TAG_LABELS[t] || t}</span>`).join("")}</div>`
                : "";
            const footer = loc.yandexMapsUrl
              ? `<a href="${loc.yandexMapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#e6610d;font-weight:600;text-decoration:none;font-size:13px">Подробнее на Яндекс.Картах →</a>`
              : "";

            const placemark = new window.ymaps.Placemark(
              [loc.latitude, loc.longitude],
              {
                balloonContentHeader: `<span style="font-size:15px;font-weight:700">${loc.name}</span>`,
                balloonContentBody: `${imgHtml}${hoursHtml}<div style="font-size:13px;color:#666">${loc.address}</div>${phoneLine}${tagsHtml}`,
                balloonContentFooter: footer,
                hintContent: loc.name,
              },
              {
                balloonMaxWidth: 320,
              }
            );

            placemark.events.add("click", () => {
              setActiveIdx(idx);
              cardRefs.current[idx]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            });

            map.geoObjects.add(placemark);
            placemarks.push(placemark);
          });

          placemarkRefs.current = placemarks;

          if (locations.length > 1) {
            const bounds = map.geoObjects.getBounds();
            if (bounds) {
              map.setBounds(bounds, {
                checkZoomRange: true,
                zoomMargin: 50,
              });
            }
          }

          mapInstanceRef.current = map;
          setMapReady(true);
        });
      } catch (err) {
        console.error("Map init error:", err);
      }
    }

    initMap();

    return () => {
      destroyed = true;
    };
  }, [isOpen, locations]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      setMapReady(false);
      setActiveIdx(null);
    }
  }, [isOpen]);

  function handleCardClick(idx: number) {
    const loc = locations[idx];
    setActiveIdx(idx);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([loc.latitude, loc.longitude], 16, {
        duration: 500,
      });
    }
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setActiveIdx(null);
  }

  // Prevent Lenis from capturing wheel events on sidebar
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const stopPropagation = (e: WheelEvent) => {
      e.stopPropagation();
    };

    sidebar.addEventListener("wheel", stopPropagation, { passive: false });
    return () => sidebar.removeEventListener("wheel", stopPropagation);
  }, []);

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {/* City selector */}
          <div className={styles.citySelector}>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setActiveIdx(null);
                setActiveTags(new Set());
              }}
              className={styles.citySelect}
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <svg className={styles.cityChevron} viewBox="0 0 20 20">
              <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        <div className={styles.headerRight}>
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
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        <div className={styles.sidebar} ref={sidebarRef}>
          {locations.length === 0 && isOpen && (
            <p className={styles.empty}>
              {activeTags.size > 0
                ? "Нет точек с выбранными фильтрами"
                : "Точки пока не добавлены"}
            </p>
          )}
          {locations.map((loc, i) => (
            <div
              key={`${loc.latitude}-${loc.longitude}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="button"
              tabIndex={0}
              className={`${styles.card} ${activeIdx === i ? styles.cardActive : ""}`}
              onClick={() => handleCardClick(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCardClick(i);
              }}
            >
              {loc.imageUrl && (
                <div className={styles.cardImgWrap}>
                  {loc.workingHours && (
                    <span className={styles.badge}>{loc.workingHours}</span>
                  )}
                  <img
                    src={loc.imageUrl}
                    alt={loc.name}
                    className={styles.cardImg}
                  />
                </div>
              )}
              <div className={styles.cardBody}>
                <strong className={styles.cardName}>{loc.name}</strong>
                <span className={styles.cardAddr}>{loc.address}</span>
                {loc.phone && (
                  <span className={styles.cardPhone}>{loc.phone}</span>
                )}
                {loc.tags.length > 0 && (
                  <div className={styles.cardTags}>
                    {loc.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {TAG_LABELS[tag] || tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className={styles.mapWrap}>
          <div ref={mapContainerRef} className={styles.mapContainer} />

          {/* Filter panel overlay on map */}
          {showFilters && (
            <div className={styles.filterPanel}>
              <button
                type="button"
                className={styles.filterClose}
                onClick={() => setShowFilters(false)}
              >
                &times; Закрыть
              </button>
              {Object.entries(TAG_LABELS).map(([key, label]) => {
                const count = tagCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <label key={key} className={styles.filterItem}>
                    <input
                      type="checkbox"
                      checked={activeTags.has(key)}
                      onChange={() => toggleTag(key)}
                      className={styles.filterCheck}
                    />
                    <span className={styles.filterLabel}>{label}</span>
                    <span className={styles.filterCount}>{count}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
