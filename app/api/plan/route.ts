import { NextRequest, NextResponse } from 'next/server';
import { analyzeWarehouseSpace, type MappingSelections, type CapacityByType, type AnalysisOptions } from '@/lib/space-saver-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      locationsFile,
      productLocationsFile,
      productInfoFile,
      mappingSelections,
      capacityByType,
      options = {}
    } = body;

    // Validate required inputs
    if (!locationsFile?.headers || !locationsFile?.rows) {
      return NextResponse.json({ error: 'Missing or invalid locations file' }, { status: 400 });
    }
    if (!productLocationsFile?.headers || !productLocationsFile?.rows) {
      return NextResponse.json({ error: 'Missing or invalid product locations file' }, { status: 400 });
    }
    if (!productInfoFile?.headers || !productInfoFile?.rows) {
      return NextResponse.json({ error: 'Missing or invalid product info file' }, { status: 400 });
    }
    if (!mappingSelections) {
      return NextResponse.json({ error: 'Missing mapping selections' }, { status: 400 });
    }
    if (!capacityByType || Object.keys(capacityByType).length === 0) {
      return NextResponse.json({ error: 'Missing or empty capacity settings' }, { status: 400 });
    }

    // Run analysis
    const analysisResponse = analyzeWarehouseSpace(
      locationsFile,
      productLocationsFile,
      productInfoFile,
      mappingSelections as MappingSelections,
      capacityByType as CapacityByType,
      options as Partial<AnalysisOptions>
    );

    // Return results
    return NextResponse.json({
      success: true,
      data: analysisResponse
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 