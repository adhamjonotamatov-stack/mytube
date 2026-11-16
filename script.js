// 1. Google Cloud Console orqali YouTube Data API v3 kalitini oling.
// 2. Quyidagi matnni o'zingizning API kalitingizga almashtiring.
// 3. Kalitni faqat ruxsat etilgan HTTP referrer va YouTube Data API bilan cheklang.
// DIQQAT: Frontenddagi kalit foydalanuvchilarga ko'rinadi. Production uchun backend ishlating.
const API_KEY = "AIzaSyD8dasTk3GqvZzWnM2BKKXwL90z3rWqqMc";

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const container = document.getElementById("videoContainer");
const statusText = document.getElementById("status");
const searchSection = document.getElementById("searchSection");
const watchSection = document.getElementById("watchSection");
const playerContainer = document.getElementById("playerContainer");
const videoTitle = document.getElementById("videoTitle");
const channelName = document.getElementById("channelName");
const recommendations = document.getElementById("recommendations");
const recommendationStatus = document.getElementById("recommendationStatus");
const logo = document.getElementById("logo");
const backButton = document.getElementById("backButton");

let searchRequestId = 0;
let recommendationRequestId = 0;

// fetch() Promise qaytaradi. response.json() ham Promise qaytaradi.
function searchVideos(query) {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: "50",
    key: API_KEY,
  });

  return fetch(`https://www.googleapis.com/youtube/v3/search?${params}`).then(
    (response) => {
      if (!response.ok) {
        throw new Error(
          `YouTube API xatoligi (${response.status}). API kalit va quota'ni tekshiring.`,
        );
      }
      return response.json();
    },
  );
}

// Bir xil kartochka funksiyasi qidiruv va tavsiyalar uchun ishlaydi.
function createVideoCard(video, isRecommendation = false) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = isRecommendation ? "recommendation-card" : "video-card";

  const img = document.createElement("img");
  img.src =
    video.snippet.thumbnails?.medium?.url ||
    video.snippet.thumbnails?.default?.url ||
    "";
  img.alt = video.snippet.title;
  img.loading = "lazy";

  const info = document.createElement("div");
  info.className = isRecommendation ? "recommendation-info" : "video-info";
  const heading = document.createElement(isRecommendation ? "h4" : "h3");
  heading.textContent = video.snippet.title;
  const channel = document.createElement("p");
  channel.textContent = video.snippet.channelTitle;

  info.append(heading, channel);
  card.append(img, info);
  card.addEventListener("click", () => playVideo(video));
  return card;
}

function displayVideos(videos) {
  container.replaceChildren();
  if (videos.length === 0) {
    statusText.textContent = "Video topilmadi.";
    return;
  }
  videos.forEach((video) => container.append(createVideoCard(video)));
}

function playVideo(video) {
  const videoId = video.id.videoId;
  if (!videoId) return;

  // Eski tavsiya so'rovining natijasini e'tiborsiz qoldiramiz.
  ++recommendationRequestId;
  searchSection.classList.add("hidden");
  watchSection.classList.remove("hidden");
  statusText.textContent = "";
  videoTitle.textContent = video.snippet.title;
  channelName.textContent = video.snippet.channelTitle;

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  iframe.title = video.snippet.title;
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  playerContainer.replaceChildren(iframe);
  window.scrollTo({ top: 0, behavior: "smooth" });

  loadRecommendations(video);
}

function loadRecommendations(video) {
  const currentRequest = ++recommendationRequestId;
  recommendations.replaceChildren();
  recommendationStatus.textContent = "O‘xshash videolar yuklanmoqda...";

  // YouTube'ning shaxsiy tavsiya algoritmi emas:
  // tanlangan video sarlavhasi bo'yicha yangi qidiruv.
  searchVideos(video.snippet.title)
    .then((data) => {
      if (currentRequest !== recommendationRequestId) return;
      const filtered = (data.items || []).filter(
        (item) => item.id.videoId && item.id.videoId !== video.id.videoId,
      );
      if (filtered.length === 0) {
        recommendationStatus.textContent = "O‘xshash video topilmadi.";
        return;
      }
      filtered.forEach((item) =>
        recommendations.append(createVideoCard(item, true)),
      );
      recommendationStatus.textContent = "";
    })
    .catch((error) => {
      if (currentRequest !== recommendationRequestId) return;
      recommendationStatus.textContent = error.message;
    })
    .finally(() => {
      if (currentRequest === recommendationRequestId) {
        console.log("Tavsiyalar so‘rovi tugadi");
      }
    });
}

function showSearchResults() {
  ++recommendationRequestId;
  watchSection.classList.add("hidden");
  searchSection.classList.remove("hidden");
  playerContainer.replaceChildren(); // Videoni to'xtatadi.
  recommendationStatus.textContent = "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  if (API_KEY === "YOUR_YOUTUBE_API_KEY") {
    statusText.textContent =
      "Avval script.js ichiga YouTube API kalitingizni kiriting.";
    return;
  }

  const currentRequest = ++searchRequestId;
  showSearchResults();
  container.replaceChildren();
  statusText.textContent = "Videolar yuklanmoqda...";

  searchVideos(query)
    .then((data) => {
      if (currentRequest !== searchRequestId) return;
      displayVideos(data.items || []);
      if (container.children.length > 0) statusText.textContent = "";
    })
    .catch((error) => {
      if (currentRequest !== searchRequestId) return;
      statusText.textContent = error.message;
      console.error(error);
    })
    .finally(() => {
      if (currentRequest === searchRequestId) console.log("Qidiruv tugadi");
    });
});

backButton.addEventListener("click", showSearchResults);
logo.addEventListener("click", () => {
  ++searchRequestId;
  showSearchResults();
  statusText.textContent = "";
});
