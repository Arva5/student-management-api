const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Student Mongoose Schema
 */
const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: () => 'STU-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      unique: true,
      trim: true
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age cannot exceed 120']
    }
  },
  {
    timestamps: true
  }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
