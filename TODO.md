create instance with rates, charts etc

test journey from a fixed point.. e.g. for checking progress and overlevel from that one

add batch quest warning

allow split of batched quests - just consider them as separate quests

save reason why certain step was made - eg prevent overleveling, reach next target monster, etc
logic tests
refactor
code quality
choose monsters from db
quests from db?

Allow user to choose exp tables and rates
Different goals agnostic? Its kind of job 50 now only

Better metric - time to kill mob, do quest, number of quests
Better UI
Toggle to allow some wasted exp fixed or % or max level
terminate early if also reached target level


sort by estimated total kills but remove only by actual total kills
add ignore overlevel under specific conditions
- like always, or only when reaching target goal shortly etc 
- work with OVERLEVEL_PROTECTION
add extra UI stuff like decisions to kill monsters to prevent overlevel and also that some exp were potentionally wasted
binary search tree for overlevel protection
find minimum level test

sorting metric -> highest prio = highest completed quest, then if same lowest killed mobs