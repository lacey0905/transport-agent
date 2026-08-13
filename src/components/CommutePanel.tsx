import { useMemo } from "react";
import type { StationGroupArrival } from "../api/bus";
import { COMMUTE, isMorningWindow } from "../constants/commute";
import { findEveningOptimal, findMorningOptimal } from "../lib/optimalRoute";
import { Icon } from "./Icon";
import { CommuteSkeleton } from "./Skeleton";
import { modeBadgeClass, modeIcon } from "./ui";

export type StartKind = "home" | "pangyo" | "office" | "exit";

const STARTS: { kind: StartKind; label: string; evening: boolean }[] = [
  { kind: "home", label: "집", evening: false },
  { kind: "pangyo", label: "판교역", evening: false },
  { kind: "office", label: "사무실", evening: true },
  { kind: "exit", label: "출구", evening: true },
];

export function CommutePanel({
  now,
  stations,
  ready,
  refreshing = false,
  activeKind,
  onFreeze,
  onResume,
}: {
  now: Date;
  stations: StationGroupArrival[];
  ready: boolean;
  refreshing?: boolean;
  activeKind: StartKind | null;
  onFreeze: (kind: StartKind) => void;
  onResume: () => void;
}) {
  const morningOpen = isMorningWindow(now);
  const canUse = (kind: StartKind) => {
    const evening = STARTS.find((s) => s.kind === kind)?.evening;
    return evening ? !morningOpen : morningOpen;
  };

  const toggle = (kind: StartKind) => {
    if (activeKind === kind) {
      onResume();
      return;
    }
    if (!canUse(kind)) return;
    onFreeze(kind);
  };

  const best = useMemo(() => {
    if (!activeKind) return null;
    if (activeKind === "office" || activeKind === "exit") {
      const toBusWalkMin =
        activeKind === "exit"
          ? COMMUTE.evening.exitToBusWalkMin
          : COMMUTE.evening.officeToBusWalkMin;
      return findEveningOptimal(now, stations, {
        clock: now,
        toBusWalkMin,
        fromLabel: activeKind === "exit" ? "출구" : "사무실",
      }).best;
    }
    return findMorningOptimal(now, stations, {
      atStation: activeKind === "pangyo",
      clock: now,
    }).best;
  }, [activeKind, stations, now]);

  const period =
    activeKind === "office" || activeKind === "exit"
      ? "evening"
      : activeKind
        ? "morning"
        : null;

  return (
    <section className="commute" aria-label="출퇴근 최적 경로">
      <div className="commute__start">
        {STARTS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            aria-pressed={activeKind === kind}
            disabled={!canUse(kind) && activeKind !== kind}
            className={`commute__start-btn${
              activeKind === kind ? " commute__start-btn--hint" : ""
            }`}
            onClick={() => toggle(kind)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeKind && refreshing ? <CommuteSkeleton /> : null}

      {activeKind && !refreshing && !ready && stations.length === 0 ? (
        <p className="state state--loading">경로 계산 중…</p>
      ) : null}

      {activeKind && !refreshing && best ? (
        <article className="commute__best">
          <div className="commute__best-top">
            <div className={`${modeBadgeClass(best.mode)} badge--lg`}>
              <Icon name={modeIcon(best.mode)} />
              {best.modeLabel}
            </div>
            <span className="badge badge--live" aria-label="실시간">
              <span className="badge--live-dot" aria-hidden />
              LIVE
            </span>
          </div>
          <p className="commute__goal-label">
            <Icon name={period === "morning" ? "apartment" : "train"} />
            {period === "morning" ? "회사 도착" : "경강선 탑승"}
          </p>
          <p className="commute__goal">{best.goalTime}</p>
          <p className="commute__summary">{best.summary}</p>
          <ol className="commute__legs">
            {best.legs.map((leg) => (
              <li key={`${leg.label}-${leg.at}`}>
                <span className="commute__dot" aria-hidden />
                <span className="commute__leg-time">{leg.at}</span>
                <span className="commute__leg-body">
                  <strong>{leg.label}</strong>
                  {leg.detail ? <em>{leg.detail}</em> : null}
                </span>
              </li>
            ))}
          </ol>
        </article>
      ) : null}

      {activeKind && !refreshing && !best && (ready || stations.length > 0) ? (
        <p className="state">
          {period === "morning"
            ? "그때 탈 수 있는 380·셔틀·602-2B 조합이 없어요. 아래 실시간·셔틀을 확인해 주세요."
            : "그때 경강선을 여유 있게 탈 수 있는 380·셔틀 경로가 없어요."}
        </p>
      ) : null}
    </section>
  );
}
