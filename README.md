# WMS Consolidator - Warehouse Space Optimization Engine

A powerful TypeScript-based warehouse management system that analyzes CSV data to generate intelligent consolidation recommendations for optimizing warehouse space utilization.

## 🚀 Features

### Core Functionality
- **CSV Data Processing**: Handles warehouse locations, product locations, and product information
- **Smart Column Mapping**: Automatic detection and manual mapping of CSV columns
- **Capacity Configuration**: Flexible capacity settings by location type (cubic inches or units)
- **Space Analysis Engine**: Pure TypeScript engine with no external dependencies
- **Consolidation Algorithms**: 
  - Overstock consolidation (empty-only moves)
  - Pick location optimization with scoring
  - ShipHero prefix-aware sorting

### Business Rules
- **Empty-Only Moves**: Source bins must be completely emptied
- **Capacity Management**: Supports both cubic inches and units with headroom percentage
- **Location Preferences**: Prioritizes preferred aisles (A01-A03) and shelves (B-D)
- **One SKU Per Location**: MVP constraint for destination locations
- **NP/NS Handling**: Configurable inclusion of non-pickable/non-sellable locations

### User Interface
- **Modern React UI**: Built with Next.js 15 and Tailwind CSS
- **Bulk Selection**: Select all/none recommendations for CSV export
- **Real-time Analysis**: Instant results with detailed KPIs and audit data
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom color scheme
- **Data Processing**: Pure TypeScript engine
- **CSV Handling**: Custom CSV parser and generator
- **State Management**: React hooks with localStorage persistence

## 📁 Project Structure

```
warehouse-space-saver-ts12/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── analyze/           # Analysis results page
│   ├── configure/         # Capacity configuration page
│   └── page.tsx           # Main upload page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── file-upload.tsx   # File upload component
│   ├── column-mapping.tsx # Column mapping interface
│   └── analysis-dashboard.tsx # Results display
├── lib/                   # Core business logic
│   ├── engine.ts         # Main consolidation algorithm
│   ├── csvGet.ts         # CSV utility functions
│   ├── csv.ts            # CSV generation
│   └── space-saver-handler.ts # Main handler
├── hooks/                 # Custom React hooks
├── styles/                # Global styles
└── public/                # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aliwill716/wms-consolidator.git
   cd wms-consolidator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📊 Usage

### 1. Upload CSV Files
- **Warehouse Locations**: Contains location metadata (type, pickable, sellable, etc.)
- **Product Locations**: Maps SKUs to locations with quantities
- **Product Info**: Product dimensions and metadata

### 2. Map Columns
- Automatically detect common column names
- Manually map columns if needed
- Confirm mappings before proceeding

### 3. Configure Capacity
- Set capacity by location type (cu.in or units)
- Configure headroom percentage
- Set preferred pick aisles and shelves

### 4. Analyze & Export
- View consolidation recommendations
- Select specific recommendations
- Export to CSV with real quantities

## 🔧 Configuration

### Capacity Settings
```typescript
const capacityByType = {
  "Bin": { cuIn: 1000, units: 100 },
  "Pallet": { cuIn: 8000, units: 500 },
  "Shelf": { cuIn: 2000, units: 200 }
}
```

### Analysis Options
```typescript
const options = {
  headroomPct: 0.90,           // 90% fill limit
  preferPickAisles: ["A01", "A02", "A03"],
  preferPickShelves: ["B", "C", "D"],
  allowMixSkuInDest: false,    // MVP constraint
  includeNPNS: false           // NP/NS handling
}
```

## 📈 Output Format

### Analysis Results
```typescript
interface AnalysisResponse {
  result: {
    recommendations: MoveRow[]
    kpis: {
      binsFreed: number
      opportunities: number
      wastedCuIn?: number
      potentialSavingsCuIn?: number
    }
    mixedLocations: Array<{
      location: string
      skus: string[]
      totalQty: number
    }>
  }
  dataAudit: {
    noCapBins: number
    capModeCounts: Record<string, number>
    reasonCounts: Record<string, number>
  }
  csvString: string
}
```

### CSV Export Format
```csv
sku,from_location,to_location,qty_to_move,est_fill_after
"SKU001","A01-01-A","A02-01-A",50,85.2%
"SKU002","B01-02-B","B02-01-B",25,72.1%
```

## 🧪 Testing

The engine includes comprehensive integration tests:

```bash
# Run the integration test
npx tsx lib/integration-test.ts
```

Tests cover:
- Overstock consolidation scenarios
- Pick location optimization
- Capacity constraints
- CSV parsing and generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- Icons from Lucide React
- CSV processing utilities

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for efficient warehouse management** 