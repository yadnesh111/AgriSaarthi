import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AgricultureNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(
          "https://agrisaarthibackend.onrender.com/news?district=Pune"
        );
        const cleanData = response.data.articles.map((item) => ({
          ...item,
          summary:
            item.summary?.replace(/<[^>]+>/g, "") ||
            item.description ||
            "No summary",
        }));
        setNews(cleanData);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Latest Agriculture News</h2>
      {loading ? (
        <p>Loading...</p>
      ) : news.length === 0 ? (
        <p>No news available.</p>
      ) : (
        <div className="space-y-4">
          {news.map((item, index) => (
            <div key={index} className="border p-3 rounded-xl shadow">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.summary}</p>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm"
                >
                  Read more
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
