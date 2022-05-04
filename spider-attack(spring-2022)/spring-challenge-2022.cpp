#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <numeric>
#include <algorithm>
#include <cmath>
#include <map>

using namespace std;

/* Plans

[x] Frame-persistent Heroes: consistent target tracking, etc.
[ ] State-machine-like roles: Defender, Offender, Pusher, Controller, w/e, etc.
    This would affect parameters like resting venture distance.
[ ] Extreme defense with offensive modulation later on. Defender > Offender.
  [ ] In rare circumstances should there be fewer than two heroes in my base zone.
  [ ] Although, they should spend more time around the perimeter.
      Pace it, actually; I'll recognize threats sooner.
[ ] [Later] Wild mana: I suspect the win condition in the meta. It is true that
    offensive play would build mana for defensive plays later. The middle is like
    a foraging zone, then.
[ ] CONTROLing a bug changes their linear direction. They only change "back" within
    your base zone because the base is delicious, obviously.

1. Determine 3 most present threats
2. Determine among the 6 permutations which experiences the least collective travel distance.

I could potentially have all my soldiers pick their favorite target and mark them
so no one else will, and then have a "communication" phase after that where they
trade targets based on the travel distance being minimized.

When mana foraging, boys should massively spread out; we don't actually
need to kill anything to get it. Spreading out would maximize potential
mana gain (I think) and it would diversify the points of recovery when
defense becomes an issue.

[ ] What does my AI do if I'm player 2?

*/

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

  Point apply(int f(int)) const {
    return Point(f(x), f(y));
  }

  Point abs() const {
    return Point(::abs(x), ::abs(y));
  }

  double distanceTo(const Point &other) const {
    Point vec = (other - *this).abs();
    return sqrt(vec.x * vec.x + vec.y * vec.y);
  }
};

enum class EntityType {
  Monster = 0,
  Hero = 1,
  Opponent = 2,
};

enum class PlayerTarget {
  Neutral = 0,
  Allied = 1,
  Opponent = 2,
};

//////////
// Constants

const Point BOARD_DIM = Point(17630, 9000);
const Point BOARD_CENTER = Point(BOARD_DIM.x * .5, BOARD_DIM.y * .5);
const int BASE_SIGHT_RADIUS = 6000;
const int BASE_DETECTION_RADIUS = 5000;
const int BASE_DAMAGE_RADIUS = 300;
const int HERO_SIGHT_RADIUS = 2200;
const int HERO_ATTACK_RADIUS = 800;
const int HERO_SPEED = 800;
const int HERO_ATK_POWER = 2;
const int MONSTER_SPEED = 400;
const int MANA_PER_ATTACK = 1;
const int MANA_COST = 10;

/** A container for raw inputs from the game terminal. */
class EntityData {
public:
  int id;
  EntityType type;
  Point position;
  Point speed;
  int hp;
  int shieldLife;
  bool isControlled;
  bool nearBase;
  PlayerTarget threatFor;

  void read() {
    int tmp;

    cin >> id;
    cin >> tmp; type = (EntityType)tmp;
    cin >> position.x >> position.y;
    cin >> shieldLife;
    cin >> isControlled;

    // Next 5 ints only for monsters, will be (-1) for heroes.
    if (type == EntityType::Monster) {
      cin >> hp;
      cin >> speed.x >> speed.y;
      cin >> nearBase;
      cin >> tmp;
      threatFor = (PlayerTarget)tmp;
    }

    // Discard remaining tokens
    string s;
    getline(cin, s);
  }
};

/** Basic, frame-persistent entity object. */
class Entity {
public:
  EntityData data;

  void fill(EntityData &data) {
    this->data = data;
  }

  string nameId() const {
    map<EntityType, string> ent_name {
      {EntityType::Monster,  "Mon"},
      {EntityType::Hero,     "Hero"},
      {EntityType::Opponent, "Opp"}
    };
    stringstream s;
    s << ent_name[data.type] << " " << data.id;
    return s.str();
  }

