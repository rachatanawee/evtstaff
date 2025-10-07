import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Configuration
const BASE_URL = 'http://localhost:3000'; // URL of your application

// --- Test Data ---
// Read employee_id from the k6/employee.txt file.
// k6 resolves file paths relative to the current working directory (CWD)
// where you run the `k6 run` command.
// Read employee IDs from the employee.txt file
const employeeIds = new SharedArray('employee-ids', function () {
  try {
    console.log('Attempting to read employee.txt file...');
    console.log('Current working directory:', __ENV.PWD);
    const fileContent = open(`${__ENV.PWD}/k6/employee.txt`);
    console.log('File content length:', fileContent.length);
    const ids = fileContent.split('\n').filter(id => id.trim() !== '');
    console.log('Number of employee IDs loaded:', ids.length);
    return ids;
  } catch (e) {
    console.error('Error reading employee.txt file:', e.message);
    return [];
  }
});

// The setup function runs once before the test starts.
export function setup() {
  if (employeeIds.length === 0) {
    throw new Error('Could not load employee IDs. Make sure k6/employee.txt exists and is not empty.');
  }

  // Step 1: Login to get session cookies for authenticated requests
  console.log('=== SETUP: Logging in to http://localhost:3000/en/login... ===');

  const loginPayload = JSON.stringify({
    email: 'admin@test.com',
    password: 'asdf1234'
  });

  const loginHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const loginRes = http.post(`${BASE_URL}/en/login`, loginPayload, {
    headers: loginHeaders,
  });

  // Check if login was successful
  if (loginRes.status !== 200) {
    console.error(`=== SETUP: Login failed! Status: ${loginRes.status}, Body: ${loginRes.body} ===`);
    throw new Error('Login failed, cannot proceed with the test.');
  }

  console.log('=== SETUP: Login successful. Session established. ===');
  return { loginCookies: loginRes.cookies };
}

// --- k6 Options ---
// Scenario: Simulate registration with a peak load.
export const options = {
  scenarios: {
    registration_load_test: {
      executor: 'ramping-vus',
      stages: [
        // 1. Ramp-up: Gradually increase Virtual Users (VUs) to 10 over 30 seconds.
        { duration: '30s', target: 10 },
        // 2. Peak Load: Stay at 10 VUs for 2 minutes to simulate the busiest period.
        { duration: '2m', target: 10 },
        // 3. Ramp-down: Gradually decrease VUs to 0.
        { duration: '30s', target: 0 },
      ],
      // Ensure setup runs only once
      startVUs: 0,
    },
  },
  thresholds: {
    // Define quality gates for the test.
    'http_req_failed': ['rate<0.01'], // HTTP errors should be less than 1%.
    'http_req_duration': ['p(95)<800'], // 95% of requests must complete below 800ms.
    'http_req_duration{status:200}': ['p(99)<1500'], // 99% of successful requests must complete below 1.5s.
  },
};

// --- Test Execution ---
// This is the main function that each Virtual User will execute repeatedly.
export default function (data) {
  // 1. Pick a random employee_id from the loaded data.
  const employeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];

  // 2. Create the payload for the registration.
  // The action expects a JSON string of an object with an `employee_id` property.
  const payload = JSON.stringify({ employee_id: employeeId });

  // 3. Define the necessary headers for a Next.js Server Action request.
  const headers = {
    'Content-Type': 'text/plain;charset=UTF-8',
    'Accept': 'text/x-component',
  };

  // 4. Send the POST request to the register page (which handles server actions).
  const res = http.post(`${BASE_URL}/th/register`, payload, {
    headers,
    cookies: data.loginCookies // Use the session cookies from setup
  });

  // 5. Check if the request was successful.
  check(res, {
    'is status 200': (r) => r.status === 200,
    'response is successful (starts with "1:")': (r) => r.body && r.body.startsWith('1:'),
  });

  // Wait for 1 second before the next iteration to simulate realistic user behavior.
  sleep(1);
}
