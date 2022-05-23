#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

class Point
{
public:
  int x;
  int y;

  Point() : x(0), y(0) {}
  Point(const int x, const int y) : x(x), y(y) {}
  Point(const Point &p) : x(p.x), y(p.y) {}

  operator string() const
  {
    stringstream s;
    s << x << " " << y;
    return s.str();
  }

  bool operator==(const Point &other) const
  {
    return x == other.x && y == other.y;
  }

  Point operator+(const Point &other) const
  {
    return Point(x + other.x, y + other.y);
  }

  Point operator-() const
  {
    return Point(-x, -y);
  }

  Point operator-(const Point &other) const
  {
    return -other + *this;
  }

  Point apply(int f(int)) const
  {
    return Point(f(x), f(y));
  }

  Point abs() const
  {
    return Point(::abs(x), ::abs(y));
  }

  double distanceTo(const Point &other) const
  {
    Point vec = (other - *this).abs();
    return sqrt(vec.x * vec.x + vec.y * vec.y);
  }
};

struct init
{
  int width, height, numPoints;
};

struct walls
{
  string up, down, left, right;
};

void log(string label, int any)
{
  cerr << label << ": " << any << endl;
}

void log(string label, string any)
{
  cerr << label << ": " << any << endl;
}

int main()
{
  init board;
  walls local;

  cin >> board.width;
  cin.ignore();
  cin >> board.height;
  cin.ignore();
  cin >> board.numPoints;
  cin.ignore();

  // Setup map
  vector<vector<string>> map;
  for (int x = 0; x < board.width; ++x)
  {
    map.push_back(vector<string>());
    for (int y = 0; y < board.height; ++y)
      map[x].push_back(".");
  }

  // game loop
  int frame_count = -1;
  while (1)
  {
    ++frame_count;

    cin >> local.up;
    cin.ignore();
    cin >> local.right;
    cin.ignore();
    cin >> local.down;
    cin.ignore();
    cin >> local.left;
    cin.ignore();

    vector<Point> vectors;
    for (int i = 0; i < board.numPoints; i++)
    {
      Point v;
      cin >> v.x >> v.y;
      cin.ignore();
      vectors.push_back(v);
    }

    // Report given points
    for (Point &v : vectors)
    {
      log("p", v);
    }

    // Get player pos // TODO Accurate?
    Point pos = vectors[4];

    // Update map
    map[pos.x + 1][pos.y] = local.right;
    map[pos.x][pos.y + 1] = local.down;
    map[pos.x - 1][pos.y] = local.left;
    map[pos.x][pos.y - 1] = local.up;

    // Draw local
    cerr << " " << local.up << endl;
    cerr << local.left << " " << local.right << endl;
    cerr << " " << local.down << endl;

    // Draw map
    cerr << "w:" << board.width << " h:" << board.height << endl;
    for (int y = 0; y < board.height; ++y)
    {
      for (int x = 0; x < board.width; ++x)
      {
        Point p(x, y);
        string prnt = map[x][y];
        for (auto &ent : vectors)
          if (ent == p)
            prnt = "+";
        cerr << prnt;
      }
      cerr << endl;
    }

    // Output

    // E -> c.d     left
    // A -> c.b     right
    // D -> c.c     down
    // C -> c.a     up

    if (local.left == "_")
    {
      cout << "E" << endl;
    }
    else if (local.up == "_")
    {
      cout << "C" << endl;
    }
    else if (local.down == "_")
    {
      cout << "D" << endl;
    }
    else if (local.right == "_")
    {
      cout << "A" << endl;
    }
    else
    {
      cout << "B" << endl;
    }

    // if (chars.c == "_" && left)
    //     left = false;
    // if (chars.a == "_" && !left)
    //     left = true;

    // if (chars.b == "#")
    //     cout << "C" << endl;    // -y
    // else if (chars.d == "#")
    //     cout << "D" << endl;    // +y
    // else if (chars.c == "#" && left)
    //     cout << "E" << endl;    // -x
    // else if (chars.a == "#" && !left) {
    //     cout << "A" << endl;    // +x
    // }
    // else
    //     cout << "B" << endl;    // ??

    // Are the options tied to the points given?
    // There are always 5 points.
  }
}