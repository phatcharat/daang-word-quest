window.lessonManager = {

    async getLessons(category) {

        const res = await fetch("data/words.json");
        const data = await res.json();

        const words = data.words.filter(
            w => w.category === category
        );

        const lessons = [];

        for(let i = 0; i < words.length; i += 10){

            lessons.push({
                lessonId: lessons.length + 1,
                words: words.slice(i, i + 10)
            });

        }

        return lessons;
    },

    async getLesson(category, lessonId){

        const lessons =
            await this.getLessons(category);

        return lessons.find(
            l => l.lessonId === lessonId
        );
    }

};