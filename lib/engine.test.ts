import { computePlan, type BinInput } from './engine';

// Simple test function to verify engine logic
export function testEngine() {
  console.log('Testing Space Saver Engine...');

  // Test data: SKU split across 3 overstock bins
  const testBins: BinInput[] = [
    // Overstock bins for SKU001
    {
      sku: 'SKU001', location: 'OVERSTOCK-1', qty: 10, type: 'Bin',
      pick: false, sell: true, capMode: 'units', capacity: 50, used: 10, free: 40,
      aisle: 'A04', shelf: 'E'
    },
    {
      sku: 'SKU001', location: 'OVERSTOCK-2', qty: 15, type: 'Bin',
      pick: false, sell: true, capMode: 'units', capacity: 50, used: 15, free: 35,
      aisle: 'A04', shelf: 'F'
    },
    {
      sku: 'SKU001', location: 'OVERSTOCK-3', qty: 20, type: 'Bin',
      pick: false, sell: true, capMode: 'units', capacity: 100, used: 20, free: 80,
      aisle: 'A04', shelf: 'G'
    },
    // Pick bins for SKU002
    {
      sku: 'SKU002', location: 'A02-B-01', qty: 5, type: 'Shelf',
      pick: true, sell: true, capMode: 'cuin', capacity: 1000, used: 200, free: 800,
      aisle: 'A02', shelf: 'B'
    },
    {
      sku: 'SKU002', location: 'A04-D-01', qty: 8, type: 'Shelf',
      pick: true, sell: true, capMode: 'cuin', capacity: 1000, used: 320, free: 680,
      aisle: 'A04', shelf: 'D'
    }
  ];

  const options = {
    headroomPct: 0.90,
    preferPickAisles: ['A01', 'A02', 'A03'],
    preferPickShelves: ['B', 'C', 'D']
  };

  try {
    const result = computePlan(testBins, options);
    
    console.log('✅ Engine test completed successfully');
    console.log('📊 Results:', {
      moves: result.recommendations.length,
      binsFreed: result.kpis.binsFreed,
      opportunities: result.kpis.opportunities,
      totalSellable: result.kpis.totalSellable
    });
    
    console.log('🔄 Moves:', result.recommendations.map(m => 
      `${m.sku}: ${m.from} → ${m.to} (${m.qty}) - ${m.reason}`
    ));
    
    console.log('📋 Audit:', result.audit);
    
    return result;
  } catch (error) {
    console.error('❌ Engine test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  testEngine();
} 