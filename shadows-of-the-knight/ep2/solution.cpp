#include <iostream>
#include <sstream>
#include <iomanip>
#include <optional>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

/* Observations

[ ] Rejiggering method
A bad coord is out of bounds or no-movement. I need to pick a new location
that still cuts down the search space but also enables useful jumps in the
future.

[ ] Distance slicing
The only important bit is the midline, so instead of jumping *around*
the polygon, I can also jump small distances. This can be an effective
strategy to slicing the polygon in half when the it's kind of budged up
against the building's corners.

Because the polygon can technically be infinitely thin, I'll probably want
to generate a few jump points, at least two perpendicular to each other,
and see which one cuts out the most area.

The area calculation can be fast. I may just draw a rectangle around the bounds.
It only really matters in extreme cases where the poly is way more tall than it
is wide.

*/

bool within(double n, double min, double max) {
    if (min > max)
        tie(min,max) = make_tuple(max,min);
    return (min <= n && n <= max);
}

double clamp(double n, double min, double max) {
    return ::max(min, ::min(max, n));
}

class Point {
public:
  double x;
  double y;

  Point() : x(0), y(0) {}
  Point(double x, double y) : x(x), y(y) {}
  Point(const Point &p) : x(p.x), y(p.y) {}

  operator string() const {
    stringstream s;
    s << fixed << setprecision(2)
      << x << " " << y;
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

  double islope() const {
    return (y != 0) ? x / y : 0;
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

class Line {
public: 
    const Point A;
    const Point B;
    const Point vec;
    const double slope;
    const double lift;

    Line(const Point &A, const Point &B)
    : A(A),
      B(B),
      vec(B-A),
      slope(vec.slope()),
      lift(-slope*A.x + A.y)
    {
        if (vec.manhattanMagnitude() == 0.0) {
            stringstream s;
            s << "The points given do not describe a valid line: A == B == " << string(A);
            throw invalid_argument(s.str());
        }
    }

    /** Returns a <bool,Point> pair, where the point describes where these two lines intersect.
     * The bool component is true if these lines do intersect, and false if they do not. */
    optional<Point> intersection(const Line &other) const {
        // This method uses vector cross-products to determine a ratio for line A (this)
        // by which its travel vector should be multiplied to arrive at the intersection
        // point.

        Point vecA = vec;
        Point vecB = other.vec;
        Point vecC = A - other.A;   // A vector from this to other's origin point.

        double denom = vecA.crossZ(vecB);

        if (denom == 0.0)
            return nullopt;

        // double s = vecA.cross(vecC) / denom;
        double t = vecB.crossZ(vecC) / denom;

        // The lines' travel vectors themselves intersect if s && t are each within the interval [0,1]

        return A + vec*t;
    }

    bool pointInSegment(const Point &P) const {
        bool isA = (A == P);    // TODO Within what precision?
        bool isParallel = vec.crossZ(P - A) < 0.002;    // Quantized b/c floating points
        bool inBounds = within(P.x, A.x, B.x) && within(P.y, A.y, B.y);

        return (isA || isParallel) && inBounds;
    }

    bool parallel(const Line &other) const {
        return (vec.crossZ(other.vec) == 0.0);
    }

    bool operator==(const Line &other) const {
        bool isParallel = parallel(other);
        bool sharedCoordSpace = (lift == other.lift);   // TODO ..? Slope is implicit in isParallel, so...
        return isParallel && sharedCoordSpace;
    }

    operator string() const {
        stringstream s;
        s << fixed << setprecision(3)
          << "[y = " << slope << "x + " << lift << "]";
        return s.str();
    }
};

class Polygon {
    vector<Point> vertices;

public:

    Polygon(const vector<Point> &points) : vertices(points) {
        // Check that each point is unique?
    }


    /** Returns a list of <p,i> pairs where p is the intersection between the line A→B
     * and a side of this polygon, and i is the index of I for a polygon side described
     * by the line segment I→I+1.
     * 
     * The size of the returned list will be in the range [0,2].  
     * 0 if the line does not intersect; 1 if it does, but only as tangent to a vertex;
     * and 2 otherwise.
     * 
     * Due to implementation, a line A→B does not 'intersect' with I→I+1 at all if they
     * describe the same linecast. */
    vector<pair<Point, int>> intersectsFromLine(const Point &A, const Point &B) const {
        vector<pair<Point, int>> intersects;

        Line line_cast(A,B);

        cerr << "getting intersections" << endl;

        // Find intersections
        for (int i = 0; i < vertices.size(); ++i) {
            int j = (i + 1) % vertices.size();
            
            Point I = *(vertices.begin() + i);
            Point J = *(vertices.begin() + j);

            cerr << "checking side " << string(I) << " -> " << string(J);

            Line poly_side(I,J);

            optional<Point> intersect = poly_side.intersection(line_cast);

            if (!intersect) {
              cerr << " : lines do not intersect; skipping" << endl;
              continue;
            }

            cerr << " X " << string(*intersect);

            if (intersect == J) {   // intersection occurs over a polySide endpoint,
                cerr << " : potential duplicate; skipping" << endl;
                continue;           // so only accept one endpoint to exclude duplicates.
            }

            if (poly_side.pointInSegment(*intersect)) {
                intersects.push_back(pair(*intersect, i));
                cerr << " : accepted";
            }
            else
                cerr << " : not in range; skipping";

            cerr << endl;
        }

        // Debug report
        cerr << "Found " << intersects.size() << " intersections for line " << string(line_cast) << endl;
        for (auto &p : intersects)
            cerr << string(p.first) << " , ";
        cerr << endl;

        return intersects;
    }

    /** Split this polygon about the line A→B and return the two resulting shapes on either side.  
     * If the line A→B does not sufficiently bisect this polygon, then only itself shall be returned. */
    vector<Polygon> slice(const Point &A, const Point &B) const {
        auto intersects = intersectsFromLine(A,B);
        
        if (intersects.size() < 2)
            return vector<Polygon>( {*this} );

        if (intersects.size() > 2) {
            cerr << endl;
            for (auto &p : intersects)
                cerr << string(p.first) << ", ";
            cerr << endl;
            throw invalid_argument("This shouldn't happen. Intersections through a convex(?) shape were > 2.");
        }

        // Setup
        Point pA = intersects[0].first;
        Point pB = intersects[1].first;

        int idxA = intersects[0].second;
        int idxB = intersects[1].second;

        auto begin = vertices.begin();
        auto end = vertices.end();
        auto itA = begin + min(idxA, idxB);
        auto itB = begin + max(idxA, idxB);

        // All vertices pA→pB
        vector<Point> shapeA(itA+1, itB+1);
        if (*(shapeA.end()-1) != pB)
            shapeA.insert(shapeA.end(), {pB});
        if (*(shapeA.begin()) != pA)
            shapeA.insert(shapeA.end(), {pA});

        // All vertices pB→pA
        vector<Point> shapeB(begin, itA+1);
        if (*(shapeB.end()) != pA)
            shapeB.insert(shapeB.end(), {pA});
        if (*(itB+1) != pB)
            shapeB.insert(shapeB.end(), {pB});
        shapeB.insert(shapeB.end(), itB+1, end);

        return vector<Polygon>( {Polygon(shapeA), Polygon(shapeB)} );
    }

    /** Returns a Point: an approximation of the polygon's center. */
    Point averageVertex() const {
        Point sum;
        for (auto &p : vertices)
            sum = sum + p;
        return sum / vertices.size();
    }

    /** Returns a new Polygon: a rectangle which contains all the area this polygon does. */
    Polygon boundingRect() const {
        double left, right, top, bottom;

        for (auto &p : vertices) {
            left = min(left, p.x);
            right = max(right, p.x);
            top = min(top, p.y);
            bottom = max(bottom, p.y);
        }

        return Polygon({
            Point(left,top),
            Point(right,top),
            Point(right,bottom),
            Point(left,bottom)
        });
    }

    operator string() const {
        stringstream s;
        s << "poly[";
        for (auto &p : vertices)
            s << string(p) << ", ";
        s << "]";
        return s.str();
    }
};


int main()
{
    int width, height;
    cin >> width >> height; cin.ignore();

    Polygon search({
        Point(),
        Point(width, 0),
        Point(width, height),
        Point(0, height)}
    );

    int n; // maximum number of turns before game over.
    cin >> n; cin.ignore();
    cerr << "max turns = " << n << endl;

    Point pos, lastPos;
    cin >> pos.x >> pos.y; cin.ignore();
    cerr << "starting pos = " << string(pos) << endl;

    string bomb_clue;
    cin >> bomb_clue; cin.ignore();     // dispose of 'UNKNOWN'


    // game loop
    while (1) {
        // Record position pre-movement
        lastPos = pos;

        // Reflect about the search space
        Point search_center = search.averageVertex();
        pos = search_center - (pos - search_center);

        pos = pos.apply(floor);
        pos.x = clamp(pos.x, 0, width-1);
        pos.y = clamp(pos.y, 0, height-1);

        cerr << "search: " << string(search) << endl;
        cerr << "search pivot: " << string(search_center) << endl;
        cerr << "move: " << string(lastPos) << " -> " << string(pos) << endl;

        // Yield move instruction
        cout << int(pos.x) << " " << int(pos.y) << endl;

        // Recieve next clue
        cin >> bomb_clue; cin.ignore();

        if (bomb_clue == "SAME") {
            cerr << "Clue was 'SAME'; I don't have a protocol for this." << endl;
            continue;

            // TODO Finally! I think.
            // My polygon algorithm finally narrows down on the target.
            // But now it doesn't know what to do when the distance doesn't change,
            // which means I need to slice the search by the midline.
            // 
            // I suspect doing so wouldn't change the pivot point, however.
            // Where does batman jump to?
            // I mean, narrowed or not, I never came up with an endgame;
            // even if the search polygon was 1 square, batman will orbit around
            // it forever.
            //
            // Funnily, Batman does narrow in on his own.
            // I think this is because of the bounds of the building, though;
            // like, he can't always jump to where he wants to.
            
            // Probably what I should do is slice about the midline, and then
            // position batman on next jump at the end of that midline, so he
            // can finish up in linear fashion.
        }

        // Narrow the search space about the reflection line
        Point mid = ((pos - lastPos) / 2.0 + lastPos).apply(floor);
        Point midB = (pos - mid).rotateByComplex(Point(0,1)) + mid;   // mid→midB is perpendicular to pos→lastPos

        cerr << "last = " << string(lastPos) << " -> " << string(pos) << endl;
        cerr << "lastline = " << string(Line(lastPos, pos)) << endl;
        cerr << "midpoint = " << string(mid) << " ( & " << string(midB) << " )" << endl;
        cerr << "midline = " << string(Line(mid, midB)) << endl;

        auto shapes = search.slice(mid, midB);

        // Something happened to the midline — wasn't sufficiently through the search polygon
        if (shapes.size() < 2)
            continue;

        Polygon warm = shapes[0];
        Polygon cold = shapes[1];

        if (warm.averageVertex().distanceTo(pos) > cold.averageVertex().distanceTo(pos)) {
            cold = shapes[0];
            warm = shapes[1];
        }

        cerr << "warm = " << string(warm) << endl;
        cerr << "cold = " << string(cold) << endl;

        if (bomb_clue == "WARMER") {
            search = warm;
            cerr << "chose warm" << endl;
        }
        else {
            search = cold;
            cerr << "chose cold" << endl;
        };

        cerr << endl; // newline to separate search-narrow alg from next move calc
    }
}