#include <iostream>
#include <sstream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

/* Observations

For any jump from point A to B, there will be some line for which all
cells are equidistant to points A and B. This line would yield 'SAME'.

If A.x < B.x, and D = (A+B)/2, it follows that n > D.x yields 'WARMER' and
n < D.x yields 'COLDER'.

A first, naive solution might be to solve for x-col first, then y-row.
I can still use rectangles in this case.

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

    bool operator==(const Point &p) const {
        return x == p.x && y == p.y;
    }

    operator string() const {
        stringstream s;
        s << int(x) << " " << int(y);
        return s.str();
    }
};

struct Rect {
    double left = 0.0;
    double top = 0.0;
    double bottom = 0.0;
    double right = 0.0;

    operator string() const {
        stringstream s;
        s << "[" << left << "," << top << " " << right << "," << bottom << "]";
        return s.str();
    }
};

// This acquires the intersection points of a line through A and B, through a rectangle.
// This function should always return a vector of size 2.
vector<Point> getIntersectionPoints(const Point A, const Point B, const Rect rect) {
    vector<Point> points;

    Point vec;
    vec.x = A.x - B.x;
    vec.y = A.y - B.y;

    double slope = vec.y / vec.x;
    double lift = -slope*vec.x + vec.y;

    points.push_back(Point(
        (rect.top - lift) / slope,
        rect.top
    ));
    points.push_back(Point(
        (rect.bottom - lift) / slope,
        rect.bottom
    ));
    points.push_back(Point(
        rect.left,
        slope*rect.left + lift
    ));
    points.push_back(Point(
        rect.right,
        slope*rect.right + lift
    ));

    for (auto& p : points)
        cerr << string(p) << ", ";
    cerr << endl;

    vector<Point> result;
    copy_if(points.begin(), points.end(), back_inserter(result),
        [&rect](const Point &p){
            return within(p.x, rect.left, rect.right)
                && within(p.y, rect.top, rect.bottom);
        });

    // hor and vert might intersect in the same place, so reduce 2 points to 1
    auto end = result.end();
    for (auto it = result.begin(); it != end; ++it)
        end = remove(it + 1, end, *it);
    result.erase(end, result.end());

    return result;
}

int main()
{
    Rect search;
    cin >> search.right >> search.bottom; cin.ignore();

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
        pos.x = clamp(search.right  - pos.x + search.left, search.left, search.right);
        pos.y = clamp(search.bottom - pos.y + search.top , search.top , search.bottom);

        cerr << string(lastPos) << " -> " << string(pos) << endl;
        cerr << string(search) << endl;

        cout << int(pos.x) << " " << int(pos.y) << endl;
        cin >> bomb_clue; cin.ignore();

        // Narrow the search space about the reflection line

        auto intersects = getIntersectionPoints(pos, lastPos, search);

        cerr << "intersects size=" << intersects.size() << endl;
        // for (const auto& p : intersects)
        for (int i = 0; i < intersects.size(); ++i)
            cerr << i << ": " << string(intersects[i]) << endl;

        if (intersects.size() != 2) {
            cerr << "This is, uh... empty." << endl;
            throw 1;
        }

        Point a = intersects[0];
        Point b = intersects[1];

        search.left = clamp(min(int(a.x), int(b.x)), search.left, search.right);
        search.right = clamp(max(int(a.x), int(b.x)), search.left, search.right);
        search.top = clamp(min(int(a.y), int(b.y)), search.top, search.bottom);
        search.bottom = clamp(max(int(a.y), int(b.y)), search.top, search.bottom);
    }
}