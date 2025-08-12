// Core space analysis engine for warehouse optimization

export interface ProductInfo {
  sku: string
  length: number
  width: number
  height: number
  volume: number // calculated cubic inches
}

export interface WarehouseLocation {
  location_name: string
  type: string
  pickable: boolean
  sellable: boolean
}

export interface ProductLocation {
  sku: string
  location_name: string
  quantity: number
}

export interface CapacitySettings {
  type: "cubic" | "quantity"
  value: number
}

export interface LocationAnalysis {
  location_name: string
  type: string
  capacity: CapacitySettings
  currentUtilization: {
    volume: number
    quantity: number
    utilizationPercent: number
  }
  wastedSpace: {
    volume: number
    quantity: number
    wastePercent: number
  }
  products: Array<{
    sku: string
    quantity: number
    volume: number
  }>
}

export interface ConsolidationOpportunity {
  fromLocations: string[]
  toLocation: string
  spaceSaved: number
  products: Array<{
    sku: string
    quantity: number
    volume: number
  }>
  feasible: boolean
  reason?: string
}

export interface AnalysisResults {
  totalLocations: number
  totalWastedSpace: number
  totalPotentialSavings: number
  utilizationByType: Record<
    string,
    {
      averageUtilization: number
      totalCapacity: number
      totalUsed: number
      wastedSpace: number
    }
  >
  locationAnalysis: LocationAnalysis[]
  consolidationOpportunities: ConsolidationOpportunity[]
}

export class SpaceAnalysisEngine {
  private products: Map<string, ProductInfo> = new Map()
  private locations: Map<string, WarehouseLocation> = new Map()
  private productLocations: ProductLocation[] = []
  private capacitySettings: Record<string, CapacitySettings> = {}

  constructor(
    productInfo: any[],
    warehouseLocations: any[],
    productLocations: any[],
    capacitySettings: Record<string, CapacitySettings>,
  ) {
    this.loadData(productInfo, warehouseLocations, productLocations, capacitySettings)
  }

  private loadData(
    productInfo: any[],
    warehouseLocations: any[],
    productLocations: any[],
    capacitySettings: Record<string, CapacitySettings>,
  ) {
    // Load product information with calculated volumes
    productInfo.forEach((product) => {
      const volume = (product.length || 0) * (product.width || 0) * (product.height || 0)
      this.products.set(product.sku, {
        sku: product.sku,
        length: product.length || 0,
        width: product.width || 0,
        height: product.height || 0,
        volume,
      })
    })

    // Load warehouse locations
    warehouseLocations.forEach((location) => {
      this.locations.set(location.location_name, {
        location_name: location.location_name,
        type: location.type,
        pickable: location.pickable === "true" || location.pickable === true,
        sellable: location.sellable === "true" || location.sellable === true,
      })
    })

    // Load product locations
    this.productLocations = productLocations.map((pl) => ({
      sku: pl.sku,
      location_name: pl.location_name,
      quantity: Number.parseInt(pl.quantity) || 0,
    }))

    this.capacitySettings = capacitySettings
  }

  public analyze(): AnalysisResults {
    const locationAnalysis = this.analyzeLocations()
    const utilizationByType = this.calculateUtilizationByType(locationAnalysis)
    const consolidationOpportunities = this.findConsolidationOpportunities(locationAnalysis)

    const totalWastedSpace = locationAnalysis.reduce((sum, loc) => sum + loc.wastedSpace.volume, 0)
    const totalPotentialSavings = consolidationOpportunities
      .filter((opp) => opp.feasible)
      .reduce((sum, opp) => sum + opp.spaceSaved, 0)

    return {
      totalLocations: locationAnalysis.length,
      totalWastedSpace,
      totalPotentialSavings,
      utilizationByType,
      locationAnalysis,
      consolidationOpportunities: consolidationOpportunities.filter((opp) => opp.feasible),
    }
  }

