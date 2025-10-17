import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

// --- Configuration ---
const BASE_URL = 'http://localhost:3000'; // ใช้ http สำหรับ development
const LOCALE = 'th'; // หรือ 'en' ตามที่ต้องการ

// Login credentials
const LOGIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'asdf1234',
};

// Load employee IDs from the text file into a SharedArray.
const employeeData = new SharedArray('employeeIDs', function () {
  return open('./employee.txt').split('\n').filter(id => id.trim() !== '');
});

export const options = {
  scenarios: {
    register_employees: {
      executor: 'constant-arrival-rate', // เปลี่ยนเป็น constant arrival rate สำหรับวัด RPS
      rate: 10, // 50 requests ต่อวินาที
      timeUnit: '1s',
      duration: '100s', // ทดสอบ 30 วินาที
      preAllocatedVUs: 20,
      maxVUs: 30,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // error rate น้อยกว่า 1%
    'http_req_duration{group:::login}': ['p(95)<2000'], // 95% ของ login requests ต่ำกว่า 2s
    'http_req_duration{group:::register}': ['p(95)<1000'], // 95% ของ register requests ต่ำกว่า 1s
  },
};

// Setup function - login และได้ authentication token
export function setup() {
  console.log('Setting up test - attempting login...');

  // เข้า login page ก่อน
  const loginPageRes = http.get(`${BASE_URL}/${LOCALE}/login`);
  check(loginPageRes, {
    'login page loaded': (r) => r.status === 200,
  });

  // Login โดยส่ง form data
  const loginRes = http.post(`${BASE_URL}/${LOCALE}/login`, LOGIN_CREDENTIALS, {
    headers: { 'Content-Type': 'application/json' },
    tags: { group: 'login' }
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 302, // 302 คือ redirect หลัง login สำเร็จ
  });

  console.log('Login response status:', loginRes.status);
  console.log('Login response headers:', loginRes.headers);

  return {
    authToken: 'authenticated', // ใช้เป็น flag ว่าลogin แล้ว
    cookies: loginRes.cookies // เก็บ cookies สำหรับ session
  };
}

// Main VU function
export default function (data) {
  // Calculate the index for the employee ID to ensure each iteration gets a unique ID
  const employeeIndex = exec.scenario.iterationInTest;
  if (employeeIndex >= employeeData.length) {
    return; // Stop if we have run out of employee IDs
  }
  const employeeId = employeeData[employeeIndex];

  console.log(`Processing employee ID: ${employeeId}`);

  // สร้าง QR code data ใน format ที่ expect
  const qrData = JSON.stringify({
    employee_id: employeeId,
    full_name: `Employee ${employeeId}`,
    department: 'Test Department'
  });

  // ส่ง registration request โดยตรงไปยัง API endpoint
  const registerRes = http.post(`${BASE_URL}/${LOCALE}/register/api`, qrData, {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { group: 'register' }
  });

  check(registerRes, {
    'registration successful': (r) => r.status === 200 || r.status === 201,
  });

  console.log(`Registration response status: ${registerRes.status} for employee: ${employeeId}`);

  sleep(0.1); // Wait for 100ms between registrations
}
