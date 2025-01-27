function Listing({ listing }) {
  const BASE_URL = import.meta.env.VITE_API_URL; // Example: http://localhost:8000
  const imageUrl = listing.image.startsWith("http")
    ? listing.image
    : `${BASE_URL}${listing.image}`;
  console.log("Image URL:", imageUrl);

  return (
    <div className="card h-100">
      <img
        src={imageUrl}
        className="card-img-top"
        alt={listing.title || "Listing image"}
        // onError={(e) => {
        //   e.target.onerror = null;
        //   e.target.src = "https://via.placeholder.com/150"; // Fallback image
        // }}
        style={{ objectFit: "cover", height: "200px" }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{listing.title}</h5>
        <p className="card-text text-truncate" title={listing.description}>
          {listing.description}
        </p>
        <a href={`/listings/${listing.id}`} className="btn btn-primary mt-auto">
          View Details
        </a>
      </div>
    </div>
  );
}

export default Listing;
