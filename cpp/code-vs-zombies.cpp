#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace std;

const int MAX_DIST = 20000; // For sorting purposes; Board dimensions are such that no distance will exceed this.
const int MAX_INT = pow(2,31)-1;

const int ASH_SPEED = 1000;
const int SHOOT_DISTANCE = 2000;
const int ZOMBIE_SPEED = 400;

/*
== Here's the firm goal:
 - Turn the distance from a zombie to their target into a time score. I need that t-minus-until, ya dig?
 - Ash has a travel speed too; all zombs he can't reach in time get culled from consideration.
 - Ash's chosen target is assumed not to change until target-death since everything's on a linear path.
   This prevents Ash's target checking to get confused as he moves between two equidistant points.

== Improvements I'm sure I'll never make:
 - The zombie distance-to-tick calculator should consider the first three(?) points on their assumed path.
   This would better allow Ash to meet them at an optimal kill-point instead of lead-chasing them.
 - Trolley-problem calculation – The alg prioritizes fastest-to-die so fails this entirely.
   Obviously this would only matter if he detected he could only save one or the other.
 - Zombies can be kited by Ash if he maintains closest-human distance without entering the shotty zone.
   This is obviously the best strategy for combos, but it sounds complicated.

 - Hey, maybe try this with a simulation technique.
   Wasn't that one of the described goals of the excercise?
   I dunno. I had fun.
*/

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

    Point operator+ (const Point& other) const {
        return Point(x + other.x, y + other.y);
    }

    Point operator- () const {
        return Point(-x,-y);
    }

    Point operator-(const Point& other) const {
        return -other + *this;
    }

    Point abs() const {
        return Point(::abs(x), ::abs(y));
    }

    double distanceTo(const Point& other) const {
        Point vec = (other -(*this)).abs();
        return sqrt(vec.x*vec.x + vec.y*vec.y);
    }
};

struct Entity {
    int id;
    Point location;
    Point target;
    int targetId;
    double priorityScore;
    bool abandoned = false;
};

vector<Entity> readSurvivors(int count) {
    vector<Entity> list;
    for (int i = 0; i < count; ++i) {
        Entity survivor;
        cin >> survivor.id
            >> survivor.location.x >> survivor.location.y;
            cin.ignore();
        survivor.target = Point(survivor.location);
        list.push_back(survivor);
    }
    return list;
}

vector<Entity> readZombies(int count) {
    vector<Entity> list;
    for (int i = 0; i < count; ++i) {
        Entity zombie;
        cin >> zombie.id
            >> zombie.location.x >> zombie.location.y
            >> zombie.target.x >> zombie.target.y;
            cin.ignore();
        list.push_back(zombie);
    }
    return list;
}

struct GetTargetOptions {
    Entity& ash;
    int survivor_count;
    vector<Entity>& survivors;
    int zombie_count;
    vector<Entity>& zombies;
};

namespace GetTarget {
    Entity survivorByIndex(const GetTargetOptions& args);
    Entity zombieByIndex(const GetTargetOptions& args);
    Entity triageByTime(const GetTargetOptions& args);
}

int main()
{
    int prioritizedId = -1;

    // game loop
    while (1) {
        ////// Acquire Game State
        Entity ash;
        ash.id = -1;
        cin >> ash.location.x >> ash.location.y; cin.ignore();
        ash.target = Point(ash.location);

        int survivor_count;
        cin >> survivor_count; cin.ignore();
        vector<Entity> survivors = readSurvivors(survivor_count);

        int zombie_count;
        cin >> zombie_count; cin.ignore();
        vector<Entity> zombies = readZombies(zombie_count);

        ////// Get target entity
        auto matchingId = [prioritizedId](Entity zombie) { return zombie.id == prioritizedId; };
        Entity target = (any_of(zombies.begin(), zombies.end(), matchingId))
            ? *find_if(zombies.begin(), zombies.end(), matchingId)
            : GetTarget::triageByTime({ash, survivor_count, survivors, zombie_count, zombies});

        prioritizedId = target.id;
        
        // Final instruction yield
        cout << string(target.target) << " target " << target.id << endl;
    }
}

Entity GetTarget::survivorByIndex(const GetTargetOptions &args) {
    auto [ash, survivor_count, survivors, zombie_count, zombies] = args;
    return *survivors.begin();
}

Entity GetTarget::zombieByIndex(const GetTargetOptions &args) {
    auto [ash, survivor_count, survivors, zombie_count, zombies] = args;
    return *zombies.begin();
}

Entity GetTarget::triageByTime(const GetTargetOptions &args) {
    auto [ash, survivor_count, survivors, zombie_count, zombies] = args;

    // Calc zombie priority scores
    for (auto& zombie : zombies) {
        double distToAsh = zombie.location.distanceTo(ash.location);
        double distClosestSurvivor = MAX_INT;
        Entity closestTarget;

        // Get dist for closest target
        for (auto& survivor : survivors) {
            double distTosurvivor = zombie.location.distanceTo(survivor.location);
            if (distTosurvivor < distClosestSurvivor) {
                distClosestSurvivor = distTosurvivor;
                closestTarget = survivor;
            }
        }

        double distAshToZombie = zombie.location.distanceTo(ash.location);
        bool targetIsAsh = (distAshToZombie < distClosestSurvivor);

        double distAshToSurvivor = closestTarget.location.distanceTo(ash.location);
        distAshToSurvivor = max(0.0, distAshToSurvivor - SHOOT_DISTANCE*0.9);

        double survivorTicks = distClosestSurvivor / ZOMBIE_SPEED;
        double ashTicks = distAshToSurvivor / ASH_SPEED;
        zombie.targetId = (targetIsAsh) ? -1 : closestTarget.id;
        zombie.priorityScore = (targetIsAsh)
            ? MAX_INT
            : survivorTicks - ashTicks;

        // Flag this survivor as 'abandoned' to prevent vain rescue attempts.
        if (zombie.priorityScore <= 0.0)
            closestTarget.abandoned = true;

        // Target metrics monitor
        cerr << fixed << setprecision(2) 
            << zombie.id << "z "
            << zombie.targetId << "h ";
        if (targetIsAsh) 
            cerr << "inf";
        else
            cerr << zombie.priorityScore << "p ";
        cerr << endl;
    };

    auto idIsAbandoned = [survivors](int id) {
        if (id < 0)
            return true;

        Entity survivor = *find_if(survivors.begin(), survivors.end(),
            [id](Entity survivor) { return survivor.id == id; });
        return survivor.abandoned;
    };

    vector<Entity> availableTargets;
    copy_if(zombies.begin(), zombies.end(), back_inserter(availableTargets),
        [&](const Entity& zombie) {
            return zombie.priorityScore > 0.0
                && !idIsAbandoned(zombie.targetId); });

    if (availableTargets.size() == 0) {
        availableTargets = zombies;
        for_each(availableTargets.begin(), availableTargets.end(),
            [ash](Entity& zombie){ zombie.priorityScore = zombie.location.distanceTo(ash.location); });
    }

    Entity prioritizedTarget = *min_element(availableTargets.begin(), availableTargets.end(),
        [](const Entity& a, const Entity& b) { return (a.priorityScore < b.priorityScore); });

    return prioritizedTarget;
}

