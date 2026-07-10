// ===== core/quiz-manager.js =====
// จัดการข้อมูลบทเรียนสำหรับโหมด Quiz 4 ตัวเลือก
// ต่างจาก lesson-manager.js ตรงที่ "ไม่แบ่งตามหมวดหมู่" แต่รวมคำทุกหมวดเข้าด้วยกัน
// แล้วสลับลำดับด้วย seed คงที่ (fix ไว้) เพื่อให้บทที่ 1, 2, 3... มีคำเดิมทุกครั้งที่เข้าเล่น

const QUIZ_SEED = 20250115; // เลข seed คงที่ ห้ามเปลี่ยน ไม่งั้นบทเรียนเก่าจะสลับคำใหม่หมด

// ตัวสุ่มเลขแบบ deterministic (ผลลัพธ์เดิมทุกครั้งถ้า seed เดิม)
function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// สลับลำดับ array ด้วย Fisher-Yates โดยใช้ตัวสุ่มที่ fix seed ไว้
function seededShuffle(array, seed) {
  const result = [...array];
  const random = mulberry32(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

window.quizManager = {
  _cache: null,

  // โหลดคำศัพท์ทั้งหมด (ทุกหมวดรวมกัน) แล้วสลับลำดับครั้งเดียว เก็บ cache ไว้ใช้ซ้ำ
  async _loadShuffledWords() {
    if (this._cache) return this._cache;

    const res = await fetch("/data/words.json");
    const data = await res.json();

    // ตัดคำที่ข้อมูลไม่ครบทิ้ง (บางแถวใน words.json เป็นช่องว่างล้วน)
    const validWords = data.words.filter((w) => w.thai && w.daang && w.category);

    this._cache = seededShuffle(validWords, QUIZ_SEED);
    return this._cache;
  },

  // แบ่งคำที่สลับแล้วออกเป็นบทเรียนละ 10 คำ
  // 5 คำแรกของแต่ละบท = โจทย์แบบ "คำดาอาง → ทายไทย" (qType: word2thai)
  // 5 คำหลังของแต่ละบท = โจทย์แบบ "ภาพ → ทายดาอาง" (qType: image2daang)
  async getLessons() {
    const words = await this._loadShuffledWords();
    const lessons = [];

    for (let i = 0; i + 10 <= words.length; i += 10) {
      const chunk = words.slice(i, i + 10);
      const taggedWords = chunk.map((w, idx) => ({
        ...w,
        qType: idx < 5 ? "word2thai" : "image2daang",
      }));

      lessons.push({
        lessonId: lessons.length + 1,
        words: taggedWords,
      });
    }

    return lessons;
  },

  async getLesson(lessonId) {
    const lessons = await this.getLessons();
    return lessons.find((l) => l.lessonId === Number(lessonId));
  },

  // สุ่มตัวเลือกผิด 3 ตัว จากคำทั้งหมด (ทุกหมวด) มาผสมกับคำตอบถูก 1 ตัว แล้วสลับตำแหน่ง
  async generateChoices(correctWord, qType) {
    const pool = await this._loadShuffledWords();
    const correctValue = qType === "word2thai" ? correctWord.thai : correctWord.daang;

    const candidateValues = pool
      .filter((w) => w.id !== correctWord.id)
      .map((w) => (qType === "word2thai" ? w.thai : w.daang));

    // กันค่าซ้ำกันเอง และกันซ้ำกับคำตอบถูก
    const uniqueCandidates = [...new Set(candidateValues)].filter(
      (val) => val !== correctValue,
    );

    const shuffledCandidates = uniqueCandidates.sort(() => Math.random() - 0.5);
    const wrongChoices = shuffledCandidates.slice(0, 3);

    return [...wrongChoices, correctValue].sort(() => Math.random() - 0.5);
  },
};