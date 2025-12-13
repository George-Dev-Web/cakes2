// // frontend/src/components/Hero.jsx
// import { useNavigate } from "react-router-dom";
// import "./Hero.css";

// const Hero = () => {
//   const navigate = useNavigate();

//   const handleViewAllCakes = () => {
//     navigate("/cakes");
//   };
//   return (
//     <section className="hero">
//       <div className="hero-content">
//         <h1>Delicious Artisanal Cakes</h1>
//         <p>
//           Handcrafted with love and the finest ingredients for your special
//           moments
//         </p>
//         <button className="btn" onClick={handleViewAllCakes}>
//           Explore Our Cakes
//         </button>
//       </div>
//     </section>
//   );
// };

// export default Hero;

// frontend/src/components/Hero.jsx - REVISED
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();

  const handleViewAllCakes = () => {
    navigate("/cakes");
  };

  const handleCustomizeCake = () => {
    navigate("/order");
  };

  return (
    <section className="hero-container">
      {" "}
      {/* Updated class name */}
      <div className="hero-content-left">
        {/* New: The small welcoming text */}
        <span className="welcome-tag">Welcome to Velvet Bloom</span>

        {/* Updated: Larger, bolder headline */}
        <h1 className="hero-headline">
          Delicious, Custom Cakes for Every Moment
        </h1>
        <p className="hero-subtext">
          Create your perfect cake with our interactive customization tool.
          Choose your flavors, frostings, sizes, and dietary options. Made
          Fresh, delivered with joy.
        </p>

        <div className="hero-actions">
          {/* Use different classes for the buttons */}
          <button className="btn btn-primary" onClick={handleViewAllCakes}>
            Browse All Cakes →
          </button>
          <button className="btn btn-secondary" onClick={handleCustomizeCake}>
            Customize Your Cake
          </button>
        </div>

        {/* New: Stats Section */}
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4.8★</span>
            <span className="stat-label">Average Rating</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">48hrs</span>
            <span className="stat-label">Quick Delivery</span>
          </div>
        </div>
      </div>
      {/* New: Right Column for Image/Promo */}
      <div className="hero-content-right">
        <div className="hero-image-promo">
          {/* Placeholder for your actual image */}
          <img
            src="/images/chocolate_cake.jpg"
            alt="Delicious Chocolate Cake"
            className="hero-main-image"
          />

          {/* Limited Time Offer Card
          <div className="promo-card">
            <p className="promo-title">Limited Time Offer</p>
            <p className="promo-text">Get 15% off your next custom cake.</p>
            <p className="promo-code">Use code: SWEET15</p>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
