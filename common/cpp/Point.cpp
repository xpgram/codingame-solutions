#include <sstream>
#include <string>
#include <cmath>

using namespace std;

class Point {
public:
    int x;
    int y;

    Point() : x(0), y(0) { }
    Point(const int x, const int y) : x(x), y(y) { }
    Point(const Point& p) : x(p.x), y(p.y) { }

    operator string() const {
        stringstream s;
        s << x << " " << y;
        return s.str();
    }

    bool operator== (const Point& other) const {
        return (x == other.x && y == other.y);
    }

    Point operator+ (const Point& other) const {
        return Point(x + other.x, y + other.y);
    }

    Point operator- () const {
        return Point(-x,-y);
    }

    Point operator- (const Point& other) const {
        return -other + *this;
    }

    Point apply(int f(int)) const {
      return Point(f(x), f(y));
    }

    Point abs() const {
        return Point(::abs(x), ::abs(y));
    }

    double distanceTo(const Point& other) const {
        Point vec = (other - *this).abs();
        return sqrt(vec.x*vec.x + vec.y*vec.y);
    }
};