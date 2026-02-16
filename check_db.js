require('dotenv').config();
const mongoose = require('mongoose');

async function checkChapters() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    
    // Define a simple schema just to read
    const Chapter = mongoose.model('Chapter', new mongoose.Schema({ title: String }));
    const chapters = await Chapter.find({});
    
    console.log('--- CHAPTERS IN DB ---');
    chapters.forEach(c => {
      console.log(`ID: ${c._id}, Title: ${c.title}`);
    });
    
    const questions = await mongoose.connection.db.collection('questions').find({}).toArray();
    console.log('\n--- QUESTIONS IN DB ---');
    console.log('Total Questions:', questions.length);
    if (questions.length > 0) {
      console.log('Last 3 questions sample:');
      questions.slice(-3).forEach(q => {
        console.log(`- ${q.question.substring(0, 50)}... (Chapter: ${q.chapterId}, Quiz: ${q.quizId})`);
      });
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkChapters();
