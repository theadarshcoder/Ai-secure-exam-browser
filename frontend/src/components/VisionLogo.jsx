export default function VisionLogo({ className = "w-12 h-12 text-[#1a56db]" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        {/* Outer sharp structural V */}
        <path d="M6 8L20 34L34 8" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-100" />
        
        {/* Inner softer V intersecting */}
        <path d="M12 10L20 22L28 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="opacity-40" />
        
        {/* Connecting Data Nodes */}
        <circle cx="20" cy="34" r="3.5" fill="currentColor" />
        <circle cx="6" cy="8" r="3.5" fill="currentColor" />
        <circle cx="34" cy="8" r="3.5" fill="currentColor" />
        <circle cx="20" cy="22" r="2.5" fill="currentColor" className="opacity-60" />
      </svg>
    </div>
  );
}