  operator string() {
    stringstream s;
    s << data.id << " "
      << int(data.type) << "t "
      << string(data.position) << " "
      << data.shieldLife << "sh "
      << "cont=" << data.isControlled << " ";
    if (data.type == EntityType::Monster)
      s << "next " << string(data.speed) << " "
        << data.hp << "hp "
        << "nearBase=" << data.nearBase << " "
        << "threatFor=" << int(data.threatFor) << " ";
    return s.str();
  }
};

/** Built as a repository for process variables. */
class Monster : public Entity {
public:
  // process variables

  double distToTarget = 0;  // 'Target' being the base it's headed for.
  int targetedCount = 0;    // How many heroes are currently aiming at this target.

  // Estimates the ideal number of heroes who would be fighting this thing. A 'double' because it's more of a score.
  double idealTargetCount() const {
      // FYI, this depends on distToTarget being filled in, which I can't guarantee here in this class, or I haven't anyway, and that's bad design. No bueno.
    double stepsToBase = distToTarget / MONSTER_SPEED;
    double hitsToKill = data.hp / 2.0;
    double buffer = .35;
    return hitsToKill / stepsToBase + buffer;  // This should be .5 -> 1 hero, or 1.67 -> 2 heroes
  }

  // ~Monster() {
  //   cerr << nameId() << " forgotten" << endl;
  // }
};

// TODO Learn how to pre-declare class interfaces to avoid this Monster->Base->Hero interwoven structure.
class Base {
public:
  const PlayerTarget id;
  const Point position;
  const int numHeroes;
  int hp;
  int mana;
  bool isPlayer1 = false;

  const vector<Point> sentryPoses;

  vector<Monster> known_monsters;
  vector<Monster> threats;

  Base(PlayerTarget playerId, Point pos, int n_heroes)
  : id(playerId),
    position(pos),
    numHeroes(n_heroes),
    isPlayer1(Point() == pos),
    sentryPoses(getSentryPoses())
  { }

  void update() {
    cin >> hp >> mana;
    cin.ignore();
  }

  void assembleThreatList(vector<Monster> &monsters) {
    known_monsters = monsters;
    threats.clear();

    for (auto monster : monsters) {
      if (monster.data.threatFor != id)
        continue;

      if (id == PlayerTarget::Allied)
        monster.distToTarget = monster.data.position.distanceTo(position);

      threats.push_back(monster);
    }

    sort(threats.begin(), threats.end(),
      [](const Monster &a, const Monster &b) {
        return a.idealTargetCount() < b.idealTargetCount();
      });
  }

  bool threatsAccountedFor() const {
    if (threats.size() == 0)
      return true;
    return all_of(threats.begin(), threats.end(),
      [](const Monster &m){ return m.targetedCount >= m.idealTargetCount(); });
  }

  operator string() const {
    stringstream s;
    s << string(position) << " " << hp << "hp " << mana << "m";
    return s.str();
  }

private:

  /** Called on construction, calculates resting sentry poses for heroes. */
  const vector<Point> getSentryPoses() const {
    vector<Point> points;
    const int numPoints = numHeroes + 1;

    const double eta = 3.14159 * 0.5;
    const double p2rotation = (isPlayer1) ? 0 : eta*2;
    const Point p2displacement = (isPlayer1) ? Point() : BOARD_DIM;
    const double radius = BASE_SIGHT_RADIUS;
    const double fract_angle = eta / numPoints;
    for (int i = 1; i < numPoints; ++i) {
      double angle = fract_angle * i + p2rotation;
      points.push_back(
        Point( radius*cos(angle), radius*sin(angle) ) + p2displacement
      );
    }

    cerr << "Setup: p1=" << isPlayer1 << " pos=" << string(position) << endl;
    cerr << "First point: " << string(*points.begin()) << endl;

    if (points.size() != numHeroes)
        cerr << "You messed up the sentry poses function, dude." << endl;

    return points;
  }

};

enum class HeroRole {
    Defender,
    Attacker,
};

Monster DEFAULT_MON = Monster();

class Hero : public Entity {
public:
  Base* parent;
  bool nowTargeting;
  Monster& target = DEFAULT_MON;
  HeroRole role;
  Point restingPosition;

  int baseId;

