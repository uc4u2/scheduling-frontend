const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.resolve(__dirname, "NewManagementDashboard.js"),
  "utf8"
);

describe("mobile manager navigation layout", () => {
  it("uses one bounded touch-scroll region that keeps the final tools reachable", () => {
    expect(source).toMatch(/@supports \(height: 100dvh\)/);
    expect(source).toMatch(/display: "flex",\s+flexDirection: "column",\s+overflow: "hidden"/);
    expect(source).toMatch(/flex: "1 1 auto",\s+minHeight: 0/);
    expect(source).toMatch(/overscrollBehaviorY: "contain"/);
    expect(source).toMatch(/WebkitOverflowScrolling: "touch"/);
    expect(source).toMatch(/safe-area-inset-bottom/);
    expect(source).not.toMatch(
      /flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto"/
    );
  });
});
