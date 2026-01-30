import React, { useEffect, useState } from "react";
import UpgradeRequiredModal from "./UpgradeRequiredModal";
import SeatsRequiredModal from "./SeatsRequiredModal";

const BillingUpgradeController = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [requiredPlan, setRequiredPlan] = useState(null);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [upgradeAction, setUpgradeAction] = useState("");
  const [upgradeAudience, setUpgradeAudience] = useState("manager");
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [seatContext, setSeatContext] = useState({ allowed: null, current: null });

  useEffect(() => {
    const onUpgrade = (event) => {
      setRequiredPlan(event?.detail?.requiredPlan || null);
      setUpgradeMessage(event?.detail?.message || "");
      setUpgradeAction(event?.detail?.action || "");
      setUpgradeAudience(event?.detail?.audience || "manager");
      setUpgradeOpen(true);
    };
    const onSeats = (event) => {
      setSeatContext({
        allowed: event?.detail?.allowed ?? null,
        current: event?.detail?.current ?? null,
      });
      setSeatsOpen(true);
    };
    window.addEventListener("billing:upgrade-required", onUpgrade);
    window.addEventListener("billing:seats-required", onSeats);
    return () => {
      window.removeEventListener("billing:upgrade-required", onUpgrade);
      window.removeEventListener("billing:seats-required", onSeats);
    };
  }, []);

  return (
    <>
      {upgradeAudience !== "public" && (
        <UpgradeRequiredModal
          open={upgradeOpen}
          requiredPlan={requiredPlan}
          message={upgradeMessage}
          action={upgradeAction}
          onClose={() => setUpgradeOpen(false)}
        />
      )}
      <SeatsRequiredModal
        open={seatsOpen}
        allowed={seatContext.allowed}
        current={seatContext.current}
        onClose={() => setSeatsOpen(false)}
      />
    </>
  );
};

export default BillingUpgradeController;
