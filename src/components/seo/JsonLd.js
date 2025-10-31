import React from "react";

const JsonLd = ({ data }) => {
  if (!data) return null;

  let json;
  try {
    json = JSON.stringify(data, null, 2);
  } catch {
    return null;
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
};

export default JsonLd;
