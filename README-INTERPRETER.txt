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
