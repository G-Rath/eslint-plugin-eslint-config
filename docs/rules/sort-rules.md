# Ensures that rules are sorted in a consistent order (`sort-rules`)

## Rule details

This rule checks that rules are arranged alphabetically by plugin then by name,
with core rules coming last.

Note that while this rule does contain an autofix, it's limited to sorting 10
"moves" at a time, and so may need to be applied multiple times.
