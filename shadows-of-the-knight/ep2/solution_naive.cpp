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

template <typename T>
int sign(T val) {
  return (T(0) < val) - (val < T(0));
}

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


int main()
{
    Rect search;
    cin >> search.right >> search.bottom; cin.ignore();

    int n; // maximum number of turns before game over.
    cin >> n; cin.ignore();
    cerr << "max turns = " << n << endl;

    Point pos, lastPos, travel, mid;
    cin >> pos.x >> pos.y; cin.ignore();
    cerr << "starting pos = " << string(pos) << endl;

    string bomb_clue;
    cin >> bomb_clue; cin.ignore();     // dispose of 'UNKNOWN'

    bool xfound = false;


    // game loop
    while (1) {
        // Record position pre-movement
        lastPos = pos;

        // Get new position and derivative points
        if (!xfound) {
          pos.x = (search.left + search.right) / 2;
          if (pos.x == lastPos.x)
            pos.x = search.left;
        } else {
          pos.y = (search.top + search.bottom) / 2;
          if (pos.y == lastPos.y)
            pos.y = search.top;
        }

        pos = pos.apply(floor);

        travel = pos - lastPos;

        mid = lastPos + travel/2.0;

        // Report and yield instruction
        cerr << string(search) << endl;
        cerr << string(lastPos) << " -> " << string(pos) << endl;

        cout << int(pos.x) << " " << int(pos.y) << endl;

        // Get clue, calculate next search bounds
        cin >> bomb_clue; cin.ignore();

        // Function which gets new search-space limits for an axis
        auto getNewLimits = [](double mid, double travel, string clue, double min, double max) {
          if (clue == "SAME") {
            min = ::min(mid, mid+travel);
            max = ::max(mid, mid+travel) + 1;
          } else if (travel > 0 && clue == "WARMER" || travel < 0 && clue == "COLDER")
            min = mid + 1;
          else
            max = mid - 1;
          
          return make_tuple(floor(min), ceil(max));
        };

        double nxt_min, nxt_max;

        if (!xfound) {
          tie(nxt_min, nxt_max) = getNewLimits(mid.x, travel.x, bomb_clue, search.left, search.right);
          search.left = nxt_min;
          search.right = nxt_max;
        }
        else {
          tie(nxt_min, nxt_max) = getNewLimits(mid.y, travel.y, bomb_clue, search.top, search.bottom);
          search.top = nxt_min;
          search.bottom = nxt_max;
        }

        if (search.left + 1 == search.right) {
          cerr << "solved: x = " << search.left << endl;
          pos.x = search.left;
          xfound = true;
        }

    }
}