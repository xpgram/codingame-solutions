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

TODO This method suffers some redundancies.
It alternates between the left and right edges of the search area, so
when it moves to the other side, but the clue is colder, the area shrinks
*away* from your current location, which means Batman has to spend an
entire turn repositioning himself before he can start narrowing the
space again.
I could reflect about the middle, wherever I want the midline to be,
but this won't work against the building's borders.

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

    string logStr() const {
        stringstream s;
        s << fixed << setprecision(2)
          << x << " " << y;
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

    bool xfound = (search.left + 1 == search.right);
    bool nearSide = false;


    // game loop
    while (1) {
        // Record position pre-movement
        lastPos = pos;

        // Get new position and derivative points
        nearSide = !nearSide;
        if (!xfound) {
          pos.x = (nearSide) ? search.left : search.right-1;
        } else {
          pos.y = (nearSide) ? search.top : search.bottom-1;
        }

        travel = pos - lastPos;
        mid = lastPos + travel/2.0;

        // Report and yield instruction
        cerr << string(search) << endl;
        cerr << string(lastPos) << " -> " << string(pos) << endl;
        cerr << "mid= " << mid.logStr() << endl;

        cout << int(pos.x) << " " << int(pos.y) << endl;

        // Get clue, calculate next search bounds
        cin >> bomb_clue; cin.ignore();

        // Function which gets new search-space limits for an axis
        auto getNewLimits = [](double mid, double travel, string clue, double min, double max) {
          cerr << "checking " << mid << " " << travel << " " << clue << endl;

          if (clue == "SAME") {
            min = mid;
            max = mid + 1;
          } else if (travel > 0 && clue == "WARMER" || travel < 0 && clue == "COLDER")
            min = mid + 1;
          else
            max = mid;
          
          cerr << "new bounds = " << floor(min) << " , " << ceil(max) << endl;
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

        if (!xfound && search.left + 1 == search.right) {
          cerr << "solved: x = " << search.left << endl;

          // Move into position; discard confusing bomb clue
          if (pos.x != search.left) {
              pos.x = search.left;
              cout << int(pos.x) << " " << int(pos.y) << endl;
              cin >> bomb_clue; cin.ignore();
          }

          // Ensure next y-axis move is not to same pos
          nearSide = (pos.y == search.top);

          xfound = true;
        }
    }
}