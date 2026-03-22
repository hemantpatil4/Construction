import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchSections,
  fetchSectionById,
  clearSelectedSection,
} from "../store/slices/gallerySlice";
import "./Projects.css";

const Projects = () => {
  const dispatch = useAppDispatch();
  const { sections, selectedSection, loading } = useAppSelector(
    (state) => state.gallery,
  );
  const { mode } = useAppSelector((state) => state.theme);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchSections(false)); // Only active sections
  }, [dispatch]);

  const handleSectionClick = (sectionId: number) => {
    if (activeSection === sectionId) {
      setActiveSection(null);
      dispatch(clearSelectedSection());
    } else {
      setActiveSection(sectionId);
      dispatch(fetchSectionById(sectionId));
    }
  };

  const openLightbox = (url: string, title: string) => {
    setLightboxPhoto({ url, title });
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxPhoto(null);
    document.body.style.overflow = "";
  };

  return (
    <div className={`projects-page ${mode}`}>
      <div className="projects-hero">
        <h1>Our Projects</h1>
        <p>Explore our portfolio of exceptional construction projects</p>
      </div>

      <div className="projects-content">
        {loading && sections.length === 0 ? (
          <div className="projects-loading">
            <div className="spinner" />
            <span>Loading gallery...</span>
          </div>
        ) : sections.length === 0 ? (
          <div className="projects-empty">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            <h3>No Projects Available</h3>
            <p>Check back soon for our latest work!</p>
          </div>
        ) : (
          <div className="sections-grid">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`section-card ${activeSection === section.id ? "active" : ""}`}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="section-header">
                  <div className="section-info">
                    <h2>{section.name}</h2>
                    {section.description && <p>{section.description}</p>}
                  </div>
                  <div className="section-meta">
                    <span className="photo-count">
                      {section.photoCount} photos
                    </span>
                    <svg
                      className="expand-icon"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </div>
                </div>

                {activeSection === section.id && selectedSection && (
                  <div
                    className="section-photos"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedSection.photos.length === 0 ? (
                      <div className="no-photos">
                        No photos in this section yet
                      </div>
                    ) : (
                      <div className="photos-grid">
                        {selectedSection.photos
                          .filter((p) => p.isActive)
                          .map((photo) => (
                            <div
                              key={photo.id}
                              className="photo-item"
                              onClick={() =>
                                openLightbox(photo.imageUrl, photo.title || "")
                              }
                            >
                              <img
                                src={photo.thumbnailUrl || photo.imageUrl}
                                alt={photo.title || "Project photo"}
                                loading="lazy"
                              />
                              <div className="photo-overlay">
                                <svg
                                  width="28"
                                  height="28"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="11" cy="11" r="8" />
                                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                  <line x1="11" y1="8" x2="11" y2="14" />
                                  <line x1="8" y1="11" x2="14" y2="11" />
                                </svg>
                              </div>
                              {photo.title && (
                                <div className="photo-title">{photo.title}</div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" aria-label="Close">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxPhoto.url} alt={lightboxPhoto.title} />
            {lightboxPhoto.title && (
              <div className="lightbox-title">{lightboxPhoto.title}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
