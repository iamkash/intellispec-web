// Debug test for formula calculator with TSTI form data
// Simple test to understand the data structure issue

// Mock the actual form data structure from the TSTI form
const mockFormData = {
  "site": "Main Production Facility",
  "date": "2024-01-15",
  "jobAudited": "Equipment maintenance and calibration procedures",
  "auditorName": "John Smith",
  "auditorTitle": "Senior Safety Auditor",
  "q1": "yes",
  "q1_reason": "",
  "q2": "3",
  "q3": "2",
  "q4": "3",
  "q5": "no",
  "q5_reason": "TSTI was not updated when scope changed from calibration to maintenance",
  "q6": "yes",
  "q6_reason": "",
  "q7": "yes",
  "q7_reason": "",
  "q8": "yes",
  "q8_reason": "",
  "q9": "yes",
  "q9_reason": "",
  "q10": "na",
  "q11": "yes"
};
// Manual test of the COUNT logic
let yesCount = 0;
let noCount = 0;
let naCount = 0;

for (const key in mockFormData) {
  const value = mockFormData[key];
  if (value === 'yes') yesCount++;
  if (value === 'no') noCount++;
  if (value === 'na') naCount++;
}

console.log('Manual COUNT results', { yesCount, noCount, naCount });
// Manual test of FIELD logic
// Test the data structure that the formula calculator expects