  Point goal() const {
    if (nowTargeting) {
      cerr << nameId() << " -> " << target.nameId() << endl;
      return getAttackPose(target);
    }
    return restingPosition;
  }

  // Hero(Base& base) : parent(base) { }
  // TODO I realize this is unsafe, but I couldn't get the above constructor to work with map<>.
  void init(Base& base, const EntityData& data) {
    parent = &base;
    baseId = data.id % parent->numHeroes;
  }

  void processData() {
    restingPosition = data.position;  // By default, where we are now.
    nowTargeting = false;             // By default, no target.

    // Determine behavioral mode for this frame
    role = (baseId != 1) ? HeroRole::Defender : HeroRole::Attacker;
  }

  void setTarget(Monster& monster) {
    target = monster;
    target.targetedCount = target.targetedCount + 1;
    cerr << monster.nameId() << " mtc=" << monster.targetedCount << " ttc=" << target.targetedCount << endl;
      // TODO *Sigh*... I can't get this increment out of this function.
      // The process-repository pattern, so oft-used in my own work that I coined it myself, requires a long-ass ass-fuck unbroken reference chain in Cpp.
      // Not undoable, I'm certain, but jesus fuck impractical.
      // God, this is so irritating.
      // If I'm not going to just restart in another language to rank high,
      // I ~think~ I could do this with a singleton lookup service? Like, "Give me this ID" -> "Wham, bam, thank you." and then I have the object.
    nowTargeting = true;
  }

  void determineGoal() {
    cerr << nameId() << " threats=";
    if (parent->threatsAccountedFor())
      cerr << "OK";
    else
      cerr << parent->threats.size();
    cerr << endl;
    if (parent->threatsAccountedFor())
      explore();
    else
      attack();
  }

  Point getBaseRestingPose() const {
    Point basePos = parent->position;
    auto poses = parent->sentryPoses;

    double factor = (role == HeroRole::Defender) ? 0.85 : 1.15;
    Point resting_vector = poses.at(baseId % poses.size());
    return (resting_vector - basePos) * factor + basePos;
  }

  Point getAttackPose(const Monster& monster) const {
    vector<Monster> known_monsters = parent->known_monsters;

    vector<Monster> nearby_monsters;
    nearby_monsters.push_back(monster);   // Always include self: nearby_mons is never empty

    copy_if(known_monsters.begin(), known_monsters.end(), back_inserter(nearby_monsters),
      [monster](Monster& other) {
        bool notTarget = monster.data.id != other.data.id;
        bool nearby = monster.data.position.distanceTo(other.data.position) < HERO_ATTACK_RADIUS*1.66;
        return notTarget && nearby;
      });

    vector<Point> nearby_points;
    for (auto monster : nearby_monsters)
      nearby_points.push_back(monster.data.position + monster.data.speed);

    Point average_position = accumulate(nearby_points.begin(), nearby_points.end(), Point()) / nearby_monsters.size();

    // Pick a destination some distance ahead of the target proportional
    // to the Hero's distance to the target; more efficient pathing.
    double dist = target.data.position.distanceTo(data.position);
    double distFactor = dist / HERO_ATTACK_RADIUS;
    Point projected = average_position + target.data.speed * distFactor;

    return projected;
  }

  void explore() {
    restingPosition = getBaseRestingPose();
    cerr << nameId() << " c:Explore" << endl;
    
    auto monsters = parent->known_monsters;

    if (monsters.size() == 0)
        return;

    vector<Monster> culled_monsters;

    copy_if(monsters.begin(), monsters.end(), back_inserter(culled_monsters),
      [this](Monster& monster) {
        double distFromSelf = monster.data.position.distanceTo(data.position);
        bool closeToSelf = distFromSelf < HERO_ATTACK_RADIUS*2.5;
        bool farFromBase = (role == HeroRole::Defender && monster.distToTarget > BASE_SIGHT_RADIUS*1.25);
        bool marked = (monster.targetedCount > 0);
        return closeToSelf && !farFromBase && !marked;
      });

    if (culled_monsters.size() == 0)
      return;

    auto closest = min_element(culled_monsters.begin(), culled_monsters.end(),
      [this](const Monster &a, const Monster &b) {
        double a_dist = a.data.position.distanceTo(this->data.position);
        double b_dist = b.data.position.distanceTo(this->data.position);
        return a_dist < b_dist;
      });

    setTarget(*closest);
  }

