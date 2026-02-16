require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function debug() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI not found');
    }
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.useDb('medcodepro');
    
    const chapters = await db.collection('chapters').find({}).toArray();
    const questions = await db.collection('questions').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    
    const output = {
      chapters: chapters.map(c => ({ id: c._id, title: c.title, order: c.order })),
      questions: questions.map(q => ({ id: q._id, question: q.question.substring(0, 30), chapterId: q.chapterId, quizId: q.quizId })),
      users: users.map(u => ({ id: u._id, email: u.email, role: u.role }))
    };
    
    fs.writeFileSync('db_debug.json', JSON.stringify(output, null, 2));
    console.log('Saved to db_debug.json');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
