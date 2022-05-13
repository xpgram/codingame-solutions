#include <iostream>
#include <sstream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

/* Observations

For any jump from point A to B, there will be some line for which all
cells are equidistant to points A and B. A target anywhere on this
line would yield 'SAME'.

A first, naive solution might be to solve for x-col first, then y-row.
I can still use rectangles in this case.

[In fact, that's the solution I'm using here ↓]

For the redraft, lets try reflecting about a center point so my midline
travels directly through it.
That way, conceivably, batman might zip around the entire building
looking completely aimless, but in fact he's maximizing the
narrowification of the search space.

I might look into this polygon slicing, though.
- I would keep a vector of points.
- getIntersectionPoints() would check for a collision with each line
*segment* and return two intersection points. If it returns one or zero,
the midline does not sufficiently intersect the shape and we should take
another turn.
- Those points would be slotted in between each each point defining
the segment it intersects with.
- There are now two shapes:
  - one which includes all points in the sequence A → B,
  - and one which includes all points in the sequence B → A
- The center points for each shape can be obtained the average of all
vertices.
- The center of shape A→B is "WARM" if it is closer to batman than B→A
- The clue shall match one of these descriptions, the non-matching will
be dropped.
- Batman's next position should be reflected about the remaining shape's
average.
- The mid point used to define the line which slices the shape next must
be derived in case Batman couldn't travel far enough (such as beyond the
bounds of the building).

*/

bool within(double n, double min, double max) {
    return (min <= n && n <= max);
}

double clamp(double n, double min, double max) {
    return ::max(min, ::min(max, n));
}

class Point {
public:
    double x, y;

    Point() : x(0), y(0) { }
    Point(double x, double y) : x(x), y(y) { }
    Point(const Point &p) : x(p.x), y(p.y) { }

    double slope() const {
        return (x != 0) ? y / x : 0;
    }

    bool operator==(const Point &p) const {
        return x == p.x && y == p.y;
    }

    Point operator+(const Point &p) const {
      return Point(x + p.x, y + p.y);
    }

    Point operator-() const {
      return Point(-x,-y);
    }

    Point operator-(const Point &p) const {
      return -p + *this;
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

    double magnitude() const {
        return sqrt(x*x + y*y);
    }

    double distanceTo(const Point &other) const {
        return (other - *this).magnitude();
    }

    Point rotateByComplex(Point vec) const {
        vec = vec.fastUnitVector();
        return Point(
            (x * vec.x) - (y * vec.y),
            (x * vec.y) + (y * vec.x)
        );
    }

    /** Yields a fast approximation of this Point's unit vector; returns a new Point.  
     * The shape this creates is an octagon inscribed in the ideal circle.
     * @author Nick Vogt */
    Point fastUnitVector() const {
        // 0.29289 ~= 1 - 1/sqrt(2)
        // 1.29289 ~= 2 - 1/sqrt(2)

        double ax = x*(x >= 0) + -x*(x < 0);            // absolute coords
        double ay = y*(y >= 0) + -y*(y < 0);
        double ratio = 1 / ( x*(x >= y) + y*(x < y));   // max(x, y)
        ratio = ratio * (1.29289 - (ax + ay) * ratio * 0.29289);    // ..? some trigonometry

        return Point(
            x * ratio,
            y * ratio
        );
    }

    operator string() const {
        stringstream s;
        s << int(x) << " " << int(y);
        return s.str();
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
    { }

    Point intersection(const Line &other) const {
        if (slope == other.slope)
            throw domain_error("Parallel lines: bad input.");

        Point i;
        i.x = (other.lift - lift) / (slope - other.slope);
        i.y = slope*i.x + lift;
        return i;
    }

    bool pointInSegment(const Point &P) const {
        Point vB = B - A;
        Point vP = P - A;
        bool sameSlope = vB.slope() == vP.slope();
        bool containedByB = (vP.x <= vB.x && vP.y <= vB.y);
        return sameSlope && containedByB;
    }

    bool parallel(const Line &other) const {
        return vec.apply(abs) == other.vec.apply(abs);
    }

    bool operator==(const Line &other) const {
        bool isParallel = parallel(other);
        bool sharedCoordSpace = (other.A.y == slope * other.A.x + lift);
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

    Polygon(const vector<Point> &points) : vertices(points) { }


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

        // Find intersections
        for (int i = 0; i < vertices.size(); ++i) {
            int j = (i + 1) % vertices.size();
            
            Point I = *(vertices.begin() + i);
            Point J = *(vertices.begin() + j);

            Line poly_side(I,J);

            if (poly_side.parallel(line_cast))
                continue;

            Point intersect = poly_side.intersection(line_cast);

            if (intersect == J)     // intersection occurs over a polySide endpoint,
                continue;           // so only accept one endpoint to exclude duplicates.

            if (poly_side.pointInSegment(intersect))
                intersects.push_back(pair(intersect, i));
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

        if (intersects.size() > 2)
            throw invalid_argument("This shouldn't happen. Intersections through a convex(?) shape were > 2.");

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
        vector<Point> shapeA(itA + 1, itB);

        // All vertices pB→pA
        vector<Point> shapeB(begin, itA);
        shapeB.insert(shapeB.end(), itB + 1, end);

        // Include {pA,pB} in each new shape
        shapeA.insert(shapeA.end(), {pA, pB});
        shapeB.insert(shapeB.end(), {pA, pB});

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
        Point(width,0),
        Point(width, height),
        Point(0,height)}
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
        pos.x = clamp(pos.x, 0, width);
        pos.y = clamp(pos.y, 0, height);

        cerr << string(lastPos) << " -> " << string(pos) << endl;
        cerr << string(search) << endl;

        // Yield move instruction
        cout << int(pos.x) << " " << int(pos.y) << endl;

        // Recieve next clue
        cin >> bomb_clue; cin.ignore();

        if (bomb_clue == "SAME") {
            cerr << "Clue was 'SAME'; I don't have a protocol for this." << endl;
            continue;
        }

        // Narrow the search space about the reflection line
        Point mid = ((pos - lastPos) / 2.0 + lastPos).apply(floor);
        Point midB = (pos - mid).rotateByComplex(Point(0,1));   // mid→midB is perpendicular to pos→lastPos

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

        search = (bomb_clue == "WARMER") ? warm : cold;


        // TODO
        // All right. Time to see it break.
    }
}