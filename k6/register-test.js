/* eslint-disable import/no-anonymous-default-export */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-utils/1.6.0/index.js";


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
  // ตรวจสอบว่าไฟล์ employee.txt มีอยู่จริงหรือไม่ก่อนเปิด
  try {
    return open('./employee.txt').split('\n').filter(id => id.trim() !== '');
  } catch (e) {
    // ถ้าหาไฟล์ไม่เจอ ให้ k6 หยุดทำงานและแสดงข้อความผิดพลาด
    exec.test.abort('Could not open employee.txt. Please ensure the file exists in the same directory.');
    return [];
  }
});

export const options = {
  scenarios: {
    register_employees: {
      executor: 'constant-arrival-rate', // เปลี่ยนเป็น constant arrival rate สำหรับวัด RPS
      rate: 5, // ลด rate ลงเพื่อ stability
      timeUnit: '1s',
      duration: '120s', // เพิ่มเวลาให้ทดสอบนานขึ้น
      preAllocatedVUs: 10,
      maxVUs: 20,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'], // เพิ่ม tolerance สำหรับ error rate
    'http_req_duration{group:::login}': ['p(95)<5000'], // เพิ่ม timeout สำหรับ login
    'http_req_duration{group:::register}': ['p(95)<3000'], // เพิ่ม timeout สำหรับ register
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
  const loginRes = http.post(`${BASE_URL}/${LOCALE}/login`, JSON.stringify(LOGIN_CREDENTIALS), {
    headers: { 'Content-Type': 'application/json' },
    tags: { group: 'login' }
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200 || r.status === 302, // 302 คือ redirect หลัง login สำเร็จ
  });

  console.log('Login response status:', loginRes.status);

  // ตรวจสอบว่า login สำเร็จจริงหรือไม่ก่อน return
  if (loginRes.status !== 200 && loginRes.status !== 302) {
      exec.test.abort('Login failed, cannot proceed with the test.');
  }

  return {
    authToken: 'authenticated', // ใช้เป็น flag ว่าลogin แล้ว
  };
}

// Main VU function
export default function (data) {
  // ใช้ random selection จาก employee data แทน iteration index
  // เพื่อให้ทำงานได้กับ constant-arrival-rate executor
  if (employeeData.length === 0) {
    console.error('No employee data available');
    return;
  }

  const randomIndex = Math.floor(Math.random() * employeeData.length);
  const employeeId = employeeData[randomIndex];

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

  if (registerRes.status !== 200 && registerRes.status !== 201) {
    console.error(`Registration failed for employee ${employeeId}:`, registerRes.status, registerRes.body);
  }

  sleep(0.1); // Wait for 100ms between registrations
}

// --- Report Generation ---
// ฟังก์ชันนี้จะถูกเรียกตอนจบเทสเสมอ
export function handleSummary(data) {
  console.log("=== HANDLESUMMARY CALLED ===");
  console.log("Test completed. Generating reports...");

  // Safe access to metrics with fallbacks
  const totalRequests = data.metrics?.http_reqs?.values?.count || 0;
  const failedRate = data.metrics?.http_req_failed?.values?.rate || 0;

  console.log("Total requests:", totalRequests);
  console.log("Failed requests:", failedRate);

  try {
    // Generate text summary for console output with error handling
    let summary = "Test completed successfully";
    if (typeof textSummary === 'function') {
      try {
        summary = textSummary(data, { indent: "  ", enableColors: true });
      } catch (summaryError) {
        console.warn("Could not generate text summary:", summaryError.message);
        summary = "Test completed - summary unavailable";
      }
    }

    // Generate HTML report with error handling
    let html = null;
    if (typeof htmlReport === 'function') {
      try {
        html = htmlReport(data);
        console.log("HTML report generated successfully");
      } catch (htmlError) {
        console.warn("Could not generate HTML report:", htmlError.message);
        html = `<html><body><h1>HTML Report Generation Failed</h1><p>Error: ${htmlError.message}</p></body></html>`;
      }
    } else {
      console.warn("htmlReport function not available");
      html = `<html><body><h1>HTML Report</h1><p>Total Requests: ${totalRequests}</p><p>Failed Rate: ${failedRate}</p></body></html>`;
    }

    // Save detailed JSON data for analysis
    let jsonReport = "{}";
    try {
      jsonReport = JSON.stringify(data, null, 2);
    } catch (jsonError) {
      console.warn("Could not stringify data:", jsonError.message);
      jsonReport = '{"error": "Could not generate JSON report"}';
    }

    console.log("Report generation completed successfully");

    const reports = {
      // Save JSON summary for further analysis
      "summary.json": jsonReport,
      // Console output
      stdout: summary,
    };

    // Add HTML report if it was generated successfully
    if (html) {
      reports["report.html"] = html;
    }

    return reports;
  } catch (error) {
    console.error("Error generating reports:", error.message);
    return {
      stdout: "Test completed with errors",
    };
  }
}

// Teardown function to ensure handleSummary is called
export function teardown(data) {
  console.log("=== TEARDOWN CALLED ===");
  console.log("Test teardown completed");
}
