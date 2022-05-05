#include <iostream>
#include <sstream>
#include <string>

using namespace std;


class Point {
public:
  int x;
  int y;

  Point() : x(0), y(0) {}
  Point(const int x, const int y) : x(x), y(y) {}
  Point(const Point &p) : x(p.x), y(p.y) {}

  operator string() const {
    stringstream s;
    s << x << " " << y;
    return s.str();
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

  Point operator/(double n) const {
    return Point(x/n, y/n);
  }
};


int main()
{
  int width, height;
  cin >> width >> height; cin.ignore();

  int maxTurns;
  cin >> maxTurns; cin.ignore();

  Point pos;
  cin >> pos.x >> pos.y; cin.ignore();

  Point topleft(0,0);
  Point bottomright(width,height);

  // game loop
  while (true) {
    string dir;
    cin >> dir; cin.ignore();

    // Reduce search space — exact col/row reduction is handled implicitly
    for (const auto &c : dir) {
      if (c == 'U')
        bottomright.y = pos.y - 1;
      else if (c == 'D')
        topleft.y = pos.y + 1;
      else if (c == 'L')
        bottomright.x = pos.x - 1;
      else if (c == 'R')
        topleft.x = pos.x + 1;
    }

    // Get search center
    pos = (bottomright - topleft) / 2 + topleft;

    cout << string(pos) << endl;
  }

}