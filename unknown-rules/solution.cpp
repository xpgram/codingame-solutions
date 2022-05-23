#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

/**
 * We have figured out that this is Pacman.
 * Well, maybe.
 * 
 * # chars are walls, _ chars are open space. I represent point-entities with +,
 * and the 5th point-entity seems to be the one I control.
 * 
 * Hugging the left wall of the maze doesn't achieve much because the maze has islands.
 * 
 * I seem to die when touching other +, but only 2/4? I'm not sure what that's about.
 * Further testing is needed.
 * 
 * Unlike Pacman, I don't actually collect anything. That I know of.
 * My score sometimes improves by travelled distance, maybe it's tied to how much of the
 * map I've scouted?
 * 
 * A E D C are directional movement instructions.
 * I still don't know what B does. Perhaps it intentionally does nothing.
 * 
 * The outer edges of the space are not bounded by walls, which means I need to. *sigh*
 * 
 * Some initializations (M4L2 to M6L2) are broken for some reason.
 * I'm sure it has something to do with invalid accessors to map[x][y].
 * 
 * In the later stages, it seems at least one point-entity chases me.
 * Very Pacman. Yes yes.
 * 
 * Any other notes? I don't remember.
 */

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

  /** Rotates this vector by the given vector's implicit-angle from the +x-axis. */
  Point rotateByComplex(Point vec) const {
    // vec = vec.unitVector();
    return Point(
      (x * vec.x) - (y * vec.y),
      (x * vec.y) + (y * vec.x)
    );
  }

};

namespace Dirs {
  Point Up(0,-1);
  Point Down(0,1);
  Point Left(-1,0);
  Point Right(1,0);

  Point Forward(Right);
  Point Backward(Left);
  Point LeftTurn(Up);
  Point RightTurn(Down);
}

struct Board
{
  int width, height, numPoints;
};

struct Walls
{
  string up, down, left, right;

  string wallFromOrthogonal(const Point &p) const {
    return
      (p == Dirs::Up)
        ? up
      : (p == Dirs::Down)
        ? down
      : (p == Dirs::Left)
        ? left
      : right;
  }

  string cmdFromOrthogonal(const Point &p) const {
    return
      (p == Dirs::Up)
        ? "C"
      : (p == Dirs::Down)
        ? "D"
      : (p == Dirs::Left)
        ? "E"
      : (p == Dirs::Right)
        ? "A"
      : "B";
  }
};

class Player {
public:
  Point tvec;

  Player() : tvec(1,0) { }

  string nextCmd(const Walls &local) {
    Point left(tvec.rotateByComplex(Dirs::LeftTurn));
    Point right(tvec.rotateByComplex(Dirs::RightTurn));
    Point back(tvec.rotateByComplex(Dirs::Backward));
    
    if (local.wallFromOrthogonal(left) == "_")
      tvec = left;
    else if (local.wallFromOrthogonal(tvec) == "_")
      tvec = tvec;
    else if (local.wallFromOrthogonal(right) == "_")
      tvec = right;
    else
      tvec = back;
    
    return local.cmdFromOrthogonal(tvec);
  }

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
  Board board;
  Walls local;
  Player player;

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
    // cerr << " " << local.up << endl;
    // cerr << local.left << " " << local.right << endl;
    // cerr << " " << local.down << endl;

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

    cout << player.nextCmd(local) << endl;
  }
}