  private analyzeLocations(): LocationAnalysis[] {
    const locationMap = new Map<string, LocationAnalysis>()

    // Initialize all locations
    this.locations.forEach((location) => {
      const capacity = this.capacitySettings[location.type]
      if (capacity) {
        locationMap.set(location.location_name, {
          location_name: location.location_name,
          type: location.type,
          capacity,
          currentUtilization: { volume: 0, quantity: 0, utilizationPercent: 0 },
          wastedSpace: { volume: 0, quantity: 0, wastePercent: 0 },
          products: [],
        })
      }
    })

    // Calculate current utilization
    this.productLocations.forEach((productLocation) => {
      const location = locationMap.get(productLocation.location_name)
      const product = this.products.get(productLocation.sku)

      if (location && product) {
        const productVolume = product.volume * productLocation.quantity

        location.currentUtilization.volume += productVolume
        location.currentUtilization.quantity += productLocation.quantity

        location.products.push({
          sku: productLocation.sku,
          quantity: productLocation.quantity,
          volume: productVolume,
        })
      }
    })

    // Calculate utilization percentages and waste
    locationMap.forEach((location) => {
      const capacity = location.capacity

      if (capacity.type === "cubic") {
        location.currentUtilization.utilizationPercent = (location.currentUtilization.volume / capacity.value) * 100
        location.wastedSpace.volume = Math.max(0, capacity.value - location.currentUtilization.volume)
        location.wastedSpace.wastePercent = (location.wastedSpace.volume / capacity.value) * 100
      } else {
        location.currentUtilization.utilizationPercent = (location.currentUtilization.quantity / capacity.value) * 100
        location.wastedSpace.quantity = Math.max(0, capacity.value - location.currentUtilization.quantity)
        location.wastedSpace.wastePercent = (location.wastedSpace.quantity / capacity.value) * 100
      }
    })

    return Array.from(locationMap.values())
  }

  private calculateUtilizationByType(locationAnalysis: LocationAnalysis[]): Record<string, any> {
    const typeMap = new Map<
      string,
      {
        locations: LocationAnalysis[]
        totalCapacity: number
        totalUsed: number
      }
    >()

    locationAnalysis.forEach((location) => {
      if (!typeMap.has(location.type)) {
        typeMap.set(location.type, {
          locations: [],
          totalCapacity: 0,
          totalUsed: 0,
        })
      }

      const typeData = typeMap.get(location.type)!
      typeData.locations.push(location)

      if (location.capacity.type === "cubic") {
        typeData.totalCapacity += location.capacity.value
        typeData.totalUsed += location.currentUtilization.volume
      } else {
        typeData.totalCapacity += location.capacity.value
        typeData.totalUsed += location.currentUtilization.quantity
      }
    })

    const result: Record<string, any> = {}
    typeMap.forEach((data, type) => {
      const averageUtilization = data.totalCapacity > 0 ? (data.totalUsed / data.totalCapacity) * 100 : 0
      const wastedSpace = data.totalCapacity - data.totalUsed

      result[type] = {
        averageUtilization,
        totalCapacity: data.totalCapacity,
        totalUsed: data.totalUsed,
        wastedSpace,
      }
    })

    return result
  }

  private findConsolidationOpportunities(locationAnalysis: LocationAnalysis[]): ConsolidationOpportunity[] {
    const opportunities: ConsolidationOpportunity[] = []

    // Group locations by type for consolidation analysis
    const locationsByType = new Map<string, LocationAnalysis[]>()
    locationAnalysis.forEach((location) => {
      if (!locationsByType.has(location.type)) {
        locationsByType.set(location.type, [])
      }
      locationsByType.get(location.type)!.push(location)
    })

    // Find consolidation opportunities within each type
    locationsByType.forEach((locations) => {
      // Sort by utilization (lowest first for potential sources)
      const sortedLocations = locations.sort(
        (a, b) => a.currentUtilization.utilizationPercent - b.currentUtilization.utilizationPercent,
      )

      // Look for opportunities to consolidate underutilized locations
      for (let i = 0; i < sortedLocations.length - 1; i++) {
        const sourceLocation = sortedLocations[i]

        // Skip if source location is already well utilized
        if (sourceLocation.currentUtilization.utilizationPercent > 70) continue

        for (let j = i + 1; j < sortedLocations.length; j++) {
          const targetLocation = sortedLocations[j]

          // Check if we can fit source products into target location
          const combinedVolume = sourceLocation.currentUtilization.volume + targetLocation.currentUtilization.volume
          const combinedQuantity =
            sourceLocation.currentUtilization.quantity + targetLocation.currentUtilization.quantity

          let feasible = false
          let spaceSaved = 0

          if (targetLocation.capacity.type === "cubic") {
            feasible = combinedVolume <= targetLocation.capacity.value
            spaceSaved = sourceLocation.capacity.value
          } else {
            feasible = combinedQuantity <= targetLocation.capacity.value
            spaceSaved = sourceLocation.capacity.value
          }

          if (feasible) {
            opportunities.push({
              fromLocations: [sourceLocation.location_name],
              toLocation: targetLocation.location_name,
              spaceSaved,
              products: sourceLocation.products,
              feasible: true,
            })
            break // Found a consolidation for this source location
          }
        }
      }
    })

    return opportunities
  }
}
