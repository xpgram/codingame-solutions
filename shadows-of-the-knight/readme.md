# Shadows of the Knight

`Puzzle`

A binary search problem where you have to find the correct window of a very large building. Every guess you give yields a clue about your position in relation to the correct window.

The general solution I have for Ep1, where the clues inform you which direction the window is from wherever you are, is to maintain a rectangle of the valid search space, warp to its center, and reduce based on the clue given. It's very, very simple.

In Ep2, where the clues are only "warmer" and "colder" by your typical pythagorean distance function, I was experimenting with the same search-space reduction strategy, but with any-shape polygons instead. The goal is to slice the search space in half, just like in a binary search, but without adherence to an axis line. So far it works. I'm still missing the last few steps, however. And I can't really say anything about efficiency yet. It does win over the naive solution by nature of solving for both axes at the same time, however.

Idea.

Wow.

Sorry, I'm thinking as I'm writing this.

If the goal is to reduce the search space by half... I think my naive solution wasn't doing that. Like, when it could have been. I mean, the polygon thing was fun, that was half the reason I was doing it, but I think I should go back to naive and modify the per-axis space reduction method. I think I was only reducing each turn by one fourth at best; that's why it was slow. I can't think of an argument why a diagonal midline should work any better, so long as the search space is always cut in half.
