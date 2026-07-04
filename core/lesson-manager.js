window.lessonManager = {
  async getLessons(category) {
    // ใช้ path แบบ root-relative (ขึ้นต้นด้วย "/") เพื่อให้ทำงานถูกไม่ว่าจะเรียกจากหน้าไหน
    // (ถ้าใช้ path แบบ relative เช่น "data/words.json" เบราว์เซอร์จะอิงตามโฟลดเชอร์ของหน้าที่เรียกใช้งาน)
    const res = await fetch("/data/words.json");
    const data = await res.json();

    const words = data.words.filter((w) => w.category === category);

    const lessons = [];

    // แบ่งคำศัพท์ทีละ 10 คำต่อบทเรียน หากคำที่เหลือไม่ครบ 10 คำ
    // จะไม่ถูกนำมาสร้างเป็นบทเรียน (ตัดทิ้ง)
    for (let i = 0; i + 10 <= words.length; i += 10) {
      lessons.push({
        lessonId: lessons.length + 1,
        words: words.slice(i, i + 10),
      });
    }

    return lessons;
  },

  async getLesson(category, lessonId) {
    const lessons = await this.getLessons(category);

    return lessons.find((l) => l.lessonId === lessonId);
  },
};
