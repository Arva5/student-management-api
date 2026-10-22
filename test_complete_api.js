const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const express = require('express');
const studentRoutes = require('./src/routes/studentRoutes');
const healthRoutes = require('./src/routes/health.routes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');
const Student = require('./src/models/Student');
const http = require('http');

async function runTestSuite() {
  console.log('========================================================');
  console.log('STARTING ACTUAL MONGODB DATABASE END-TO-END TEST SUITE');
  console.log('========================================================');

  // 1. Spin up actual MongoDB instance
  console.log('\n[1/7] Launching actual MongoDB Database instance...');
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log(`[Database] Actual MongoDB instance running at: ${mongoUri}`);

  // 2. Connect Mongoose to actual MongoDB database
  console.log('\n[2/7] Connecting Mongoose to actual MongoDB instance...');
  await mongoose.connect(mongoUri);
  console.log(`[Database] Mongoose successfully connected to actual MongoDB!`);

  // Ensure unique indexes are built in MongoDB
  await Student.init();
  console.log(`[Database] Student schema indexes built successfully in actual MongoDB.`);

  // 3. Initialize Express Application
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/health', healthRoutes);
  app.use('/api/students', studentRoutes);
  app.use(notFound);
  app.use(errorHandler);

  // 4. Start HTTP Server
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/students`;
  console.log(`[Server] Express test server listening on port ${port}`);

  // HTTP helper
  const request = (url, options = {}, body = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  const results = [];
  const recordTest = (name, passed, details) => {
    results.push({ name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} - ${name}`);
    if (details) console.log(`   Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
  };

  try {
    console.log('\n========================================================');
    console.log('TESTING POST /api/students');
    console.log('========================================================');

    // Test 1: POST valid student 1
    const s1Res = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Johnathan Doe',
      email: 'john.doe@example.com',
      course: 'Computer Science',
      age: 21
    });
    const s1 = s1Res.body.data;
    recordTest(
      'POST /api/students: Create student 1 (201 Created)',
      s1Res.status === 201 && s1 && s1.studentId.startsWith('STU-') && s1.fullName === 'Johnathan Doe',
      { status: s1Res.status, studentId: s1?.studentId, email: s1?.email }
    );

    // Test 2: POST valid student 2
    const s2Res = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Sarah Connor',
      email: 'sarah.c@example.com',
      course: 'Cybernetics',
      age: 28
    });
    const s2 = s2Res.body.data;
    recordTest(
      'POST /api/students: Create student 2 (201 Created)',
      s2Res.status === 201 && s2 && s2.studentId.startsWith('STU-'),
      { status: s2Res.status, studentId: s2?.studentId }
    );

    // Test 3: POST missing required fields
    const missingRes = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'Incomplete Person' });
    recordTest(
      'POST /api/students: Missing required fields (400 Bad Request)',
      missingRes.status === 400 && missingRes.body.status === 'fail',
      { status: missingRes.status, message: missingRes.body.message }
    );

    // Test 4: POST invalid email format
    const badEmailRes = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Bad Email',
      email: 'not-an-email',
      course: 'Math',
      age: 20
    });
    recordTest(
      'POST /api/students: Invalid email format (400 Bad Request)',
      badEmailRes.status === 400 && badEmailRes.body.message.includes('valid email'),
      { status: badEmailRes.status, message: badEmailRes.body.message }
    );

    // Test 5: POST age out of range (< 1 and > 120)
    const badAgeRes = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Ancient Person',
      email: 'ancient@example.com',
      course: 'Archaeology',
      age: 150
    });
    recordTest(
      'POST /api/students: Age out of range > 120 (400 Bad Request)',
      badAgeRes.status === 400 && badAgeRes.body.message.includes('cannot exceed 120'),
      { status: badAgeRes.status, message: badAgeRes.body.message }
    );

    // Test 6: POST duplicate email (409 Conflict) in actual MongoDB
    const dupRes = await request(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Imposter John',
      email: 'john.doe@example.com', // same email as s1
      course: 'Physics',
      age: 22
    });
    recordTest(
      'POST /api/students: Duplicate email conflict (409 Conflict in MongoDB)',
      dupRes.status === 409 && dupRes.body.status === 'fail' && dupRes.body.message.includes('already exists'),
      { status: dupRes.status, message: dupRes.body.message }
    );

    console.log('\n========================================================');
    console.log('TESTING GET /api/students');
    console.log('========================================================');

    // Test 7: GET all students
    const getAllRes = await request(baseUrl, { method: 'GET' });
    recordTest(
      'GET /api/students: Retrieve all students (200 OK)',
      getAllRes.status === 200 && getAllRes.body.count === 2 && Array.isArray(getAllRes.body.data),
      { status: getAllRes.status, count: getAllRes.body.count }
    );

    console.log('\n========================================================');
    console.log('TESTING GET /api/students/:id');
    console.log('========================================================');

    // Test 8: GET by valid studentId
    const getByIdRes = await request(`${baseUrl}/${s1.studentId}`, { method: 'GET' });
    recordTest(
      'GET /api/students/:id: Fetch student by studentId (200 OK)',
      getByIdRes.status === 200 && getByIdRes.body.data.studentId === s1.studentId,
      { status: getByIdRes.status, fullName: getByIdRes.body.data?.fullName }
    );

    // Test 9: GET by MongoDB _id
    const getByMongoIdRes = await request(`${baseUrl}/${s1._id}`, { method: 'GET' });
    recordTest(
      'GET /api/students/:id: Fetch student by MongoDB _id (200 OK)',
      getByMongoIdRes.status === 200 && getByMongoIdRes.body.data._id === s1._id,
      { status: getByMongoIdRes.status, _id: getByMongoIdRes.body.data?._id }
    );

    // Test 10: GET nonexistent student (valid format but not found)
    const getNotFoundRes = await request(`${baseUrl}/STU-99999999`, { method: 'GET' });
    recordTest(
      'GET /api/students/:id: Nonexistent studentId (404 Not Found)',
      getNotFoundRes.status === 404 && getNotFoundRes.body.status === 'fail',
      { status: getNotFoundRes.status, message: getNotFoundRes.body.message }
    );

    // Test 11: GET invalid ID format
    const getInvalidIdRes = await request(`${baseUrl}/invalid-id-format`, { method: 'GET' });
    recordTest(
      'GET /api/students/:id: Invalid ID format (400 Bad Request)',
      getInvalidIdRes.status === 400 && getInvalidIdRes.body.status === 'fail',
      { status: getInvalidIdRes.status, message: getInvalidIdRes.body.message }
    );

    console.log('\n========================================================');
    console.log('TESTING PUT /api/students/:id');
    console.log('========================================================');

    // Test 12: PUT update success
    const putSuccessRes = await request(`${baseUrl}/${s1.studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Johnathan Doe Updated',
      course: 'Artificial Intelligence',
      age: 23
    });
    recordTest(
      'PUT /api/students/:id: Update fields (200 OK)',
      putSuccessRes.status === 200 &&
      putSuccessRes.body.data.fullName === 'Johnathan Doe Updated' &&
      putSuccessRes.body.data.course === 'Artificial Intelligence' &&
      putSuccessRes.body.data.age === 23,
      { status: putSuccessRes.status, updated: putSuccessRes.body.data }
    );

    // Test 13: PUT validation error (age > 120)
    const putBadAgeRes = await request(`${baseUrl}/${s1.studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { age: 130 });
    recordTest(
      'PUT /api/students/:id: Validation error (400 Bad Request)',
      putBadAgeRes.status === 400 && putBadAgeRes.body.message.includes('cannot exceed 120'),
      { status: putBadAgeRes.status, message: putBadAgeRes.body.message }
    );

    // Test 14: PUT duplicate email conflict (try updating s1 email to s2 email)
    const putDupRes = await request(`${baseUrl}/${s1.studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { email: s2.email });
    recordTest(
      'PUT /api/students/:id: Duplicate email conflict (409 Conflict in MongoDB)',
      putDupRes.status === 409 && putDupRes.body.message.includes('already exists'),
      { status: putDupRes.status, message: putDupRes.body.message }
    );

    // Test 15: PUT nonexistent student
    const putNotFoundRes = await request(`${baseUrl}/STU-99999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'No Body' });
    recordTest(
      'PUT /api/students/:id: Nonexistent student (404 Not Found)',
      putNotFoundRes.status === 404,
      { status: putNotFoundRes.status, message: putNotFoundRes.body.message }
    );

    // Test 16: PUT invalid ID format
    const putInvalidIdRes = await request(`${baseUrl}/invalid-id-format`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { fullName: 'No Body' });
    recordTest(
      'PUT /api/students/:id: Invalid ID format (400 Bad Request)',
      putInvalidIdRes.status === 400,
      { status: putInvalidIdRes.status, message: putInvalidIdRes.body.message }
    );

    console.log('\n========================================================');
    console.log('TESTING DELETE /api/students/:id');
    console.log('========================================================');

    // Test 17: DELETE nonexistent student
    const delNotFoundRes = await request(`${baseUrl}/STU-99999999`, { method: 'DELETE' });
    recordTest(
      'DELETE /api/students/:id: Nonexistent student (404 Not Found)',
      delNotFoundRes.status === 404,
      { status: delNotFoundRes.status, message: delNotFoundRes.body.message }
    );

    // Test 18: DELETE invalid ID format
    const delInvalidIdRes = await request(`${baseUrl}/invalid-id-format`, { method: 'DELETE' });
    recordTest(
      'DELETE /api/students/:id: Invalid ID format (400 Bad Request)',
      delInvalidIdRes.status === 400,
      { status: delInvalidIdRes.status, message: delInvalidIdRes.body.message }
    );

    // Test 19: DELETE student 1 success
    const delSuccessRes = await request(`${baseUrl}/${s1.studentId}`, { method: 'DELETE' });
    recordTest(
      'DELETE /api/students/:id: Delete student (200 OK)',
      delSuccessRes.status === 200 && delSuccessRes.body.message.includes('deleted'),
      { status: delSuccessRes.status, message: delSuccessRes.body.message }
    );

    // Test 20: Verify deleted student is no longer found (GET returns 404)
    const verifyDelRes = await request(`${baseUrl}/${s1.studentId}`, { method: 'GET' });
    recordTest(
      'GET /api/students/:id: Confirm student deletion in MongoDB (404 Not Found)',
      verifyDelRes.status === 404,
      { status: verifyDelRes.status, message: verifyDelRes.body.message }
    );

    // Test 21: Verify student list has exactly 1 remaining student
    const finalCountRes = await request(baseUrl, { method: 'GET' });
    recordTest(
      'GET /api/students: Final collection count in MongoDB is 1 (200 OK)',
      finalCountRes.status === 200 && finalCountRes.body.count === 1,
      { count: finalCountRes.body.count }
    );

  } finally {
    // Teardown
    console.log('\n========================================================');
    console.log('CLEANING UP RESOURCES');
    console.log('========================================================');
    await new Promise(r => server.close(r));
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Server and actual MongoDB instance stopped cleanly.');
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\nTEST SUMMARY: ${passedCount}/${results.length} tests passed.`);
  if (passedCount === results.length) {
    console.log('🎉 ALL TESTS PASSED AGAINST ACTUAL MONGODB DATABASE!');
    process.exit(0);
  } else {
    console.error('💥 SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
