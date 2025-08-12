import { getCell, toBool, toNum, clean, prefix3 } from './csvGet';
import { computePlan, type BinInput, type Result } from './engine';
import { movesToCsv } from './csv';

export interface UploadedFile {
  headers: string[];
  rows: any[];
}

export interface MappingSelections {
  locations: {
    nameCol: number;
    typeCol: number;
    pickableCol: number;
    sellableCol: number;
    transferCol?: number;
    aisleCol?: number;
    shelfCol?: number;
    nameKey?: string;
    typeKey?: string;
    pickableKey?: string;
    sellableKey?: string;
    transferKey?: string;
    aisleKey?: string;
    shelfKey?: string;
  };
  productLocations: {
    skuCol: number;
    locationCol: number;
    qtyCol: number;
    skuKey?: string;
    locationKey?: string;
    qtyKey?: string;
  };
  productInfo: {
    skuCol: number;
    lengthCol?: number;
    widthCol?: number;
    heightCol?: number;
    skuKey?: string;
    lengthKey?: string;
    widthKey?: string;
    heightKey?: string;
  };
}

export interface CapacityByType {
  [type: string]: {
    cuIn?: number;
    units?: number;
  };
}

export interface AnalysisOptions {
  headroomPct: number;
  preferPickAisles: string[];
  preferPickShelves: string[];
  allowMixSkuInDest: boolean;
  includeNPNS: boolean;
}

export interface AnalysisResponse {
  result: Result;
  csvString: string;
  dataAudit: {
    fileCounts: {
      locations: number;
      productLocations: number;
      productInfo: number;
    };
    typeCounts: Record<string, number>;
    unknownCapacityBins: number;
    mixedLocations: number;
  };
}

export function analyzeWarehouseSpace(
  locationsFile: UploadedFile,
  productLocationsFile: UploadedFile,
  productInfoFile: UploadedFile,
  mappingSelections: MappingSelections,
  capacityByType: CapacityByType,
  options: Partial<AnalysisOptions> = {}
): AnalysisResponse {
  // Set default options
  const opts: AnalysisOptions = {
    headroomPct: 0.90,
    preferPickAisles: ['A01', 'A02', 'A03'],
    preferPickShelves: ['B', 'C', 'D'],
    allowMixSkuInDest: false,
    includeNPNS: false,
    ...options
  };

  // Build product info map
  const productInfoMap = new Map<string, { length?: number; width?: number; height?: number; volume?: number }>();
  for (const row of productInfoFile.rows) {
    const sku = getCell(productInfoFile, row, mappingSelections.productInfo.skuCol, mappingSelections.productInfo.skuKey);
    if (!sku) continue;

    const length = toNum(getCell(productInfoFile, row, mappingSelections.productInfo.lengthCol, mappingSelections.productInfo.lengthKey));
    const width = toNum(getCell(productInfoFile, row, mappingSelections.productInfo.widthCol, mappingSelections.productInfo.widthKey));
    const height = toNum(getCell(productInfoFile, row, mappingSelections.productInfo.heightCol, mappingSelections.productInfo.heightKey));
    
    if (length && width && height) {
      productInfoMap.set(sku, { length, width, height, volume: length * width * height });
    }
  }

  // Build locations map
  const locationsMap = new Map<string, { type: string; pickable: boolean; sellable: boolean; transfer?: boolean; aisle?: string; shelf?: string }>();
  for (const row of locationsFile.rows) {
    const name = getCell(locationsFile, row, mappingSelections.locations.nameCol, mappingSelections.locations.nameKey);
    if (!name) continue;

    const type = clean(getCell(locationsFile, row, mappingSelections.locations.typeCol, mappingSelections.locations.typeKey));
    const pickable = toBool(getCell(locationsFile, row, mappingSelections.locations.pickableCol, mappingSelections.locations.pickableKey));
    const sellable = toBool(getCell(locationsFile, row, mappingSelections.locations.sellableCol, mappingSelections.locations.sellableKey));
    const transfer = mappingSelections.locations.transferCol !== undefined ? toBool(getCell(locationsFile, row, mappingSelections.locations.transferCol, mappingSelections.locations.transferKey)) : undefined;
    const aisle = mappingSelections.locations.aisleCol !== undefined ? clean(getCell(locationsFile, row, mappingSelections.locations.aisleCol, mappingSelections.locations.aisleKey)) : undefined;
    const shelf = mappingSelections.locations.shelfCol !== undefined ? clean(getCell(locationsFile, row, mappingSelections.locations.shelfCol, mappingSelections.locations.shelfKey)) : undefined;

    locationsMap.set(name, { type, pickable, sellable, transfer, aisle, shelf });
  }

  // Build bins from product locations
  const bins: BinInput[] = [];
  for (const row of productLocationsFile.rows) {
    const sku = getCell(productLocationsFile, row, mappingSelections.productLocations.skuCol, mappingSelections.productLocations.skuKey);
    const location = getCell(productLocationsFile, row, mappingSelections.productLocations.locationCol, mappingSelections.productLocations.locationKey);
    const qty = toNum(getCell(productLocationsFile, row, mappingSelections.productLocations.qtyCol, mappingSelections.productLocations.qtyKey));

    if (!sku || !location || !qty || qty <= 0) continue;

    const locationInfo = locationsMap.get(location);
    if (!locationInfo) continue;

    // Skip NP/NS if not included and transfer is false
    if (!locationInfo.sellable && !opts.includeNPNS && locationInfo.transfer !== true) continue;

    const productInfo = productInfoMap.get(sku);
    const locationType = locationInfo.type;
    const capacitySettings = capacityByType[locationType];

    let capMode: 'cuin' | 'units' | 'unknown' = 'unknown';
    let capacity = 0;
    let used = 0;

    if (capacitySettings) {
      if (productInfo?.volume && capacitySettings.cuIn) {
        capMode = 'cuin';
        capacity = capacitySettings.cuIn;
        used = qty * productInfo.volume;
      } else if (capacitySettings.units) {
        capMode = 'units';
        capacity = capacitySettings.units;
        used = qty;
      }
    }

    const free = Math.max(capacity - used, 0);
    const aisle = locationInfo.aisle;
    const shelf = locationInfo.shelf;
    const prefix = aisle ? prefix3(aisle) : undefined;

    bins.push({
      sku,
      location,
      qty,
      type: locationType,
      pick: locationInfo.pickable,
      sell: locationInfo.sellable,
      transfer: locationInfo.transfer,
      capMode,
      capacity,
      used,
      free,
      aisle,
      shelf,
      prefix
    });
  }

  // Run analysis
  const result = computePlan(bins, opts);

  // Generate CSV
  const csvString = movesToCsv(result.recommendations);

  // Build data audit
  const dataAudit = {
    fileCounts: {
      locations: locationsFile.rows.length,
      productLocations: productLocationsFile.rows.length,
      productInfo: productInfoFile.rows.length
    },
    typeCounts: result.audit.capModeCounts,
    unknownCapacityBins: result.audit.noCapBins,
    mixedLocations: result.mixedLocations.length
  };

  return {
    result,
    csvString,
    dataAudit
  };
} 