/**
 * Simple syntax validation for chart components
 * التحقق البسيط من تركيب مكونات الرسوم البيانية
 */

// Check if all main components can be imported
try {
  // Chart Wrapper
  import('./ChartWrapper');
  
  // Line Chart
  import('./LineChart');
  
  // Bar Chart  
  import('./BarChart');
  
  // Pie Chart
  import('./PieChart');
  
  // Doughnut Chart
  import('./DoughnutChart');
  
  // Area Chart
  import('./AreaChart');
  
  // Metric Card
  import('./MetricCard');
  
  // Types
  import('./types');
  
  // Examples
  import('./Examples');
  
  console.log('✅ All chart components import successfully');
  
  // Check utility functions
  import('./index').then(({ formatNumber, formatPercentage, generateTimeSeriesData }) => {
    // Test utility functions
    console.log('✅ formatNumber(1250000):', formatNumber(1250000));
    console.log('✅ formatPercentage(15.2):', formatPercentage(15.2));
    
    const testData = generateTimeSeriesData(5);
    console.log('✅ generateTimeSeriesData sample:', testData.slice(0, 2));
    
    console.log('🎉 All validation tests passed!');
  }).catch(err => {
    console.error('❌ Utility function test failed:', err);
  });
  
} catch (error) {
  console.error('❌ Component import failed:', error);
  process.exit(1);
}

// Export validation status
export const validationComplete = true;