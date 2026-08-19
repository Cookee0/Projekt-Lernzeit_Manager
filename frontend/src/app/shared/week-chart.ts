import { Component, Input } from '@angular/core';
import { WeekPoint } from '../core/models';

/** Ein Balken des Wochendiagramms (FR-6.3), Koordinaten im SVG-Raster. */
interface WeekBar {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  minutes: number;
  showValue: boolean;
}

/**
 * Balkendiagramm der Lernzeit der letzten acht Kalenderwochen (FR-6.3).
 * Wiederverwendbar zwischen Dashboard und Auswertungsseite; haelt keinen
 * eigenen Zustand, sondern stellt nur `history` dar.
 */
@Component({
  selector: 'app-week-chart',
  template: `
    <div class="card chart-card">
      <h3>Lernzeit der letzten 8 Wochen</h3>
      @if (!hasWeeklyData()) {
        <p class="empty">In den letzten acht Wochen ist noch keine Lernzeit erfasst.</p>
      } @else {
        <svg class="week-chart" viewBox="0 0 560 175" role="img"
          aria-label="Balkendiagramm der Lernzeit pro Woche in den letzten acht Wochen">
          <line x1="10" y1="142" x2="550" y2="142" stroke="var(--border)" stroke-width="1" />
          @for (bar of weekBars(); track bar.label) {
            <g>
              <title>Woche ab {{ bar.label }} — {{ formatMinutes(bar.minutes) }}</title>
              <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.w" [attr.height]="bar.h"
                rx="2" fill="var(--primary)" />
              @if (bar.showValue) {
                <text [attr.x]="bar.x + bar.w / 2" [attr.y]="bar.y - 6" text-anchor="middle"
                  class="chart-value">{{ formatMinutes(bar.minutes) }}</text>
              }
              <text [attr.x]="bar.x + bar.w / 2" y="158" text-anchor="middle"
                class="chart-label">{{ bar.label }}</text>
            </g>
          }
        </svg>
      }
    </div>
  `,
})
export class WeekChartComponent {
  @Input() history: WeekPoint[] = [];

  hasWeeklyData(): boolean {
    return this.history.some((week) => week.minutes > 0);
  }

  /** Balkengeometrie fuer das Wochendiagramm (FR-6.3) im 560x175-SVG-Raster.
   *  Beschriftet werden nur die staerkste und die aktuelle Woche; alle Balken
   *  tragen einen nativen Tooltip. */
  weekBars(): WeekBar[] {
    const weeks = this.history;
    const max = Math.max(...weeks.map((week) => week.minutes), 60);
    const plotHeight = 120;
    const top = 22;
    const gap = 12;
    const barWidth = (540 - gap * (weeks.length - 1)) / weeks.length;
    return weeks.map((week, i) => {
      const h = week.minutes > 0 ? Math.max(2, Math.round((week.minutes / max) * plotHeight)) : 0;
      const [, monthPart, dayPart] = week.week_start.split('-');
      return {
        x: Math.round(10 + i * (barWidth + gap)),
        y: top + plotHeight - h,
        w: Math.round(barWidth),
        h,
        label: `${dayPart}.${monthPart}.`,
        minutes: week.minutes,
        showValue:
          week.minutes > 0 && (i === weeks.length - 1 || week.minutes === max),
      };
    });
  }

  formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
