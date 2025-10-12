# DynamicCalculatorGadget Performance Debugging Guide

## 🔍 How to Use This Guide

Performance profiling has been added to DynamicCalculatorGadget. Follow these steps to identify the root cause of the 729ms click handler violations.

## 📊 Step 1: Enable Performance Logging

The gadget now has extensive performance logging. Open your browser's Developer Console and perform the action that causes the violation (e.g., selecting a dropdown).

## 🎯 Step 2: Analyze the Console Output

You'll see logs in this format:

```
[PERF] ========== SimpleCalculatorComponent RENDER #X START ==========
[PERF] MemoizedFormRenderer RENDER START
[PERF] Creating NEW DocumentFormGadget... (or Reusing existing)
[PERF] DocumentFormGadget created in XXms
[PERF] MemoizedFormRenderer RENDER END - XXms
[PERF] handleInputChange START - field: fieldName
[PERF] handleInputChange UPDATE - value changed (XXms)
[PERF] handleInputChange END - total: XXms
[PERF] handleFormDataChange START - X fields
[PERF] handleFormDataChange END - XXms
[PERF] ========== SimpleCalculatorComponent RENDER #X END - XXms ==========
```

## 🔎 Step 3: Identify the Bottleneck

### **Scenario A: DocumentFormGadget creation takes >500ms**
```
[PERF] DocumentFormGadget created in 650ms  ← BOTTLENECK!
```

**Problem**: `DocumentFormGadget` constructor or `parseGadgetOptions` is expensive

**Solution**:
1. Check how many `gadgetOptions` are being passed (large arrays?)
2. Profile `DocumentFormGadget.parseGadgetOptions()` method
3. Consider lazy initialization or caching

---

### **Scenario B: Component re-renders take >400ms**
```
[PERF] SimpleCalculatorComponent RENDER #5 END - 450ms  ← BOTTLENECK!
```

**Problem**: The entire component is re-rendering expensively

**Possible causes**:
1. `gadgetOptions` useMemo is recalculating (check lines 182-315)
2. Some expensive calculation in render path
3. Child components not memoized

**Solution**:
1. Add more granular profiling to `gadgetOptions` useMemo
2. Check React DevTools Profiler for component tree
3. Ensure all child components are memoized

---

### **Scenario C: handleInputChange takes >300ms**
```
[PERF] handleInputChange END - total: 350ms  ← BOTTLENECK!
```

**Problem**: State update or callback execution is slow

**Possible causes**:
1. `setFormData` triggers expensive re-renders
2. `onFormDataChange` callback from parent is slow
3. FormRenderer's `onFormDataChange` effect is expensive

**Solution**:
1. Check if `formData` object is becoming very large
2. Profile FormRenderer's effect that broadcasts changes (line 118-122)
3. Consider batching state updates

---

### **Scenario D: Multiple renders per interaction**
```
[PERF] SimpleCalculatorComponent RENDER #3 START
[PERF] SimpleCalculatorComponent RENDER #4 START  ← Multiple renders!
[PERF] SimpleCalculatorComponent RENDER #5 START
```

**Problem**: Component is re-rendering multiple times per interaction

**Possible causes**:
1. Multiple state updates not batched
2. Parent component re-rendering
3. Context changes triggering re-renders

**Solution**:
1. Use React 18's automatic batching
2. Wrap state updates in `ReactDOM.flushSync()` if needed
3. Check if React.memo comparison function is working

---

## 🛠️ Step 4: Deep Profiling

### Profile gadgetOptions Calculation

Add this to line 182 (inside gadgetOptions useMemo):

```typescript
const { gadgetOptions, fieldList } = React.useMemo(() => {
  const startTime = performance.now();
  console.log('[PERF] gadgetOptions useMemo START');
  
  // ... existing logic ...
  
  const endTime = performance.now();
  console.log(`[PERF] gadgetOptions useMemo END - ${(endTime - startTime).toFixed(2)}ms`);
  return { gadgetOptions: result, fieldList: fields };
}, [config?.inputs, calculatorMetadata?.uiDefinition]);
```

### Profile FormRenderer Effect

Check `FormRenderer.tsx` line 118-122:

```typescript
React.useEffect(() => {
  const startTime = performance.now();
  console.log('[PERF] FormRenderer broadcast effect START');
  
  try {
    if (onFormDataChange) onFormDataChange(formData);
  } catch {}
  
  const endTime = performance.now();
  console.log(`[PERF] FormRenderer broadcast effect END - ${(endTime - startTime).toFixed(2)}ms`);
}, [formData, onFormDataChange]);
```

---

## 📈 Step 5: Use React DevTools Profiler

1. Open React DevTools
2. Go to "Profiler" tab
3. Click record (●)
4. Perform the action that causes violation
5. Stop recording
6. Analyze the flame graph

**Look for**:
- Components with long render times (dark orange/red)
- Components rendering multiple times
- Unexpected component re-renders

---

## 🎯 Step 6: Use Chrome Performance Tab

1. Open Chrome DevTools
2. Go to "Performance" tab
3. Click record (●)
4. Perform the action
5. Stop recording
6. Look for:
   - Long JavaScript execution blocks (yellow)
   - "User Timing" marks showing our `[PERF]` logs
   - Layout/Paint thrashing

---

## 🚀 Common Fixes

### Fix 1: Reduce gadgetOptions Recalculation
If `gadgetOptions` is recalculating on every render:

```typescript
// Add a ref to track if it's actually changing
const prevGadgetOptionsRef = React.useRef<any[]>([]);

const { gadgetOptions, fieldList } = React.useMemo(() => {
  console.log('[PERF] Prev gadgetOptions:', prevGadgetOptionsRef.current.length);
  console.log('[PERF] New gadgetOptions will be calculated');
  
  // ... calculation logic ...
  
  prevGadgetOptionsRef.current = result;
  return { gadgetOptions: result, fieldList: fields };
}, [config?.inputs, calculatorMetadata?.uiDefinition]);
```

### Fix 2: Batch State Updates
If multiple state updates are causing re-renders:

```typescript
import { unstable_batchedUpdates } from 'react-dom';

unstable_batchedUpdates(() => {
  setFormData(newData);
  setOtherState(newValue);
});
```

### Fix 3: Debounce Widget onChange
If widgets are calling `onChange` too frequently, add debouncing at widget level.

---

## 📞 Next Steps

After collecting the performance logs:

1. **Share the console output** showing the sequence of events
2. **Note which scenario** from Step 3 matches your logs
3. **Check the total time** for each operation
4. **Look for patterns** (e.g., "DocumentFormGadget created" on every click)

## 🧹 Cleanup

Once debugging is complete, remove the performance logs by:

1. Removing `console.log` statements
2. Removing `performance.now()` calls
3. Removing `renderCount` ref
4. Keeping optimizations but removing debug code