  void attack() {
    auto threats = parent->threats;
    cerr << nameId() << " c:Attack" << endl;

    vector<Monster> culled_threats;
    copy_if(threats.begin(), threats.end(), back_inserter(culled_threats),
      [](Monster &m) {
        return m.targetedCount < m.idealTargetCount();
      });

    if (culled_threats.size() == 0)
      culled_threats = threats;

    auto closest = min_element(culled_threats.begin(), culled_threats.end(),
      [this](const Monster &a, const Monster &b) {
        double a_dist = a.data.position.distanceTo(this->data.position);
        double b_dist = b.data.position.distanceTo(this->data.position);
        return a_dist < b_dist;
      });

    setTarget(*closest);

    // Copy comparison test
    int closestId = closest->data.id;
    auto findId = [closestId](Monster &m) { return m.data.id == closestId; };
    cerr << nameId() << " ======" << endl;;
    cerr << "Final  tc=" << closest->targetedCount << endl;
    // cerr << "Culled tc=" << find(culled_threats.begin(), culled_threats.end(), findId)->targetedCount << endl;
    // cerr << "Threat tc=" << find(threats.begin(), threats.end(), findId)->targetedCount << endl;
    // cerr << "Parent tc=" << find(parent->threats.begin(), parent->threats.end(), findId)->targetedCount << endl;
  }

  string getCommand() {
    stringstream s;
    s << "MOVE " << string(goal());
    return s.str();
  }

};

class Opponent : public Entity {
public:
  void processData() {
    // stub
  }
};


////////////////////////////////////////
////////  Main                  /////////
//////////////////////////////////////////

int main() {
  Point base_pos;
  int heroes_per_player;
  cin >> base_pos.x >> base_pos.y;
  cin.ignore();
  cin >> heroes_per_player;
  cin.ignore();

  Base allyBase(PlayerTarget::Allied, base_pos, heroes_per_player);
  Base oppBase(PlayerTarget::Opponent, BOARD_DIM - base_pos, heroes_per_player);

  vector<EntityData> entity_data;

  // maps for inter-frame, object-entity id matching
  vector<Monster> monsters;
  map<int, Hero> known_heroes;
  map<int, Opponent> known_opponents;

  // TODO A first-frame/rest-frames dynamic would be nice.

  // game loop
  while (1) {

    // Reset
    entity_data.clear();
    monsters.clear();

    ////// Read from cin phase

    allyBase.update();
    oppBase.update();

    // Fill entity list
    int seeable_entity_count;
    cin >> seeable_entity_count;
    cin.ignore();

    for (int i = 0; i < seeable_entity_count; i++) {
      EntityData e; e.read();
      entity_data.push_back(e);
    }

    for (auto data : entity_data) {
      switch (data.type) {
        case (EntityType::Monster):
        {
          Monster m;
          m.fill(data);
          monsters.push_back(m);
          break;
        }
        case (EntityType::Hero):
        {
          if (known_heroes.find(data.id) == known_heroes.end())
            known_heroes[data.id].init(allyBase, data);
          known_heroes[data.id].fill(data);
          break;
        }
        case (EntityType::Opponent):
          known_opponents[data.id].fill(data);
          break;
      }
    }

    ////// Configure instructions for this frame phase

    allyBase.assembleThreatList(monsters);

    for (auto& [id, hero] : known_heroes)
      hero.processData();

    for (auto& [id, hero] : known_heroes) {
      hero.determineGoal();
      cout << hero.getCommand() << endl;
    }

    for (Monster& m : monsters) {
      if (m.targetedCount > 0)
        cerr << m.nameId() << " " << m.targetedCount << endl;
    }

    // TODO Distance optimizing.
    // If two heroes have goals which can be distance minimized by trading,
    // then they will trade targets and HeroRoles; like a soul-swap.

  }

}
