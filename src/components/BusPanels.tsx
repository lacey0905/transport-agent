import type { StationGroupArrival } from '../api/bus'
import { formatBusError } from '../api/bus'
import { ArrivalSlot } from './ArrivalSlot'
import { Icon } from './Icon'
import { Panel } from './Panel'
import { formatMinutes } from './ui'

export function BusPanels({ stations }: { stations: StationGroupArrival[] }) {
  const liveHint = (item: StationGroupArrival) => {
    const first = item.routes.find((r) => r.arrival?.predictTime1 != null)
    if (!first?.arrival || first.arrival.predictTime1 === null) return '대기 없음'
    return `${first.routeName} ${formatMinutes(first.arrival.predictTime1)}`
  }

  return (
    <>
      {stations.map((item, index) => (
        <Panel
          key={item.group.key}
          icon="directions_bus"
          title={item.group.name}
          hint={`실시간 · ${liveHint(item)}`}
          defaultOpen={index === 0}
        >
          {item.error ? (
            <p className="state state--error">
              <Icon name="error" filled />
              {formatBusError(item.error)}
            </p>
          ) : null}

          {item.routes.map(({ routeName, arrival }) => (
            <div key={routeName} className="route-block">
              <div className="route-head">
                <span
                  className={
                    routeName.includes('602')
                      ? 'badge badge--village'
                      : 'badge'
                  }
                >
                  {routeName}
                </span>
                <p className="sub">도착 예정</p>
              </div>

              {!item.error && !arrival ? (
                <p className="state">도착 정보가 없습니다</p>
              ) : null}

              {arrival ? (
                <div className="board" aria-live="polite">
                  <ArrivalSlot
                    label="이번"
                    minutes={arrival.predictTime1}
                    stopsAway={arrival.locationNo1}
                    plate={arrival.plateNo1}
                    lowPlate={arrival.lowPlate1}
                  />
                  <ArrivalSlot
                    label="다음"
                    minutes={arrival.predictTime2}
                    stopsAway={arrival.locationNo2}
                    plate={arrival.plateNo2}
                    lowPlate={arrival.lowPlate2}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </Panel>
      ))}
    </>
  )
}
