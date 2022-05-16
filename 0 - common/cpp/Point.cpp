#include <sstream>
#include <iomanip>
#include <string>
#include <cmath>

using namespace std;

class Point {
public:
  double x;
  double y;

  Point() : x(0), y(0) {}
  Point(double x, double y) : x(x), y(y) {}
  Point(const Point &p) : x(p.x), y(p.y) {}

  string logStr() const {
    stringstream s;
    s << fixed << setprecision(2)
      << "(" << x << " " << y << ")";
    return s.str();
  }

  operator string() const {
    stringstream s;
    s << int(x) << " " << int(y);
    return s.str();
  }

  bool operator==(const Point &other) const {
    return (x == other.x && y == other.y);
  }

  bool operator!=(const Point &other) const {
    return (x != other.x || y != other.y);
  }

  Point operator+(const Point &other) const {
    return Point(x + other.x, y + other.y);
  }

  Point operator-() const {
    return Point(-x, -y);
  }

  Point operator-(const Point &other) const {
    return -other + *this;
  }

  Point operator*(double n) const {
    return Point(x*n, y*n);
  }

  Point operator/(double n) const {
    return Point(x/n, y/n);
  }

  Point apply(double f(double)) const {
    return Point(f(x), f(y));
  }

  double slope() const {
    return (x != 0) ? y / x : 0;
  }

  double magnitude() const {
    return sqrt(x*x + y*y);
  }

  double manhattanMagnitude() const {
    return abs(x) + abs(y);
  }

  Point unitVector() const {
    return (*this) / magnitude();
  }

  /** Yields a fast approximation of this Point's unit vector; returns a new Point.  
   * The shape this creates is an octagon inscribed in the ideal circle.
   * @author Nick Vogt */
  Point fastUnitVector() const {
    // 0.29289 ~= 1 - 1/sqrt(2)
    // 1.29289 ~= 2 - 1/sqrt(2)

    double ax = x*(x >= 0) + -x*(x < 0);            // absolute coords
    double ay = y*(y >= 0) + -y*(y < 0);
    double ratio = 1 / ( x*(x >= y) + y*(x < y));   // 1 / max(x, y)
    ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);
      // some trigonometry involving how diagonally-pointed the vector is

    return Point(x * ratio, y * ratio);
  }

  /** Rotates this vector by the given vector's implicit-angle from the +x-axis. */
  Point rotateByComplex(Point vec) const {
    vec = vec.unitVector();
    return Point(
      (x * vec.x) - (y * vec.y),
      (x * vec.y) + (y * vec.x)
    );
  }

  double crossZ(const Point &other) const {
    return x*other.y - y*other.x;
  }

  double distanceTo(const Point &other) const {
    return (other - *this).magnitude();
  }

};
