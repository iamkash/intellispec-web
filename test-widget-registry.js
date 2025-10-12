/**
 * Test script to verify widget registry functionality
 */

const { WidgetRegistry } = require('./src/components/library/core/WidgetRegistry');

// Test widget registry initialization
async function testWidgetRegistry() {
try {
    // Initialize registry
    const registry = WidgetRegistry;

    // Test registered widgets
    const testWidgets = [
      'autocomplete',
      'input-field',
      'combo-box',
      'input-number',
      'textarea',
      'radio',
      'checkbox',
      'date-picker',
      'segmented',
      'slider',
      'switch',
      'rate',
      'select',
      'multiselect',
      'dynamic-observations'
    ];
const results = {};

    testWidgets.forEach(widgetType => {
      const isRegistered = registry.has(widgetType);
      const component = registry.get(widgetType);

      results[widgetType] = {
        registered: isRegistered,
        component: !!component
      };

      const status = isRegistered ? '✅' : '❌';
});

    // Summary
    const registeredCount = Object.values(results).filter(r => r.registered).length;
    const totalCount = testWidgets.length;
if (registeredCount === totalCount) {
return true;
    } else {
return false;
    }

  } catch (error) {
    console.error('❌ Widget registry test failed:', error);
    return false;
  }
}

// Test specific widget functionality
async function testSpecificWidgets() {
try {
    const registry = WidgetRegistry;

    // Test autocomplete widget
    const AutocompleteWidget = registry.get('autocomplete');
    if (AutocompleteWidget) {
} else {
}

    // Test combo-box widget
    const ComboBoxWidget = registry.get('combo-box');
    if (ComboBoxWidget) {
} else {
}

    // Test input-number widget
    const InputNumberWidget = registry.get('input-number');
    if (InputNumberWidget) {
} else {
}

  } catch (error) {
    console.error('❌ Specific widget test failed:', error);
  }
}

// Run tests
async function runTests() {
const registryTest = await testWidgetRegistry();
  await testSpecificWidgets();
if (registryTest) {
process.exit(0);
  } else {
process.exit(1);
  }
}

// Execute tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
