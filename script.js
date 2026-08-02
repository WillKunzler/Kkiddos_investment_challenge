const csvURL =
  "https://docs.google.com/spreadsheets/d/1auC8DsC2LZAxYtAmPQWrzQC4GFns69ILou9yYOBQqh0/edit?usp=sharing";

const REFRESH_MS = 5 * 60 * 1000;
const medals = ["🥇", "🥈", "🥉", "🏅"];
const classes = ["first", "second", "third", "fourth"];
const ordinal = ["1st place", "2nd place", "3rd place", "4th place"];

function cleanMoney(value) {
  return Number(String(value ?? "")
    .replace(/[^0-9.-]/g, "")) || 0;
}

function currency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

function normalizeDate(value) {
  if (!value) return "Not yet recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function setStatus(text, isError = false) {
  const status = document.getElementById("status");
  status.textContent = text;
  status.classList.toggle("error", isError);
}

async function loadLeaderboard() {
  const cards = document.getElementById("cards");
  const updated = document.getElementById("updated");
  const banner = document.getElementById("leader-banner");

  setStatus("Refreshing");

  try {
    const response = await fetch(`${csvURL}&cacheBust=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Google Sheets returned ${response.status}`);
    }

    const csv = await response.text();

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim()
    });

    if (parsed.errors.length) {
      console.warn("CSV warnings:", parsed.errors);
    }

    let players = parsed.data
      .map(row => ({
        name: String(row.Child ?? row.Name ?? "").trim(),
        balance: cleanMoney(row.Balance),
        rank: Number(row.Rank) || null,
        medal: String(row.Medal ?? "").trim(),
        updated: String(row["Last Updated"] ?? "").trim()
      }))
      .filter(player => player.name);

    if (!players.length) {
      throw new Error("No participant rows were found in the Dashboard Feed.");
    }

    players.sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      return b.balance - a.balance;
    });

    cards.innerHTML = players.slice(0, 4).map((player, index) => `
      <article class="card ${classes[index]}" style="animation-delay:${index * 70}ms">
        <div class="place" aria-hidden="true">${player.medal || medals[index]}</div>
        <div class="person">
          <div class="rank">${ordinal[index]}</div>
          <div class="name">${escapeHtml(player.name)}</div>
        </div>
        <div class="balance">${currency(player.balance)}</div>
      </article>
    `).join("");

    const leader = players[0];
    banner.classList.remove("is-loading");
    banner.querySelector(".leader-name").textContent = leader.name;
    banner.querySelector(".leader-balance").textContent = currency(leader.balance);

    const sheetTimestamp =
      players.find(player => player.updated)?.updated || "";

    updated.textContent = normalizeDate(sheetTimestamp);
    setStatus("Live");
  } catch (error) {
    console.error(error);
    cards.innerHTML = `
      <div class="error-card">
        <strong>Unable to load the leaderboard</strong>
        <span>${escapeHtml(error.message)}</span>
      </div>
    `;
    updated.textContent = "Unavailable";
    banner.querySelector(".leader-name").textContent = "Data unavailable";
    banner.querySelector(".leader-balance").textContent = "";
    setStatus("Connection error", true);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

loadLeaderboard();
setInterval(loadLeaderboard, REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadLeaderboard();
});
