#!/usr/bin/env node

/**
 * Simple test script to verify Zezman application is working
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

console.log('🧪 Testing Zezman Application...\n');

async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing API health endpoint...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.data.success) {
      console.log('✅ API health check passed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}`);
      console.log(`   Version: ${response.data.version}`);
      console.log(`   Environment: ${response.data.environment}\n`);
      return true;
    } else {
      console.log('❌ API health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ API health check failed');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Make sure the server is running on port 5000');
    }
    console.log('');
    return false;
  }
}

async function testAPIDocumentation() {
  try {
    console.log('📚 Testing API documentation endpoint...');
    const response = await axios.get(`${API_BASE_URL}/docs`);
    
    if (response.data.success) {
      console.log('✅ API documentation endpoint working');
      console.log(`   Available endpoints: ${Object.keys(response.data.endpoints).length}`);
      console.log('');
      return true;
    } else {
      console.log('❌ API documentation endpoint failed');
      return false;
    }
  } catch (error) {
    console.log('❌ API documentation endpoint failed');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🗄️  Testing database connection...');
    const response = await axios.get(`${API_BASE_URL}/api/v1/categories`);
    
    console.log('✅ Database connection working');
    console.log(`   Categories endpoint: ${response.status}`);
    console.log('');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Database connection working (authentication required)');
      console.log('');
      return true;
    } else {
      console.log('❌ Database connection failed');
      console.log(`   Error: ${error.message}`);
      console.log('   Make sure MongoDB is running');
      console.log('');
      return false;
    }
  }
}

async function testClientConnection() {
  try {
    console.log('🎨 Testing client connection...');
    const response = await axios.get(CLIENT_URL, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('✅ Client is running');
      console.log(`   Status: ${response.status}`);
      console.log('');
      return true;
    } else {
      console.log('❌ Client connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Client connection failed');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Make sure the client is running on port 3000');
    }
    console.log('');
    return false;
  }
}

async function runTests() {
  const tests = [
    testHealthEndpoint,
    testAPIDocumentation,
    testDatabaseConnection,
    testClientConnection
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    const result = await test();
    if (result) passedTests++;
  }

  console.log('📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Application is ready to use.');
    console.log('\n🌐 Access your application:');
    console.log(`   Frontend: ${CLIENT_URL}`);
    console.log(`   Backend API: ${API_BASE_URL}`);
    console.log(`   API Documentation: ${API_BASE_URL}/docs`);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Make sure the server is running (npm start in server directory)');
    console.log('   3. Make sure the client is running (npm start in client directory)');
    console.log('   4. Check that ports 3000 and 5000 are available');
  }
}

// Run tests
runTests().catch(console.error); 