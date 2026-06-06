import Link from 'next/link'

export default function PropertyCard({ property }) {
  if (!property) return null
  return (
    <div className="border rounded shadow-sm overflow-hidden bg-white">
      <img src={property.photos?.[0] || property.image_url || '/placeholder.svg'} alt="property" className="w-full h-48 object-cover" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-midnight">{property.title || 'Property'}</h3>
          <span className={`text-xs uppercase px-2 py-1 rounded ${property.available === false ? 'bg-estateRed/15 text-estateRed' : property.sponsored ? 'bg-mutedTeal/15 text-mutedTeal' : 'bg-mintHint text-teal'}`}>
            {property.available === false ? 'Unavailable' : property.sponsored ? 'Sponsored' : 'Available'}
          </span>
        </div>
        {property.address && <p className="text-sm text-anchorGray mt-1">{property.address}</p>}
        <p className="text-sm text-anchorGray mt-2">{property.bedrooms} bd • KES {property.price}</p>
        {property.distance && <p className="text-sm text-anchorGray">{property.distance.toFixed(1)}m away</p>}
        <div className="mt-3">
          <Link href={`/properties/${property.id}`} className="text-sm text-teal font-medium">View details</Link>
        </div>
      </div>
    </div>
  )
}
