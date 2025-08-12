import { UploadSection } from "@/components/upload-section"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="album-heading mb-8">Warehouse Space Optimizer</h1>
            <p className="text-xl album-text-secondary leading-relaxed max-w-2xl mx-auto font-semibold">
              Upload your warehouse data to discover{" "}
              <span className="text-copper-dark font-bold">space-saving opportunities</span> and optimize your inventory
              layout with intelligent analysis
            </p>
          </div>

          <div className="album-card p-8 mb-16">
            <UploadSection />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="album-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-copper-mid rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                3D
              </div>
              <h3 className="text-xl font-bold mb-3 album-text-primary">Smart Analysis</h3>
              <p className="album-text-secondary leading-relaxed font-semibold">
                AI-powered space utilization analysis with cubic inch precision and dimensional modeling
              </p>
            </div>

            <div className="album-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 gradient-copper rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                AI
              </div>
              <h3 className="text-xl font-bold mb-3 album-text-primary">Optimization</h3>
              <p className="album-text-secondary leading-relaxed font-semibold">
                Get actionable recommendations to maximize warehouse efficiency with intelligent algorithms
              </p>
            </div>

            <div className="album-card p-8 text-center hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 gradient-seafoam rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold shadow-lg">
                VR
              </div>
              <h3 className="text-xl font-bold mb-3 album-text-primary">Insights</h3>
              <p className="album-text-secondary leading-relaxed font-semibold">
                Visual dashboards showing waste reduction and space savings with immersive data visualization
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
