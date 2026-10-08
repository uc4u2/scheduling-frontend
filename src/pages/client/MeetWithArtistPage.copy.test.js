const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.resolve(__dirname, "MeetWithArtistPage.jsx"),
  "utf8",
);

test("customer booking flow uses the approved professional copy", () => {
  expect(source).toContain("Contact information");
  expect(source).toContain("Phone or WhatsApp (optional)");
  expect(source).toContain("Confirm booking");
  expect(source).toContain(
    "We’ll email your booking confirmation and meeting details.",
  );
  expect(source).not.toContain("WhatsApp Phone Number (optional)");
  expect(source).not.toContain("Confirm meeting");
});

test("booking load feedback and heavy media remain interaction-safe", () => {
  expect(source).toContain("Loading live availability…");
  expect(source).toContain("schedulaa:booking-ready");
  expect(source).toContain("Promise.allSettled");
  expect(source).toContain("introVideoActive ? (");
  expect(source).toContain('aria-label="Play the Schedulaa introduction video"');
});
