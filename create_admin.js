require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const mongoUri = process.env.MONGODB_URI;
  const adminEmail = process.env.ADMIN_EMAIL || 'edumentorai123@gmail.com'; 
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!mongoUri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // Define Schema manually to avoid TS issues in JS script
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, default: 'student' },
      isVerified: { type: Boolean, default: true }
    });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if user exists
    let admin = await User.findOne({ email: adminEmail });
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (admin) {
      console.log('Admin already exists. Updating password...');
      admin.password = hashedPassword;
      admin.role = 'admin';
      admin.isVerified = true;
      await admin.save();
    } else {
      console.log('Creating new admin user...');
      await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
    }

    console.log('-----------------------------------');
    console.log('Admin User Ready!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('-----------------------------------');
    console.log('Please login with these credentials.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Operation failed:', err);
    process.exit(1);
  }
}

createAdmin();
