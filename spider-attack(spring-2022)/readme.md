## Post Mortem

Blah blah blah.

I wrote stuff in C++.

It was slow.

Not the program, writing it.

So I switched to Typescript.

Then I did cool Typescript stuff.

Ended up with an infrastructure where Hero objects would assign themselves targets based on an FFXII-style list of gambits, trade their brains between each other based on who was closest to which target, and then go through a second list of special-case gambits which would override the first one, this last bit being what allowed them to cast Wind when they were overwhelmed or something.

I know that was one sentence.

The point is, I compartmentalized 'actions' a Hero would take into discrete little checks and executes, and that made them very easy to write.

Want somebody to sweep monsters toward the enemy base? Write a config object which defines the conditions it triggers under, what it does, and slot it into a list of skills arranged by priority for some AI mode, and now they do it. Neat.

I might be repeating myself, but this structure allowed me to focus on writing *behaviors* instead of one single process. It took a little while to implement, but once I had, adding the figurative 'sweep' example above was incredibly fast.

Aight, peace.