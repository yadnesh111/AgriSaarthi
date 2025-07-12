import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Reels.css";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await axios.get("https://agrisaarthibackend.onrender.com/reels");
        setReels(response.data.reels || []);
      } catch (error) {
        console.error("Error fetching reels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  return (
    <div className="reels-container" ref={containerRef}>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : reels.length === 0 ? (
        <div className="no-reels">No reels available</div>
      ) : (
        reels.map((video, index) => (
          <div key={index} className="reel-item">
            <iframe
              className="reel-video"
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&loop=1&playlist=${video.videoId}&controls=0&modestbranding=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen={true}
              muted={true}
              loop={true}
            />
            <div className="reel-caption">
              <h3>{video.title}</h3>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
