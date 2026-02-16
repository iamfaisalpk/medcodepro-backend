const mongoose = require('mongoose');

async function fix() {
  try {
    await mongoose.connect('mongodb+srv://iamfaizy123:edumentorai123@cluster0.kjxekzv.mongodb.net/medcodepro?retryWrites=true&w=majority&appName=Cluster0');
    
    // Initialize user with some starter stats so dashboard isn't empty
    await mongoose.connection.db.collection('users').updateOne(
      { email: 'edumentorai123@gmail.com' },
      { 
        $set: { 
          xp: 250, 
          level: 1, 
          rank: 'Novice Coder' 
        } 
      }
    );
    
    console.log('User stats initialized');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
