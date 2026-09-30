"""Watering maths, free of Home Assistant so it can be tested on its own."""

from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta

# How much faster or slower soil dries in each light level.
LIGHT_FACTORS: dict[str, float] = {
    "direct": 0.75,
    "bright_indirect": 1.0,
    "medium": 1.25,
    "low": 1.5,
}

# Days past the watering date at which each status starts.
THIRSTY_AT = 0.0
WILTING_AT = 1.5
GHOST_AT = 3.0
STATUSES = ["happy", "thirsty", "wilting", "ghost"]


def interval_days(base_days: float, light: str) -> float:
    """Days between waterings for a plant in the given light (at least one)."""
    return max(1.0, round(base_days * LIGHT_FACTORS.get(light, 1.0), 2))


def next_watering(last_watered: datetime, interval: float) -> datetime:
    """When the plant is next due."""
    return last_watered + timedelta(days=interval)


def days_overdue(now: datetime, due: datetime) -> float:
    """Days past the watering date; negative while it is still to come."""
    return (now - due).total_seconds() / 86400


def status_for(overdue: float) -> str:
    """Happy until the date, then thirsty, wilting and finally a ghost."""
    if overdue < THIRSTY_AT:
        return "happy"
    if overdue < WILTING_AT:
        return "thirsty"
    if overdue < GHOST_AT:
        return "wilting"
    return "ghost"


def dryness(overdue: float) -> float:
    """0 on the watering date rising to 1 when the plant turns into a ghost."""
    return min(1.0, max(0.0, overdue / GHOST_AT))


def next_change(now: datetime, due: datetime) -> datetime | None:
    """Return the next moment the status changes, or None once it is a ghost."""
    for offset in (THIRSTY_AT, WILTING_AT, GHOST_AT):
        moment = due + timedelta(days=offset)
        if moment > now:
            return moment
    return None


def temperature_problem(value: float | None, low: float, high: float) -> str | None:
    """'cold' or 'hot' when outside the range, None when fine or unknown."""
    if value is None:
        return None
    if value < low:
        return "cold"
    if value > high:
        return "hot"
    return None


class MoistureWatch:
    """Spot a watering in a stream of soil-moisture readings.

    A watering is a rise of at least `jump` percentage points above the lowest
    reading in the last `window`. After one is spotted, further rises are
    ignored for `debounce` so a slow soak counts once.
    """

    def __init__(
        self,
        jump: float,
        window: timedelta = timedelta(minutes=60),
        debounce: timedelta = timedelta(hours=2),
    ) -> None:
        """Start with no readings."""
        self.jump = jump
        self.window = window
        self.debounce = debounce
        self._readings: deque[tuple[datetime, float]] = deque()
        self._last_watering: datetime | None = None

    def add(self, now: datetime, value: float) -> bool:
        """Record a reading; return True if it shows the plant was just watered."""
        while self._readings and now - self._readings[0][0] > self.window:
            self._readings.popleft()
        low = min((v for _, v in self._readings), default=value)
        self._readings.append((now, value))
        if value - low < self.jump:
            return False
        if self._last_watering is not None and now - self._last_watering < self.debounce:
            return False
        self._last_watering = now
        self._readings.clear()
        self._readings.append((now, value))
        return True
