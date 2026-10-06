"""Tests for the watering maths."""

from datetime import UTC, datetime, timedelta

import pytest

from custom_components.lil_wet_guys import model

T0 = datetime(2026, 9, 1, 12, 0, tzinfo=UTC)


@pytest.mark.parametrize(
    ("light", "expected"),
    [("direct", 5.25), ("bright_indirect", 7.0), ("medium", 8.75), ("low", 10.5), ("unknown", 7.0)],
)
def test_light_changes_the_interval(light: str, expected: float) -> None:
    """Brighter light dries the soil faster."""
    assert model.interval_days(7, light) == expected


def test_interval_is_at_least_a_day() -> None:
    """Even a thirsty plant in full sun isn't watered more than daily."""
    assert model.interval_days(1, "direct") == 1.0


@pytest.mark.parametrize(
    ("overdue", "status"),
    [(-2, "happy"), (-0.01, "happy"), (0, "thirsty"), (1.49, "thirsty"), (1.5, "wilting"),
     (2.99, "wilting"), (3, "ghost"), (30, "ghost")],
)
def test_status_boundaries(overdue: float, status: str) -> None:
    """Happy before the date, ghost from three days after it."""
    assert model.status_for(overdue) == status


def test_dryness_ramps_over_three_days() -> None:
    """0 on the date, 1 at ghost time, clamped outside."""
    assert model.dryness(-1) == 0
    assert model.dryness(1.5) == pytest.approx(0.5)
    assert model.dryness(9) == 1


def test_overdue_and_next_watering() -> None:
    """Days overdue are fractional and signed."""
    due = model.next_watering(T0, 7)
    assert due == T0 + timedelta(days=7)
    assert model.days_overdue(T0 + timedelta(days=5), due) == pytest.approx(-2)
    assert model.days_overdue(T0 + timedelta(days=8, hours=12), due) == pytest.approx(1.5)


def test_next_change_walks_the_boundaries() -> None:
    """The next status change is the due date, then +1.5 days, then +3, then nothing."""
    due = T0 + timedelta(days=7)
    assert model.next_change(T0, due) == due
    assert model.next_change(due, due) == due + timedelta(days=1.5)
    assert model.next_change(due + timedelta(days=2), due) == due + timedelta(days=3)
    assert model.next_change(due + timedelta(days=3), due) is None


def test_temperature_problem() -> None:
    """Outside the range is cold or hot; unknown readings are no problem."""
    assert model.temperature_problem(10, 15, 29) == "cold"
    assert model.temperature_problem(31, 15, 29) == "hot"
    assert model.temperature_problem(20, 15, 29) is None
    assert model.temperature_problem(None, 15, 29) is None


def test_heat_level() -> None:
    """A little over the top is sweating; five degrees or more is scorching."""
    assert model.heat_level(29, 29) is None
    assert model.heat_level(30, 29) == "sweating"
    assert model.heat_level(33.9, 29) == "sweating"
    assert model.heat_level(34, 29) == "scorching"
    assert model.heat_level(None, 29) is None


def test_moisture_jump_counts_as_watering() -> None:
    """A rise of the threshold above the recent low is a watering."""
    watch = model.MoistureWatch(jump=10)
    assert not watch.add(T0, 20)
    assert not watch.add(T0 + timedelta(minutes=10), 25)
    assert watch.add(T0 + timedelta(minutes=20), 31)


def test_moisture_slow_drift_is_not_watering() -> None:
    """Rises spread over more than the window don't count."""
    watch = model.MoistureWatch(jump=10)
    for i, value in enumerate(range(20, 40, 3)):
        assert not watch.add(T0 + timedelta(minutes=45 * i), value)


def test_moisture_watering_is_debounced() -> None:
    """A second rise soon after the first is the same soak."""
    watch = model.MoistureWatch(jump=10)
    watch.add(T0, 20)
    assert watch.add(T0 + timedelta(minutes=5), 35)
    watch.add(T0 + timedelta(minutes=30), 30)
    assert not watch.add(T0 + timedelta(minutes=40), 45)
    watch.add(T0 + timedelta(hours=3), 25)
    assert watch.add(T0 + timedelta(hours=3, minutes=5), 40)


def test_feed_cycle_is_two_on_one_off() -> None:
    """Fertilizer with two waterings in a row, then one of plain water, and round again."""
    assert [model.feed_step(n) for n in range(7)] == [1, 2, 3, 1, 2, 3, 1]
