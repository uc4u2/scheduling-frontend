import React from "react";

const JsonLd = ({ data }) => {
  if (!data) return null;

  let jsonString = "";
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("JsonLd: unable to stringify data", error);
    return null;
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonString }} />
  );
};

export default JsonLd;

