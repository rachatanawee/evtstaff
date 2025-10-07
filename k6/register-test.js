import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

// --- Configuration ---
// Replace with your actual API base URL
const API_BASE_URL = 'https://localhost:3000';

// Credentials for login
const LOGIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'asdf1234',
};

// Load employee IDs from the text file into a SharedArray.
// This ensures the file is read only once.
const employeeData = new SharedArray('employeeIDs', function () {
  // The file path is relative to the current working directory when you run k6.
  // Make sure to run k6 from the 'eventify-staff' directory or provide an absolute path.
  return open('./k6/employee.txt').split('\n').filter(id => id.trim() !== '');
});

export const options = {
  scenarios: {
    register_employees: {
      executor: 'per-vu-iterations',
      vus: 10, // Number of virtual users to run concurrently
      iterations: Math.ceil(employeeData.length / 10), // Each VU will run this many iterations
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    'http_req_duration{group:::login}': ['p(95)<1000'], // 95% of login requests should be below 1s
    'http_req_duration{group:::register}': ['p(95)<500'], // 95% of register requests should be below 500ms
  },
};

// setup() function runs once before the VUs start.
// It's used here to log in and get an authentication token.
export function setup() {
  const loginUrl = `${API_BASE_URL}/api/auth/login`;
  const res = http.post(loginUrl, JSON.stringify(LOGIN_CREDENTIALS), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Check if login was successful and a token was received
  check(res, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  // Extract the token and return it, so it can be used in the VU code.
  const authToken = res.json('accessToken');
  return { authToken: authToken };
}

// default() function is the main VU code.
// It receives the data returned from setup().
export default function (data) {
  if (!data.authToken) {
    exec.test.abort('Aborting test: Could not obtain auth token in setup.');
  }

  // Calculate the index for the employee ID to ensure each iteration gets a unique ID
  const employeeIndex = exec.scenario.iterationInTest;
  if (employeeIndex >= employeeData.length) {
    return; // Stop if we have run out of employee IDs
  }
  const employeeId = employeeData[employeeIndex];

  const registerUrl = `${API_BASE_URL}/api/staff/register`;
  const payload = JSON.stringify({ employeeId: employeeId });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.authToken}`,
    },
  };

  const registerRes = http.post(registerUrl, payload, params, { tags: { group: 'register' } });
  check(registerRes, { 'registration successful (201 Created)': (r) => r.status === 201 });

  sleep(1); // Wait for 1 second between registrations
}