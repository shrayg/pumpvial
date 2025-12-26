import { Helmet } from "react-helmet";

const StructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PumpAgent",
    "description": "Beginner friendly toolkit to ship Solana applications quickly. Minimal configuration, secure and reliable.",
    "url": "https://pumpagent.com",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "PumpAgent",
      "url": "https://pumpagent.com"
    },
    "featureList": [
      "Pump.fun API Integration",
      "Solana Wallet Generation",
      "Token Bump Bot",
      "HTTPS Endpoints",
      "WebSocket Data Feeds"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default StructuredData;