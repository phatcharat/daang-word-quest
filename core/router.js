
const ROUTES = {
  login: {
    html: "components/auth/auth.html",
    css:  ["components/auth/auth.css"],
    js:   ["components/auth/auth.js"],
    init: "initAuthScreen",
  },
  home: {
  html: "components/home/home.html",
    css: [
      "components/home/home.css",
      "components/home/bottom-nav.css"],
    js: ["components/home/home.js"],
    init: "initHomeScreen",
  },
  game: {
    html: "components/game/game.html",
    css:  ["components/game/game.css"],
    js:   ["components/game/game.js"],
    init: "initGameScreen",
  },
  result: {
    html: "components/result/result.html",
    css:  ["components/result/result.css"],
    js:   ["components/result/result.js"],
    init: "initResultScreen",
  },
  leaderboard: {
    html: "components/leaderboard/leaderboard.html",
    css:  ["components/leaderboard/leaderboard.css", "components/home/bottom-nav.css"],
    js:   ["components/leaderboard/leaderboard.js"],
    init: "initLeaderboardScreen",
  },
  profile: {
    html: "components/profile/profile.html",
    css:  ["components/profile/profile.css", "components/home/bottom-nav.css"],
    js:   ["components/profile/profile.js"],
    init: "initProfileScreen",
  },
};

// ----- ติดตามว่า css ไหน inject ไปแล้วบ้าง (กันใส่ซ้ำ) -----
const _loadedCss = new Set();

// ----- ติดตามว่า js ไหนโหลดแล้วบ้าง (กัน fetch ซ้ำ, function จะถูก redefine ได้ไม่เป็นไร) -----
const _loadedJs = new Set();

/**
 * นำทางไปหน้าที่ระบุ
 * @param {string} routeName - key ใน ROUTES เช่น "home", "game"
 */
async function navigateTo(routeName) {
  const route = ROUTES[routeName];
  if (!route) {
    console.error(`ไม่พบ route: "${routeName}" — ตรวจสอบชื่อใน core/router.js`);
    return;
  }

  const app = document.getElementById("app");
  if (!app) {
    console.error('ไม่พบ <div id="app"> ใน index.html');
    return;
  }

  try {
    // 1. โหลด CSS ของหน้านี้ (ถ้ายังไม่เคยโหลด)
    route.css.forEach(injectCssOnce);

    // 2. โหลด HTML แล้ว inject เข้า DOM
    const htmlText = await fetch(route.html).then(res => {
      if (!res.ok) throw new Error(`โหลด ${route.html} ไม่สำเร็จ (${res.status})`);
      return res.text();
    });
    app.innerHTML = htmlText;

    // 3. โหลด JS ของหน้านี้ (ถ้ายังไม่เคยโหลด) แล้วรอให้โหลดเสร็จก่อนเรียก init
    for (const jsPath of route.js) {
      await loadScriptOnce(jsPath);
    }

    // 4. เรียกฟังก์ชัน init ของหน้านั้น (เช่น initHomeScreen())
    if (route.init && typeof window[route.init] === "function") {
      window[route.init]();
    } else {
      console.warn(`ไม่พบฟังก์ชัน ${route.init}() — ตรวจสอบว่า ${route.js} ประกาศฟังก์ชันนี้ไว้`);
    }

    // เก็บ route ปัจจุบันไว้เผื่อใช้ (เช่นปุ่ม back)
    window.appState.currentRoute = routeName;

  } catch (err) {
    console.error("navigateTo() ผิดพลาด:", err);
    app.innerHTML = `<div style="padding:40px;text-align:center;color:#C0392B;">
      เกิดข้อผิดพลาดในการโหลดหน้า "${routeName}"<br>
      <small>${err.message}</small>
    </div>`;
  }
}

// ----- Helper: inject <link rel="stylesheet"> ครั้งเดียวต่อไฟล์ -----
function injectCssOnce(href) {
  if (_loadedCss.has(href)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  _loadedCss.add(href);
}

// ----- Helper: โหลด <script> ครั้งเดียวต่อไฟล์ คืนค่าเป็น Promise -----
function loadScriptOnce(src) {
  if (_loadedJs.has(src)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      _loadedJs.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`โหลด script ${src} ไม่สำเร็จ`));
    document.body.appendChild(script);
  });
}