const mongoose = require('mongoose');
const Student = require('../models/Student');

/**
 * Validates whether an identifier is a valid studentId format or MongoDB ObjectId
 */
const isValidStudentId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Valid MongoDB ObjectId (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) return true;
  // Valid studentId format (e.g. STU-XXXXXXXX)
  if (/^STU-[A-Za-z0-9_-]+$/i.test(trimmed)) return true;
  return false;
};

/**
 * Helper to build query by studentId or fallback to _id
 */
const getStudentQuery = (id) => {
  const trimmedId = id.trim();
  return /^[0-9a-fA-F]{24}$/.test(trimmedId)
    ? { $or: [{ studentId: trimmedId }, { _id: trimmedId }] }
    : { studentId: trimmedId };
};

/**
 * @desc    Create a new student
 * @route   POST /api/students
 * @access  Public
 */
const createStudent = async (req, res, next) => {
  try {
    const { fullName, email, course, age } = req.body || {};

    const student = await Student.create({
      fullName,
      email,
      course,
      age
    });

    return res.status(201).json({
      status: 'success',
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    // Duplicate email error (MongoDB duplicate key error code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A student with this email address already exists'
      });
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('; ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid input: ${error.message}`
      });
    }

    next(error);
  }
};

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Public
 */
const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single student by studentId (or MongoDB _id)
 * @route   GET /api/students/:id
 * @access  Public
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid student identifier'
      });
    }

    const trimmedId = id.trim();

    if (!isValidStudentId(trimmedId)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid student identifier format: '${trimmedId}'. Must be a valid studentId (e.g. STU-XXXXXXXX) or MongoDB ObjectId.`
      });
    }

    const query = getStudentQuery(trimmedId);
    const student = await Student.findOne(query);

    if (!student) {
      return res.status(404).json({
        status: 'fail',
        message: `Student with ID '${trimmedId}' not found`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: student
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid identifier format: ${req.params.id}`
      });
    }

    next(error);
  }
};

/**
 * @desc    Update a student's fullName, email, course, and age
 * @route   PUT /api/students/:id
 * @access  Public
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid student identifier'
      });
    }

    const trimmedId = id.trim();

    if (!isValidStudentId(trimmedId)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid student identifier format: '${trimmedId}'. Must be a valid studentId (e.g. STU-XXXXXXXX) or MongoDB ObjectId.`
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide fields to update'
      });
    }

    const query = getStudentQuery(trimmedId);
    const student = await Student.findOne(query);

    if (!student) {
      return res.status(404).json({
        status: 'fail',
        message: `Student with ID '${trimmedId}' not found`
      });
    }

    const { fullName, email, course, age } = req.body;

    if (fullName !== undefined) student.fullName = fullName;
    if (email !== undefined) student.email = email;
    if (course !== undefined) student.course = course;
    if (age !== undefined) student.age = age;

    const updatedStudent = await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    // Duplicate email error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        message: 'A student with this email address already exists'
      });
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join('; ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid input: ${error.message}`
      });
    }

    next(error);
  }
};

/**
 * @desc    Delete a student by studentId (or MongoDB _id)
 * @route   DELETE /api/students/:id
 * @access  Public
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid student identifier'
      });
    }

    const trimmedId = id.trim();

    if (!isValidStudentId(trimmedId)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid student identifier format: '${trimmedId}'. Must be a valid studentId (e.g. STU-XXXXXXXX) or MongoDB ObjectId.`
      });
    }

    const query = getStudentQuery(trimmedId);
    const student = await Student.findOneAndDelete(query);

    if (!student) {
      return res.status(404).json({
        status: 'fail',
        message: `Student with ID '${trimmedId}' not found`
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Student deleted successfully',
      data: student
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid identifier format: ${req.params.id}`
      });
    }

    next(error);
  }
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
