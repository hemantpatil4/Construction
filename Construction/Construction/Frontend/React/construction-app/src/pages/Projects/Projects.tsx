import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchSections,
  fetchSectionById,
  clearSelectedSection,
} from "../../store/slices/gallerySlice";
import {
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMagnifyingGlassPlus,
  HiOutlineSparkles,
} from "react-icons/hi2";
import "./Projects.css";

const Projects = () => {
  const dispatch = useAppDispatch();
  const { sections, selectedSection, loading } = useAppSelector(
    (state) => state.gallery,
  );
  const { mode } = useAppSelector((state) => state.theme);

  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    photos: Array<{ url: string; title: string; description?: string }>;
    currentIndex: number;
  }>({ isOpen: false, photos: [], currentIndex: 0 });

  useEffect(() => {
    dispatch(fetchSections(false));
  }, [dispatch]);

  // Auto-expand first section
  useEffect(() => {
    if (sections.length > 0 && activeSection === null) {
      const firstSection = sections[0];
      setActiveSection(firstSection.id);
      dispatch(fetchSectionById(firstSection.id));
    }
  }, [sections, activeSection, dispatch]);

  const handleSectionClick = (sectionId: number) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      dispatch(clearSelectedSection());
    } else {
      setActiveSection(sectionId);
      dispatch(fetchSectionById(sectionId));
    }
  };

  const openLightbox = (
    photos: Array<{ url: string; title: string; description?: string }>,
    index: number,
  ) => {
    setLightbox({ isOpen: true, photos, currentIndex: index });
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightbox({ isOpen: false, photos: [], currentIndex: 0 });
    document.body.style.overflow = "";
  };

  const navigateLightbox = useCallback((direction: "prev" | "next") => {
    setLightbox((prev) => {
      const newIndex =
        direction === "next"
          ? (prev.currentIndex + 1) % prev.photos.length
          : (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length;
      return { ...prev, currentIndex: newIndex };
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightbox.isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "ArrowLeft") navigateLightbox("prev");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.isOpen, navigateLightbox]);

  const activePhotos = selectedSection?.photos.filter((p) => p.isActive) || [];

  return (
    <div className={`projects-page ${mode}`}>
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════ */}
      <section className="projects-hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <div className="hero-badge">
            <HiOutlineSparkles /> Portfolio
          </div>
          <h1>Our Projects</h1>
          <p>
            Discover our exceptional portfolio of construction excellence.
            <br />
            Each project tells a story of innovation, quality, and
            craftsmanship.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{sections.length}</span>
              <span className="stat-label">Collections</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="stat-number">
                {sections.reduce((acc, s) => acc + s.photoCount, 0)}
              </span>
              <span className="stat-label">Photos</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <div className="scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          GALLERY CONTENT
         ═══════════════════════════════════════════════════════════ */}
      <section className="projects-content">
        {loading && sections.length === 0 ? (
          <div className="projects-loading">
            <div className="loader-ring">
              <div />
              <div />
              <div />
              <div />
            </div>
            <span>Loading gallery...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="projects-empty">
            <div className="empty-icon-wrapper">
              <HiOutlinePhoto />
            </div>
            <h3>Coming Soon</h3>
            <p>
              We're preparing something amazing. Check back soon to see our
              latest projects!
            </p>
          </div>
        ) : (
          <>
            {/* Section Tabs */}
            <div className="section-tabs-wrapper">
              <div className="section-tabs">
                {sections.map((section, idx) => (
                  <button
                    key={section.id}
                    className={`section-tab ${
                      activeSection === section.id ? "active" : ""
                    }`}
                    onClick={() => handleSectionClick(section.id)}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <span className="tab-name">{section.name}</span>
                    <span className="tab-count">{section.photoCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Section Info */}
            {activeSection && selectedSection && (
              <div className="active-section-info">
                <h2>{selectedSection.name}</h2>
                {selectedSection.description && (
                  <p>{selectedSection.description}</p>
                )}
              </div>
            )}

            {/* Photos Grid */}
            {activeSection && selectedSection && (
              <div className="photos-masonry">
                {activePhotos.length === 0 ? (
                  <div className="no-photos-message">
                    <HiOutlinePhoto />
                    <p>No photos in this collection yet</p>
                  </div>
                ) : (
                  activePhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="photo-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() =>
                        openLightbox(
                          activePhotos.map((p) => ({
                            url: p.imageUrl,
                            title: p.title || "",
                            description: p.description || "",
                          })),
                          index,
                        )
                      }
                    >
                      <div className="photo-card-image">
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt={photo.title || "Project photo"}
                          loading="lazy"
                        />
                        <div className="photo-card-overlay">
                          <div className="overlay-icon">
                            <HiOutlineMagnifyingGlassPlus />
                          </div>
                          <div className="overlay-content">
                            {photo.title && (
                              <h4 className="overlay-title">{photo.title}</h4>
                            )}
                            {photo.description && (
                              <p className="overlay-desc">
                                {photo.description.substring(0, 80)}
                                {photo.description.length > 80 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {photo.title && (
                        <div className="photo-card-info">
                          <h4>{photo.title}</h4>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          LIGHTBOX
         ═══════════════════════════════════════════════════════════ */}
      {lightbox.isOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          {/* Close Button */}
          <button className="lightbox-close" aria-label="Close">
            <HiOutlineXMark />
          </button>

          {/* Navigation */}
          {lightbox.photos.length > 1 && (
            <>
              <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("prev");
                }}
                aria-label="Previous"
              >
                <HiOutlineChevronLeft />
              </button>
              <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox("next");
                }}
                aria-label="Next"
              >
                <HiOutlineChevronRight />
              </button>
            </>
          )}

          {/* Image Container */}
          <div
            className="lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-image-wrapper">
              <img
                src={lightbox.photos[lightbox.currentIndex]?.url}
                alt={lightbox.photos[lightbox.currentIndex]?.title}
                className="lightbox-image"
              />
            </div>

            {/* Caption */}
            {(lightbox.photos[lightbox.currentIndex]?.title ||
              lightbox.photos[lightbox.currentIndex]?.description) && (
              <div className="lightbox-caption">
                {lightbox.photos[lightbox.currentIndex]?.title && (
                  <h3>{lightbox.photos[lightbox.currentIndex].title}</h3>
                )}
                {lightbox.photos[lightbox.currentIndex]?.description && (
                  <p>{lightbox.photos[lightbox.currentIndex].description}</p>
                )}
              </div>
            )}

            {/* Counter */}
            {lightbox.photos.length > 1 && (
              <div className="lightbox-counter">
                {lightbox.currentIndex + 1} / {lightbox.photos.length}
              </div>
            )}

            {/* Thumbnails */}
            {lightbox.photos.length > 1 && (
              <div className="lightbox-thumbnails">
                {lightbox.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    className={`lightbox-thumb ${
                      idx === lightbox.currentIndex ? "active" : ""
                    }`}
                    onClick={() =>
                      setLightbox((prev) => ({ ...prev, currentIndex: idx }))
                    }
                  >
                    <img src={photo.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
