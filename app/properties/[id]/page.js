export default function PropertyDetailPage({ params }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#2C6E5C]">Property Details</h1>
      <p className="text-[#5B6F82] mt-2">Property ID: {params.id}</p>
      <p className="text-[#5B6F82] mt-4">Full property detail page coming soon...</p>
    </div>
  );
}