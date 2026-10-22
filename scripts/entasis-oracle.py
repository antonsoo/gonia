"""Independent Decimal reconstruction of the visually reviewed printed tables.

With a browser receipt argument, also check the rendered SVG coordinates and
the shared CSS scale. Does not import application data or geometry functions.
"""
import csv
import io
import json
import sys
from decimal import Decimal as D

SOURCE = [
    ("0", "0", "0", "0"),
    ("8.7", ".1397", ".1392", ".1464"),
    ("15.75", ".2886", ".2875", ".2886"),
    ("23", ".4618", ".4613", ".4585"),
    ("31.43", ".684", ".684", ".684"),
]
MAXIMA = [
    ("21.12", ".0195", "10.42", ".029"),
    ("17.1", ".023", "8.7", ".042"),
    ("31.43", ".057", "13.8", ".057"),
    ("17.5", ".0343", "9.33", ".0615"),
    ("25.6", ".0627", "13.75", ".077"),
    ("43.70", ".118", "18.4", ".084"),
]
checks = 0


def near(actual, expected, tolerance="0.000000000001"):
    global checks
    checks += 1
    if abs(D(str(actual)) - expected) > D(tolerance):
        raise AssertionError(f"{actual} != {expected}; tolerance {tolerance}")


expected = []
for source in SOURCE:
    h, c, hyper, circle = map(D, source)
    taper = D(".684") * h / D("31.43")
    expected.append(dict(height=h, column=c, hyperbola=hyper, circle=circle,
                         taper=taper, departure=taper-c,
                         hyperbolaDeparture=taper-hyper, circleDeparture=taper-circle,
                         hyperbolaDifference=hyper-c, circleDifference=circle-c))

if len(sys.argv) == 1:
    data = json.load(sys.stdin)
    assert len(data["stations"]) == 5
    for actual, reference in zip(data["stations"], expected):
        for key, value in reference.items():
            near(actual[key], value)
    for basis in ("actual", "equal"):
        assert len(data[basis]) == 6
        for row, source in zip(data[basis], MAXIMA):
            length, maximum, height, printed = map(D, source)
            for key, value in dict(length=length, maximum=maximum, height=height,
                                   printedComparison=printed,
                                   normalizedMaximum=maximum*D("31.43")/length,
                                   displayedMaximum=maximum*(D("31.43")/length if basis == "equal" else D(1))).items():
                near(row[key], value)
    assert len(data["roundTrips"]) == 240
    for r in data["roundTrips"]:
        assert r["input"] == r["output"]
        checks += 1
    for item in [r["output"] for r in data["malformed"]] + [data["invalidNumbers"]]:
        assert item == dict(station=2,enlargement=100,prediction="none",units="metric",comparison="actual")
        checks += 1
    rows = list(csv.DictReader(io.StringIO(data["csv"])))
    assert len(rows) == 5
    for row, r in zip(rows, expected):
        for key, value in dict(height_ft=r["height"], column_offset_ft=r["column"],
                               hyperbola_offset_ft=r["hyperbola"], circle_offset_ft=r["circle"],
                               straight_taper_ft=r["taper"], departure_ft=r["departure"],
                               departure_mm=r["departure"]*D("304.8"),
                               hyperbola_minus_column_mm=r["hyperbolaDifference"]*D("304.8"),
                               circle_minus_column_mm=r["circleDifference"]*D("304.8")).items():
            near(row[key], value)
    print(json.dumps(dict(status="passed", decimal_checks=checks, source_stations=5,
                          source_maxima=6, shared_state_round_trips=240,
                          middle_departure_mm=str(expected[2]["departure"]*D("304.8"))), indent=2))
else:
    receipt = json.load(open(sys.argv[1]))
    views = receipt["geometry"]
    scale = D(460)/D("31.43")
    for view in views:
        state = view["state"]
        near(view["cssScale"][0], D(str(view["cssScale"][1])), "0.00001")
        for index, r in enumerate(expected):
            edge = view["edge"][index]
            departure = view["departure"][index]
            near(edge["x"], D(190)-r["column"]*scale, "0.000001")
            near(edge["y"], D(505)-r["height"]*scale, "0.000001")
            near(departure["x"], D(87)+r["departure"]*scale*D(state["enlargement"]), "0.000001")
            near(departure["y"], D(505)-r["height"]*scale, "0.000001")
            if state["prediction"] != "none":
                candidate = view["prediction"][index]
                residual = r[f'{state["prediction"]}Departure']
                near(candidate["x"]+3, D(87)+residual*scale*D(state["enlargement"]), "0.000001")
                near(candidate["y"]+3, D(505)-r["height"]*scale, "0.000001")
        for index, source in enumerate(MAXIMA):
            length, maximum, _, _ = map(D, source)
            displayed = maximum*(D("31.43")/length if state["comparison"] == "equal" else D(1))
            near(view["bars"][index], displayed/D(".12")*100, ".0001")
    print(json.dumps(dict(status="passed", rendered_views=len(views), decimal_checks=checks), indent=2))
