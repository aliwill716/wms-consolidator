import { analyzeWarehouseSpace } from './space-saver-handler';

// Integration test for the full Space Saver pipeline
export function testFullPipeline() {
  console.log('🧪 Testing Full Space Saver Pipeline...');

  // Mock CSV data
  const locationsFile = {
    headers: ['location_name', 'type', 'pickable', 'sellable', 'aisle', 'shelf'],
    rows: [
      ['A01-B-01', 'Shelf', 'true', 'true', 'A01', 'B'],
      ['A01-B-02', 'Shelf', 'true', 'true', 'A01', 'B'],
      ['A02-C-01', 'Shelf', 'true', 'true', 'A02', 'C'],
      ['OVERSTOCK-1', 'Bin', 'false', 'true', 'A04', 'E'],
      ['OVERSTOCK-2', 'Bin', 'false', 'true', 'A04', 'F'],
      ['OVERSTOCK-3', 'Bin', 'false', 'true', 'A04', 'G']
    ]
  };

  const productLocationsFile = {
    headers: ['sku', 'location', 'qty'],
    rows: [
      ['SKU001', 'OVERSTOCK-1', '10'],
      ['SKU001', 'OVERSTOCK-2', '15'],
      ['SKU001', 'OVERSTOCK-3', '20'],
      ['SKU002', 'A01-B-01', '5'],
      ['SKU002', 'A02-C-01', '8']
    ]
  };

  const productInfoFile = {
    headers: ['sku', 'length', 'width', 'height'],
    rows: [
      ['SKU001', '12', '8', '6'],
      ['SKU002', '10', '10', '4']
    ]
  };

  const mappingSelections = {
    locations: {
      nameCol: 0,
      typeCol: 1,
      pickableCol: 2,
      sellableCol: 3,
      aisleCol: 4,
      shelfCol: 5
    },
    productLocations: {
      skuCol: 0,
      locationCol: 1,
      qtyCol: 2
    },
    productInfo: {
      skuCol: 0,
      lengthCol: 1,
      widthCol: 2,
      heightCol: 3
    }
  };

  const capacityByType = {
    'Shelf': { cuIn: 1000 },
    'Bin': { units: 50 }
  };

  const options = {
    headroomPct: 0.90,
    preferPickAisles: ['A01', 'A02', 'A03'],
    preferPickShelves: ['B', 'C', 'D']
  };

  try {
    const result = analyzeWarehouseSpace(
      locationsFile,
      productLocationsFile,
      productInfoFile,
      mappingSelections,
      capacityByType,
      options
    );

    console.log('✅ Full pipeline test completed successfully');
    console.log('📊 Analysis Results:', {
      moves: result.result.recommendations.length,
      binsFreed: result.result.kpis.binsFreed,
      opportunities: result.result.kpis.opportunities,
      totalSellable: result.result.kpis.totalSellable
    });

    console.log('🔄 Recommended Moves:');
    result.result.recommendations.forEach((move, i) => {
      console.log(`  ${i + 1}. ${move.sku}: ${move.from} → ${move.to} (${move.qty}) - ${move.reason}`);
    });

    console.log('📋 Data Audit:', result.dataAudit);
    console.log('📄 CSV Length:', result.csvString.split('\n').length, 'lines');

    return result;
  } catch (error) {
    console.error('❌ Full pipeline test failed:', error);
    throw error;
  }
}

// Export for use in other tests
export { testFullPipeline }; 