terminate whole tree if new found and waiting ones are bad already
-find earliest point where optimization makes sense, otherwise terminate early - like if all exp quests later gave no wasted exp, without any monsters between then the later part cant be optimized anymore

TODO determine absolute best was found and quit.. 
-if too many iterations without result?
- or if the steps are perfect - minimum overflows (monster edges) between quests

create instance with rates, charts etc

optimization
-save on lookups, etc

test journey from a fixed point.. e.g. for checking progress and overlevel from that one

add batch quest warning

binary tree search for level based on exp? other optimizations
allow split of batched quests - just consider them as separate quests

save reason why certain step was made - eg prevent overleveling, reach next target monster, etc
logic tests
refactor
code quality
better global flags handling - rates etc
choose correctly dataset baseexp, jobexp
choose monsters from db
quests from db?
functions for base and job separately cause often it uses explicitely one param as 0 and uses only result for one param

exp point - class associated get raw, get level

toggle to allow some wasted exp fixed or % or max level

optimize will overlevel - can probably be replaced with cap exp reward and compare

goal 50 job
