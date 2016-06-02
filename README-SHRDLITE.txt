A*:
A* is implemented using a linked list. We wanted to implement it using a 
priority queue, but since an entry in a priority queue cannot be removed 
with the existing implementation it did not make any sense to remove all 
objects and then add them again except for the one that should be removed. 
The linked list should be almost as effective. 

-------------------------------------------------------------------------------

Interpreter:
There is only the one file, Interpreter.ts.
There are comments in the code, explaining what happens.


The overall logical structure:
1. Interpret the initial entity, and if needed, the initial location's entity.
2. The interpret functions are defined recursively. An entity is interpreted by
    interpreting its object. An object is interpreted either by its color etc.,
    or by its object/location composition. A location is interpreted as each
    object that exists in the correct relation to the matching entities.
3. Check each match against the physical laws of the world, and add to
    interpretation if they do not break them.

-------------------------------------------------------------------------------

The planner works as follows:
A* is run with the current state as the start node. Outgoing edges from each
node are the states that are possible outcomes from picking something up or
dropping what is being held somewhere, with regard to the physical laws of the
world. The cost for each edge is the difference between the arms position and 
the position where the object should be picked up/dropped down.
The goal is checked by checking if the interpretations are fulfilled. 
The heuristic is calculated in different ways depending on the relation. It is 
a combination of the difference between the arms position and the position of 
the object or objects in the goal state, both concerning which stack and how 
many objects are above it/them.


When ambiguity occurs an error is thrown. 


No extensions have been implemented, except More fine-grained cost calculation, 
taking the height of the stacks into account. This is taken into account when 
calculating the heuristics.
