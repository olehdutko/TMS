import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

client.interceptors.response.use(
  res => res.data,
  err => {
    const message =
      err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
    return Promise.reject(new Error(message));
  }
);

const api = {
  // Auth
  register: (login, password, user_name) =>
    client.post('/auth/register', { login, password, user_name }),
  login: (login, password) => client.post('/auth/login', { login, password }),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get('/auth/me'),

  // TestSuites
  getTestSuites: () => client.get('/testsuites'),
  createTestSuite: (name) => client.post('/testsuites', { name }),
  getTestSuite: (id) => client.get(`/testsuites/${id}`),
  deleteTestSuite: (id) => client.delete(`/testsuites/${id}`),

  // TestCases
  getTestCases: (suiteId) => client.get(`/testsuites/${suiteId}/testcases`),
  createTestCase: (suiteId, data) => client.post(`/testsuites/${suiteId}/testcases`, data),
  getTestCase: (id) => client.get(`/testcases/${id}`),
  updateTestCase: (id, data) => client.put(`/testcases/${id}`, data),
  deleteTestCase: (id) => client.delete(`/testcases/${id}`),

  // TestRuns
  getTestRuns: () => client.get('/testruns'),
  createTestRun: (test_case_ids) => client.post('/testruns', { test_case_ids }),
  getTestRun: (id) => client.get(`/testruns/${id}`),
  deleteTestRun: (id) => client.delete(`/testruns/${id}`),

  // TestRunCases
  getTestRunCase: (id) => client.get(`/testruns/cases/${id}`),
  updateTestRunCase: (id, result) => client.put(`/testruns/cases/${id}`, { result }),

  // Reports
  getReports: () => client.get('/reports'),
  getReport: (testrunId) => client.get(`/reports/${testrunId}`),
};

export default api;
