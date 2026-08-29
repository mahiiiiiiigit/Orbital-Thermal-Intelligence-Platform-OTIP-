from math import asin, cos, radians, sin, sqrt


def distance_metres(point_a, point_b):
    earth_radius_metres = 6_371_000

    latitude_a = radians(point_a["latitude"])
    longitude_a = radians(point_a["longitude"])
    latitude_b = radians(point_b["latitude"])
    longitude_b = radians(point_b["longitude"])

    latitude_difference = latitude_b - latitude_a
    longitude_difference = longitude_b - longitude_a

    value = (
        sin(latitude_difference / 2) ** 2
        + cos(latitude_a)
        * cos(latitude_b)
        * sin(longitude_difference / 2) ** 2
    )

    return 2 * earth_radius_metres * asin(sqrt(value))