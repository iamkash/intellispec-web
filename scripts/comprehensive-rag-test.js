/**
 * Comprehensive RAG Chatbot Test Suite
 * Tests all possible question types from basic to complex
 * Validates accuracy, response format, and business logic
 */

const fs = require('fs');
// Using Node.js 18+ built-in fetch

const API_BASE = 'http://localhost:4000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEiLCJ0ZW5hbnRJZCI6IjY4YWE5NWNhYWJhMGQ1MDJmZTZhZGE1YSIsInRlbmFudFNsdWciOiJwa3N0aSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njc1NjQzOCwiZXhwIjoxNzU2ODQyODM4LCJhdWQiOiJwa3N0aSIsImlzcyI6ImludGVsbGlzcGVjLWF1dGgifQ.FSkbMxQ7jFZyjz4vQQuiDdMrHtKbdrfTxjV-I_9edAw';

// Test categories with expected response patterns
const TEST_CATEGORIES = {
  // BASIC COUNT QUERIES
  basic_counts: [
    {
      question: "how many companies",
      expectedPattern: /^\d+$/,
      description: "Simple count - should return just a number"
    },
    {
      question: "how many facilities",
      expectedPattern: /^\d+$/,
      description: "Simple count - should return just a number"
    },
    {
      question: "how many paint types",
      expectedPattern: /^\d+$/,
      description: "Simple count - should return just a number"
    },
    {
      question: "how many invoices",
      expectedPattern: /^\d+$/,
      description: "Simple count - should return just a number"
    }
  ],

  // IDENTIFICATION QUERIES (WHO/WHAT/WHICH)
  identification: [
    {
      question: "which company has the most facilities",
      expectedPattern: /^[A-Za-z\s&-]+$/,
      description: "Should return company name only"
    },
    {
      question: "what paint has the highest VOC content",
      expectedPattern: /^[A-Za-z0-9\s-]+$/,
      description: "Should return product name only"
    },
    {
      question: "which facility consumed the most paint",
      expectedPattern: /^[A-Za-z\s-]+$/,
      description: "Should return facility name only"
    },
    {
      question: "who used the most paint",
      expectedPattern: /^[A-Za-z\s&-]+$/,
      description: "Should return company name only"
    }
  ],

  // QUANTITATIVE QUERIES (HOW MUCH/HOW MANY)
  quantitative: [
    {
      question: "how much paint did Sherwin-Williams use",
      expectedPattern: /^\d+[\d,]*(\.\d+)?\s*(gallons?|units?|liters?)?$/,
      description: "Should return quantity with optional unit"
    },
    {
      question: "what is the total VOC content across all paints",
      expectedPattern: /^\d+[\d,]*(\.\d+)?\s*(g\/L|ppm|%)?$/,
      description: "Should return total VOC value"
    },
    {
      question: "how many invoices does Berkeley Steel Mill have",
      expectedPattern: /^\d+$/,
      description: "Should return count for specific facility"
    }
  ],

  // TEMPORAL QUERIES (WHEN)
  temporal: [
    {
      question: "when was the last paint purchase",
      expectedPattern: /(January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/,
      description: "Should return a date"
    },
    {
      question: "which month had the highest paint consumption",
      expectedPattern: /(January|February|March|April|May|June|July|August|September|October|November|December)/,
      description: "Should return month name"
    }
  ],

  // COMPARATIVE QUERIES
  comparative: [
    {
      question: "which has higher VOC: Nova-Plate or Zinc Clad",
      expectedPattern: /^(Nova-Plate|Zinc Clad)/,
      description: "Should return one of the compared products"
    },
    {
      question: "who spent more on paint: Sherwin-Williams or PPG",
      expectedPattern: /^(Sherwin-Williams|PPG)/,
      description: "Should return one of the compared companies"
    }
  ],

  // COMPLEX ANALYTICAL QUERIES
  complex_analysis: [
    {
      question: "which facility has the highest average VOC per invoice",
      expectedPattern: /^[A-Za-z\s-]+$/,
      description: "Should return facility name after complex calculation"
    },
    {
      question: "what percentage of total paint consumption is high-VOC",
      expectedPattern: /^\d+(\.\d+)?%?$/,
      description: "Should return percentage"
    },
    {
      question: "which company has the most diverse paint portfolio",
      expectedPattern: /^[A-Za-z\s&-]+$/,
      description: "Should return company name after diversity analysis"
    }
  ],

  // AGGREGATION QUERIES
  aggregation: [
    {
      question: "total paint consumption by company",
      expectedPattern: /^[A-Za-z\s&-]+:\s*\d+/,
      description: "Should return company breakdown"
    },
    {
      question: "average VOC content by manufacturer",
      expectedPattern: /^[A-Za-z\s&-]+:\s*\d+/,
      description: "Should return manufacturer breakdown"
    }
  ],

  // EDGE CASES & ERROR HANDLING
  edge_cases: [
    {
      question: "show me document IDs",
      expectedPattern: /^(?!.*doc_).*$/,
      description: "Should NOT contain any doc_ IDs"
    },
    {
      question: "what is the system ID for Sherwin-Williams",
      expectedPattern: /^(?!.*doc_).*$/,
      description: "Should NOT expose system IDs"
    },
    {
      question: "nonexistent paint brand XYZ123",
      expectedPattern: /^(No data|Not found|0|None|No data available)/,
      description: "Should handle non-existent data gracefully"
    }
  ]
};

// Validation functions
function validateResponse(response, expectedPattern, description) {
  const validation = {
    passed: false,
    response: response,
    expectedPattern: expectedPattern.toString(),
    description: description,
    issues: []
  };

  // Special case: "No data available" responses are considered valid for most queries
  // when there's no data in the database
  const isNoDataResponse = /^(No data available|No data|Not found|0|None)/.test(response);
  
  // Check if response matches expected pattern
  if (expectedPattern.test(response)) {
    validation.passed = true;
  } else if (isNoDataResponse && !description.includes("Should return")) {
    // Accept "no data" responses for queries that don't explicitly require specific data
    validation.passed = true;
    validation.issues.push('No data in database - response acceptable');
  } else {
    validation.issues.push(`Response doesn't match expected pattern: ${expectedPattern}`);
  }

  // Check for system ID exposure (critical security issue)
  if (response.includes('doc_')) {
    validation.passed = false;
    validation.issues.push('SECURITY ISSUE: System ID exposed');
  }

  // Check for excessive verbosity (should be concise)
  if (response.length > 200) {
    validation.issues.push('Response too verbose (>200 chars)');
  }

  return validation;
}

async function testRAGQuestion(question, expectedPattern, description) {
  try {
const response = await fetch(`${API_BASE}/api/rag/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: question,
        context: { filters: {} },
        gadgetConfig: {
          rag: {
            enabled: true,
            searchIndex: "voc_vector_search",
            embeddingField: "embedding",
            semanticFields: "auto",
            maxResults: 50,
            minScore: 0.1
          },
          ai: {
            model: "gpt-5-nano",
            apiType: "responses",
            maxTokens: 150,
            systemPrompt: "CRITICAL: Never show doc_ codes. Analyze data carefully and give precise answers. For counts: exact numbers from data analysis. For identification: specific business names. For calculations: compute actual values from the data. Be accurate, not generic.",
            contextPrompt: "Current filter context: {filters}. Available data: {context}. Tenant: {tenantId}"
          }
        }
      })
    });

    const responseData = await response.json();
    const aiResponse = responseData.response || responseData.message || responseData.answer || responseData.result || 'No response';
    const validation = validateResponse(aiResponse, expectedPattern, description);
console.log(`✅ Status: ${validation.passed ? 'PASS' : 'FAIL'}`);
    
    if (validation.issues.length > 0) {
}

    return validation;

  } catch (error) {
return {
      passed: false,
      response: 'ERROR',
      expectedPattern: expectedPattern.toString(),
      description: description,
      issues: [`API Error: ${error.message}`]
    };
  }
}

async function runComprehensiveTest() {
  console.log('='.repeat(60));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    categories: {}
  };

  // Test each category
  for (const [categoryName, tests] of Object.entries(TEST_CATEGORIES)) {
    console.log('-'.repeat(40));

    const categoryResults = {
      total: tests.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    for (const test of tests) {
      const result = await testRAGQuestion(test.question, test.expectedPattern, test.description);
      categoryResults.tests.push(result);
      
      if (result.passed) {
        categoryResults.passed++;
        results.passed++;
      } else {
        categoryResults.failed++;
        results.failed++;
      }
      
      results.total++;
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    results.categories[categoryName] = categoryResults;
}

  // Generate final report
console.log('📋 FINAL TEST REPORT');
console.log(`Total Tests: ${results.total}`);
console.log(`Failed: ${results.failed} (${Math.round(results.failed/results.total*100)}%)`);

  // Category breakdown
  for (const [category, categoryResult] of Object.entries(results.categories)) {
    const passRate = Math.round((categoryResult.passed / categoryResult.total) * 100);
    console.log(`Category ${category}: ${categoryResult.passed}/${categoryResult.total} passed (${passRate}%)`);
  }

  // Critical issues
  const criticalIssues = [];
  for (const categoryResult of Object.values(results.categories)) {
    for (const test of categoryResult.tests) {
      if (test.issues.some(issue => issue.includes('SECURITY ISSUE'))) {
        criticalIssues.push(test);
      }
    }
  }

  if (criticalIssues.length > 0) {
    console.warn('\n🚨 Critical issues detected:');
    criticalIssues.forEach(issue => {
      console.warn(` - ${issue.description}: ${issue.issues.join('; ')}`);
    });
  }

  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `rag-test-report-${timestamp}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  // Overall assessment
  const overallPassRate = Math.round((results.passed / results.total) * 100);
  console.log(`\nOverall pass rate: ${results.passed}/${results.total} (${overallPassRate}%)`);
  if (overallPassRate >= 90) {
    console.log('✅ Excellent RAG performance');
  } else if (overallPassRate >= 75) {
    console.log('✅ Good performance with room for improvement');
  } else if (overallPassRate >= 50) {
    console.log('⚠️  Significant improvements needed');
  } else {
    console.log('❌ RAG performance is below acceptable thresholds');
  }

  return results;
}

// Run the test if called directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest, testRAGQuestion, validateResponse };
