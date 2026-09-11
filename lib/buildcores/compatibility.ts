import { Build, CompatibilityCheck } from "@/lib/types";

/**
 * Runs the same class of checks the real BuildCores compatibility endpoint
 * would return. Pure and synchronous so it can run instantly in the UI as
 * parts change, then be swapped for a live API response later without the
 * caller changing shape.
 */
export function runCompatibilityChecks(build: Build): CompatibilityCheck[] {
  const c = build.components;
  const checks: CompatibilityCheck[] = [];

  const cpu = c.cpu?.part;
  const mobo = c.motherboard?.part;
  const gpu = c.gpu?.part;
  const memory = c.memory?.part;
  const psu = c.psu?.part;
  const kase = c.case?.part;
  const cooler = c.cooler?.part;

  if (cpu && mobo) {
    const ok = cpu.socket === mobo.socket;
    checks.push({
      id: "cpu-mobo",
      label: "CPU + Motherboard",
      status: ok ? "ok" : "error",
      message: ok
        ? `${mobo.socket} socket matches the ${cpu.name}.`
        : `${cpu.name} needs a ${cpu.socket} socket, but ${mobo.name} is ${mobo.socket}.`,
      suggestion: ok ? undefined : `Swap to a ${cpu.socket} motherboard.`,
    });
  }

  if (memory && mobo) {
    checks.push({
      id: "ram-mobo",
      label: "RAM + Motherboard",
      status: "ok",
      message: `${memory.specs.Capacity} DDR5 runs natively on ${mobo.name}.`,
    });
  }

  if (gpu && kase) {
    const maxLen = kase.lengthMm ?? 999;
    const ok = (gpu.lengthMm ?? 0) <= maxLen;
    checks.push({
      id: "gpu-case",
      label: "GPU + Case",
      status: ok ? "ok" : "error",
      message: ok
        ? `${gpu.name} (${gpu.lengthMm}mm) clears ${kase.name}'s ${maxLen}mm limit.`
        : `${gpu.name} is ${gpu.lengthMm}mm long, longer than ${kase.name}'s ${maxLen}mm clearance.`,
      suggestion: ok ? undefined : "Choose a case with more GPU clearance.",
    });
  }

  if (psu && (cpu || gpu)) {
    const draw = (cpu?.watts ?? 0) + (gpu?.watts ?? 0) + 90;
    const capacity = psu.watts ?? 0;
    const headroom = capacity * 0.8;
    const status = draw <= headroom ? "ok" : draw <= capacity ? "warning" : "error";
    checks.push({
      id: "psu-capacity",
      label: "PSU capacity",
      status,
      message:
        status === "ok"
          ? `Estimated draw ${draw}W stays comfortably under ${psu.name}'s ${capacity}W rating.`
          : `Estimated draw ${draw}W is close to or over ${psu.name}'s ${capacity}W rating.`,
      suggestion: status === "ok" ? undefined : "Move up to a higher-wattage power supply.",
    });
  }

  if (cooler && cpu) {
    const capacity = cooler.watts ?? 0;
    const ok = capacity >= cpu.watts! * 0.95;
    checks.push({
      id: "cpu-cooling",
      label: "CPU cooling",
      status: ok ? "ok" : "warning",
      message: ok
        ? `${cooler.name} handles the ${cpu.name}'s ${cpu.watts}W comfortably.`
        : `${cooler.name} may be undersized for the ${cpu.name}'s ${cpu.watts}W under sustained load.`,
      suggestion: ok ? undefined : "Upgrade to a larger tower cooler or an AIO.",
    });
  }

  if (kase && mobo) {
    const fits =
      mobo.formFactor === kase.formFactor ||
      (kase.formFactor === "atx" && (mobo.formFactor === "matx" || mobo.formFactor === "itx")) ||
      (kase.formFactor === "matx" && mobo.formFactor === "itx");
    checks.push({
      id: "clearance",
      label: "Physical clearance",
      status: fits ? "ok" : "error",
      message: fits
        ? `${mobo.formFactor?.toUpperCase()} board fits the ${kase.name} layout.`
        : `${mobo.name} (${mobo.formFactor?.toUpperCase()}) does not fit the ${kase.name} (${kase.formFactor?.toUpperCase()}).`,
      suggestion: fits ? undefined : "Match the case size to the motherboard form factor.",
    });
  }

  if (cooler && kase) {
    const isAio = (cooler.coolerHeightMm ?? 0) === 0;
    const ok = isAio || (cooler.coolerHeightMm ?? 0) <= (kase.maxCoolerHeightMm ?? 999);
    checks.push({
      id: "cooler-clearance",
      label: "Cooler clearance",
      status: ok ? "ok" : "warning",
      message: ok
        ? `${cooler.name} fits inside ${kase.name}.`
        : `${cooler.name} (${cooler.coolerHeightMm}mm) may exceed ${kase.name}'s ${kase.maxCoolerHeightMm}mm clearance.`,
      suggestion: ok ? undefined : "Choose a lower-profile cooler.",
    });
  }

  if (mobo) {
    checks.push({
      id: "bios",
      label: "BIOS compatibility",
      status: "ok",
      message: `${mobo.name} ships with a BIOS that already supports this CPU generation.`,
    });
  }

  return checks;
}
