export async function captureDispatchStatusLocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      permission_state: "unavailable",
      source: "status_action",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position?.coords?.latitude,
          lng: position?.coords?.longitude,
          accuracy_m: position?.coords?.accuracy ?? null,
          heading: position?.coords?.heading ?? null,
          speed: position?.coords?.speed ?? null,
          permission_state: "granted",
          source: "status_action",
        });
      },
      (error) => {
        const code = error?.code;
        resolve({
          permission_state:
            code === 1 ? "denied" : code === 3 ? "timeout" : "unavailable",
          source: "status_action",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 20000,
      }
    );
  });
}
